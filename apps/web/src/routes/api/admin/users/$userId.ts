import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { user, forms, submissions } from "@formdrop/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/admin/users/$userId")({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request;
        params: { userId: string };
      }) => {
        try {
          // Verify admin authentication
          const session = await auth.api.getSession({
            headers: request.headers,
          });
          if (!session?.user || session.user.role !== "admin") {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { userId } = params;

          // Get user details
          const [userDetail] = await db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              emailVerified: user.emailVerified,
              role: user.role,
              banned: user.banned,
              banReason: user.banReason,
              banExpires: user.banExpires,
              createdAt: user.createdAt,
            })
            .from(user)
            .where(eq(user.id, userId));

          if (!userDetail) {
            return new Response(JSON.stringify({ error: "User not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Get user's forms with submission counts
          const userForms = await db
            .select({
              id: forms.id,
              name: forms.name,
              createdAt: forms.createdAt,
              submissionCount: sql<number>`(
                SELECT COUNT(*)::int 
                FROM submissions 
                WHERE submissions.form_id = forms.id
                AND submissions.deleted_at IS NULL
              )`.as("submissionCount"),
            })
            .from(forms)
            .where(
              sql`${forms.userId} = ${userId} AND ${forms.deletedAt} IS NULL`,
            )
            .orderBy(sql`${forms.createdAt} DESC`);

          // Get user's recent submissions (last 20)
          const recentSubmissions = await db
            .select({
              id: submissions.id,
              formId: submissions.formId,
              formName: forms.name,
              createdAt: submissions.createdAt,
            })
            .from(submissions)
            .innerJoin(forms, eq(submissions.formId, forms.id))
            .where(
              sql`${forms.userId} = ${userId} AND ${submissions.deletedAt} IS NULL`,
            )
            .orderBy(sql`${submissions.createdAt} DESC`)
            .limit(20);

          return new Response(
            JSON.stringify({
              user: {
                ...userDetail,
                forms: userForms,
                recentSubmissions,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Error fetching user details:", error);
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
