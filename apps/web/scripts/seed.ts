import { db } from "@formdrop/db";
import {
  user,
  account,
  forms,
  submissions,
  apiKeys,
  notifications,
  events,
  usage,
} from "@formdrop/db/schema";
import { faker } from "@faker-js/faker";
import { auth } from "../src/lib/auth";
import { eq } from "drizzle-orm";
import moment from "moment";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Clean up existing data (in reverse order of dependencies)
    console.log("🧹 Cleaning up existing data...");
    await db.delete(usage);
    await db.delete(events);
    await db.delete(apiKeys);
    await db.delete(notifications);
    await db.delete(submissions);
    await db.delete(forms);
    await db.delete(account);
    await db.delete(user);

    // Create test users using Better Auth API
    console.log("👤 Creating users...");

    const user1Email = faker.internet.email();
    const user2Email = faker.internet.email();

    console.log(`Creating user: ${user1Email}`);
    console.log(`Creating user: ${user2Email}`);

    // Create user 1
    await auth.api.signUpEmail({
      body: {
        name: "John Doe",
        email: user1Email,
        password: "password123",
        callbackURL: "/",
      },
    });

    // Create user 2
    await auth.api.signUpEmail({
      body: {
        name: "Jane Smith",
        email: user2Email,
        password: "password123",
        callbackURL: "/",
      },
    });

    // Wait a bit for the database to be consistent
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get all users to find the ones we just created
    const allUsers = await db.select().from(user);
    console.log(`Found ${allUsers.length} users in database`);

    const user1Data = allUsers.find(
      (u) => u.email.toLowerCase() === user1Email.toLowerCase(),
    );
    const user2Data = allUsers.find(
      (u) => u.email.toLowerCase() === user2Email.toLowerCase(),
    );

    if (!user1Data || !user2Data) {
      console.log(
        "Users in DB:",
        allUsers.map((u) => u.email),
      );
      console.log("Looking for:", user1Email, user2Email);
      throw new Error(
        "Failed to create users - they may require email verification",
      );
    }

    // Mark emails as verified
    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, user1Data.id));

    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, user2Data.id));

    const user1Id = user1Data.id;
    const user2Id = user2Data.id;

    console.log(`✅ Created 2 users with accounts and verified emails`);
    console.log(`   User 1: ${user1Email}`);
    console.log(`   User 2: ${user2Email}`);
    // Create buckets for user 1
    console.log("🪣 Creating forms...");
    const [contactForm, newsletterForm, feedbackForm] = await db
      .insert(forms)
      .values([
        {
          userId: user1Id,
          name: "Contact Form",
          slug: "contact1",
          description: "Main website contact form submissions",
          allowedDomains: ["example.com", "www.example.com"],
        },
        {
          userId: user1Id,
          name: "Newsletter Signups",
          slug: "newslet1",
          description: "Email newsletter subscription form",
          allowedDomains: ["example.com"],
        },
        {
          userId: user1Id,
          name: "Product Feedback",
          slug: "feedbac1",
          description: "Customer feedback and feature requests",
          allowedDomains: [],
        },
      ])
      .returning();

    // Create forms for user 2
    const [supportForm] = await db
      .insert(forms)
      .values([
        {
          userId: user2Id,
          name: "Support Tickets",
          slug: "support1",
          description: "Customer support form submissions",
          allowedDomains: ["support.example.com"],
        },
      ])
      .returning();

    console.log("✅ Created 4 forms");

    // Create submissions for contact form
    console.log("📝 Creating submissions...");
    const contactSubmissions = Array.from({ length: 15 }, () => ({
      formId: contactForm.id,
      payload: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        subject: faker.lorem.sentence(),
        message: faker.lorem.paragraphs(2),
        company: faker.company.name(),
      },
      ip: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent(),
      createdAt: faker.date.recent({ days: 30 }),
    }));

    const newsletterSubmissions = Array.from({ length: 25 }, () => ({
      formId: newsletterForm.id,
      payload: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        interests: faker.helpers.arrayElements(
          ["Product Updates", "Marketing", "Engineering", "Design"],
          { min: 1, max: 3 },
        ),
      },
      ip: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent(),
      createdAt: faker.date.recent({ days: 60 }),
    }));

    const feedbackSubmissions = Array.from({ length: 10 }, () => ({
      formId: feedbackForm.id,
      payload: {
        rating: faker.number.int({ min: 1, max: 5 }),
        feedback: faker.lorem.paragraphs(1),
        feature: faker.helpers.arrayElement([
          "Dashboard",
          "API",
          "Integrations",
          "Analytics",
        ]),
        wouldRecommend: faker.datatype.boolean(),
      },
      ip: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent(),
      createdAt: faker.date.recent({ days: 14 }),
    }));

    const supportSubmissions = Array.from({ length: 8 }, () => ({
      formId: supportForm.id,
      payload: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        priority: faker.helpers.arrayElement(["low", "medium", "high"]),
        category: faker.helpers.arrayElement([
          "Technical",
          "Billing",
          "General",
        ]),
        description: faker.lorem.paragraphs(2),
      },
      ip: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent(),
      createdAt: faker.date.recent({ days: 7 }),
    }));

    await db
      .insert(submissions)
      .values([
        ...contactSubmissions,
        ...newsletterSubmissions,
        ...feedbackSubmissions,
        ...supportSubmissions,
      ]);

    console.log("✅ Created 58 submissions");

    // Create usage data
    console.log("📊 Creating usage data...");

    const allSubmissions = [
      { userId: user1Id, submissions: contactSubmissions },
      { userId: user1Id, submissions: newsletterSubmissions },
      { userId: user1Id, submissions: feedbackSubmissions },
      { userId: user2Id, submissions: supportSubmissions },
    ];

    const usageMap = new Map<
      string,
      { userId: string; formId: string; period: string; count: number }
    >();

    for (const group of allSubmissions) {
      for (const sub of group.submissions) {
        const period = moment(sub.createdAt).format("YYYY-MM-DD");
        const key = `${sub.formId}-${period}`;

        if (usageMap.has(key)) {
          usageMap.get(key)!.count++;
        } else {
          usageMap.set(key, {
            userId: group.userId,
            formId: sub.formId,
            period,
            count: 1,
          });
        }
      }
    }

    if (usageMap.size > 0) {
      await db.insert(usage).values(Array.from(usageMap.values()));
    }

    console.log(`✅ Created ${usageMap.size} usage records`);

    console.log("✅ Created 4 API keys");

    // Create notifications
    console.log("🔔 Creating notifications...");
    await db.insert(notifications).values([
      {
        formId: contactForm.id,
        type: "email",
        target: "admin@example.com",
        enabled: "true",
      },
      {
        formId: contactForm.id,
        type: "webhook",
        target: "https://hooks.example.com/contact",
        enabled: "true",
      },
      {
        formId: newsletterForm.id,
        type: "email",
        target: "marketing@example.com",
        enabled: "true",
      },
      {
        formId: supportForm.id,
        type: "webhook",
        target: "https://hooks.example.com/support",
        enabled: "false",
      },
    ]);

    console.log("✅ Created 4 notifications");

    // Create events
    console.log("📊 Creating events...");
    await db.insert(events).values([
      {
        userId: user1Id,
        formId: contactForm.id,
        eventType: "form_created",
        details: { formName: contactForm.name },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId: user1Id,
        formId: contactForm.id,
        eventType: "submission_created",
        details: { submissionCount: 15 },
        createdAt: faker.date.recent({ days: 7 }),
      },
      {
        userId: user1Id,
        formId: null,
        eventType: "api_key_generated",
        details: { keyType: "public" },
        createdAt: faker.date.recent({ days: 5 }),
      },
      {
        userId: user2Id,
        formId: supportForm.id,
        eventType: "form_created",
        details: { formName: supportForm.name },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log("✅ Created 4 events");

    console.log("\n✨ Database seeded successfully!");
    console.log("\n📋 Summary:");
    console.log(`  - User 1: ${user1Email} / password123`);
    console.log(`  - User 2: ${user2Email} / password123`);
    console.log("  - 4 forms");
    console.log("  - 58 submissions");
    console.log("  - 4 API keys");
    console.log("  - 4 notifications");
    console.log("  - 4 events");
    console.log(`\n💡 Tip: Login with ${user1Email} / password123`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("\n✅ Seed completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  });
