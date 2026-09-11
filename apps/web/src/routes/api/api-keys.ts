import { createFileRoute } from "@tanstack/react-router";
import {
  createApiKey,
  deleteApiKey,
  listApiKeysForUser,
} from "@formdrop/core/data";
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

    const userApiKeys = await listApiKeysForUser(session.user.id);

    return json({
      keys: userApiKeys,
    });
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

const POST = async ({ request }: { request: Request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    const { apiKey, plaintext } = await createApiKey({
      userId: session.user.id,
      name: name || "New API Key",
    });

    /*
     * The only time the key is readable (W2: "show the plaintext once at
     * creation").
     *
     * What is stored is a SHA-256 digest, so this response cannot be
     * reproduced -- not by the list endpoint, not by support, not by reading
     * the database. The UI has to make that clear, because a reader who
     * dismisses this dialog has lost the key.
     */
    return json({ key: apiKey, plaintext });
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

const DELETE = async ({ request }: { request: Request }) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return json({ error: "Key ID is required" }, { status: 400 });
    }

    // Prevent deleting the last key? Maybe not strictly required but good practice.
    // For now, let's allow deleting any key.

    await deleteApiKey(session.user.id, id);

    return json({ success: true });
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

export type ApiKeysGetResponse = HandlerPayload<typeof GET>;
export type ApiKeysPostResponse = HandlerPayload<typeof POST>;
export type ApiKeysDeleteResponse = HandlerPayload<typeof DELETE>;

export const Route = createFileRoute("/api/api-keys")({
  server: { handlers: { GET, POST, DELETE } },
});
