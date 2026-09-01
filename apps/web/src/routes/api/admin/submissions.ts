import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { forms, submissions } from "@formdrop/db/schema";
import { eq, desc, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/admin/submissions")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
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

          // Get recent submissions with form names
          const allSubmissions = await db
            .select({
              id: submissions.id,
              formId: submissions.formId,
              formName: forms.name,
              createdAt: submissions.createdAt,
              payload: submissions.payload,
            })
            .from(submissions)
            .innerJoin(forms, eq(submissions.formId, forms.id))
            .where(isNull(submissions.deletedAt))
            .orderBy(desc(submissions.createdAt))
            .limit(100);

          return new Response(JSON.stringify({ submissions: allSubmissions }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error fetching admin submissions:", error);
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
