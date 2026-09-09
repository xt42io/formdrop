import { createFileRoute } from "@tanstack/react-router";
import { findSubscription } from "@formdrop/core/data";
import { auth } from "@/lib/auth";
import { json, type HandlerPayload } from "@/lib/api/respond";

const GET = async ({ request }: { request: Request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await findSubscription(session.user.id);

    return json({ subscription });
  } catch (error: any) {
    return json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
};

export type SubscriptionGetResponse = HandlerPayload<typeof GET>;

export const Route = createFileRoute("/api/subscription")({
  server: { handlers: { GET } },
});
