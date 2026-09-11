import { createFileRoute } from "@tanstack/react-router";
import {
  findRecipientByValidToken,
  markRecipientVerified,
} from "@formdrop/core/data";

export const Route = createFileRoute("/api/verify-recipient")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const token = url.searchParams.get("token");

          if (!token) {
            return Response.json(
              { error: "Verification token is required" },
              { status: 400 },
            );
          }

          const recipient = await findRecipientByValidToken(token);

          if (!recipient) {
            return Response.json(
              { error: "Invalid or expired verification token" },
              { status: 400 },
            );
          }

          await markRecipientVerified(recipient.id);

          return Response.json({
            success: true,
            message: "Email verified successfully",
          });
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
