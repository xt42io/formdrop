import { createFileRoute } from "@tanstack/react-router";
import {
  createForm,
  findLiveFormByName,
  listFormsForUser,
} from "@formdrop/core/data";
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

          const userForms = await listFormsForUser(session.user.id);

          return Response.json({ forms: userForms });
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
