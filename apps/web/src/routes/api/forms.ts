import { createFileRoute } from "@tanstack/react-router";
import {
  createForm,
  dailyUsageByFormForUser,
  findLiveFormByName,
  listFormsForUser,
} from "@formdrop/core/data";
import { usagePeriod } from "@formdrop/core";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/forms")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          // The list renders a last-7-day sparkline per row (W4 4.5). One
          // grouped query rather than one per form, and the sparse rows it
          // returns are filled to a fixed seven-day window here so the client
          // never has to reason about which days are missing.
          const DAYS = 7;
          const today = new Date();
          const window = Array.from({ length: DAYS }, (_, i) => {
            const day = new Date(today);
            day.setUTCDate(day.getUTCDate() - (DAYS - 1 - i));
            return usagePeriod(day);
          });

          const [userForms, usageRows] = await Promise.all([
            listFormsForUser(session.user.id),
            dailyUsageByFormForUser(session.user.id, window[0]),
          ]);

          const byForm = new Map<string, Map<string, number>>();
          for (const row of usageRows) {
            const days = byForm.get(row.formId) ?? new Map<string, number>();
            days.set(row.date, row.count);
            byForm.set(row.formId, days);
          }

          const forms = userForms.map((form) => ({
            ...form,
            recentUsage: window.map((date) => ({
              date,
              count: byForm.get(form.id)?.get(date) ?? 0,
            })),
          }));

          return Response.json({ forms });
        } catch (error: any) {
          return Response.json(
            {
              error: "Internal server error",
              details: error.message,
            },
            { status: 500 },
          );
        }
      },

      POST: async ({ request }: { request: Request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          });

          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const userId = session.user.id;

          const body = await request.json();
          const { name, description, allowedDomains } = body;

          if (!name) {
            return Response.json(
              { error: "Form name is required" },
              { status: 400 },
            );
          }

          const existingForm = await findLiveFormByName(userId, name);

          if (existingForm) {
            return Response.json(
              { error: "You already have a form with this name" },
              { status: 409 },
            );
          }

          const form = await createForm({
            userId,
            name,
            description,
            allowedDomains,
          });

          return Response.json({ form }, { status: 201 });
        } catch (error: any) {
          return Response.json(
            {
              error: "Internal server error",
              details: error.message,
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
