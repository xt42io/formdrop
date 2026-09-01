import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@formdrop/db";
import { subscriptions } from "@formdrop/db/schema";
import { eq } from "drizzle-orm";
import {
  polar,
  checkout,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { emailOTP } from "better-auth/plugins";
import { OTPEmail } from "@/emails/OTPEmail";
import { getResend } from "@/lib/email";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "development" ? "sandbox" : "production",
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        try {
          console.log(`Sending OTP email to ${email}`);

          const { error } = await getResend().emails.send({
            from: "FormDrop <onboarding@mail.formdrop.co>",
            to: email,
            subject: "Your Verification Code",
            react: OTPEmail({ otp }),
          });

          if (error) {
            throw new Error(`Failed to send email: ${error.message}`);
          }

          console.log(`Sent OTP email to ${email}`);
        } catch (error) {
          console.error("Error sending email:", error);
        }
      },
      sendVerificationOnSignUp: true,
      otpLength: 6,
      expiresIn: 1500,
    }),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      getCustomerCreateParams: async ({ user }) => {
        const metadata: Record<string, string | number | boolean> = {};
        if (user.id) {
          metadata.userId = user.id;
        }
        return { metadata };
      },
      use: [
        checkout({
          products: [
            {
              productId: process.env.POLAR_PRODUCT_ID!,
              slug: "Pro Monthly",
            },
            {
              productId: process.env.POLAR_PRODUCT_ID_YEARLY!,
              slug: "Pro Yearly",
            },
          ],
          successUrl: "/welcome-to-pro?checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onSubscriptionCreated: async (payload) => {
            const subscription = payload.data;
            let userId =
              (subscription.metadata?.userId as string) ||
              (subscription.customer?.metadata?.userId as string) ||
              (subscription.customer?.externalId as string);

            if (!userId && subscription.customerId) {
              try {
                const customer = await polarClient.customers.get({
                  id: subscription.customerId,
                });
                userId =
                  (customer.metadata?.userId as string) ||
                  (customer.externalId as string);
              } catch (error) {
                console.error("Error fetching customer:", error);
              }
            }

            if (userId) {
              await db.insert(subscriptions).values({
                userId,
                polarId: subscription.id,
                plan: subscription.product.name,
                status: subscription.status as any,
                currentPeriodStart: new Date(subscription.currentPeriodStart),
                currentPeriodEnd: new Date(subscription.currentPeriodEnd!),
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              });
            }
          },
          onSubscriptionUpdated: async (payload) => {
            const subscription = payload.data;
            await db
              .update(subscriptions)
              .set({
                status: subscription.status as any,
                currentPeriodStart: new Date(subscription.currentPeriodStart),
                currentPeriodEnd: new Date(subscription.currentPeriodEnd!),
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                plan: subscription.product.name,
              })
              .where(eq(subscriptions.polarId, subscription.id));
          },
          onSubscriptionRevoked: async (payload) => {
            const subscription = payload.data;
            await db
              .update(subscriptions)
              .set({
                status: "canceled",
                cancelAtPeriodEnd: true,
              })
              .where(eq(subscriptions.polarId, subscription.id));
          },
        }),
      ],
    }),
  ],
});
