import { createFileRoute } from "@tanstack/react-router";
import { db } from "@formdrop/db";
import { submissions, forms } from "@formdrop/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isUserPro } from "@/lib/subscription-check";

export const Route = createFileRoute("/api/forms/$formId/export")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session?.user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;
        const { formId } = params;
        const url = new URL(request.url);
        const format = url.searchParams.get("format") || "csv";
        const includeMetadata =
          url.searchParams.get("includeMetadata") === "true";

        const [form] = await db
          .select()
          .from(forms)
          .where(
            and(
              eq(forms.id, formId),
              eq(forms.userId, userId),
              isNull(forms.deletedAt),
            ),
          )
          .limit(1);

        if (!form) {
          return new Response("Form not found", { status: 404 });
        }

        const isPro = await isUserPro(userId);
        const exportLimit = isPro ? Infinity : 1000;

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            if (format === "csv") {
              // Write BOM for Excel compatibility
              controller.enqueue(encoder.encode("\uFEFF"));

              // Write Headers
              const csvHeaders = ["ID", "Created At"];
              if (includeMetadata) {
                csvHeaders.push("IP", "User Agent");
              }
              csvHeaders.push("Payload (JSON)");
              controller.enqueue(encoder.encode(csvHeaders.join(",") + "\n"));
            } else if (format === "json") {
              controller.enqueue(encoder.encode("[\n"));
            }

            const limit = 100;
            let offset = 0;
            let totalExported = 0;
            let isFirst = true;

            while (true) {
              const currentLimit = Math.min(limit, exportLimit - totalExported);
              if (currentLimit <= 0) break;

              const chunk = await db
                .select()
                .from(submissions)
                .where(
                  and(
                    eq(submissions.formId, formId),
                    isNull(submissions.deletedAt),
                  ),
                )
                .orderBy(desc(submissions.createdAt))
                .limit(currentLimit)
                .offset(offset);

              if (chunk.length === 0) {
                break;
              }

              for (const sub of chunk) {
                if (format === "csv") {
                  const row = [sub.id, sub.createdAt.toISOString()];

                  if (includeMetadata) {
                    row.push(sub.ip || "", sub.userAgent || "");
                  }

                  row.push(JSON.stringify(sub.payload).replace(/"/g, '""')); // Escape quotes for CSV

                  // Format as CSV line
                  const line =
                    row.map((field) => `"${field}"`).join(",") + "\n";
                  controller.enqueue(encoder.encode(line));
                } else if (format === "json") {
                  let jsonObj: any = {
                    id: sub.id,
                    createdAt: sub.createdAt,
                  };

                  if (includeMetadata) {
                    jsonObj.ip = sub.ip;
                    jsonObj.userAgent = sub.userAgent;
                    jsonObj.payload = sub.payload;
                  } else {
                    if (
                      typeof sub.payload === "object" &&
                      sub.payload !== null
                    ) {
                      jsonObj = {
                        id: sub.id,
                        createdAt: sub.createdAt,
                        ...sub.payload,
                      };
                    } else {
                      jsonObj.payload = sub.payload;
                    }
                  }

                  const jsonStr = JSON.stringify(jsonObj, null, 2);

                  if (!isFirst) {
                    controller.enqueue(encoder.encode(",\n"));
                  }
                  controller.enqueue(encoder.encode(jsonStr));
                  isFirst = false;
                }
                totalExported++;
              }

              offset += limit;
            }

            if (format === "json") {
              controller.enqueue(encoder.encode("\n]"));
            }

            controller.close();
          },
        });

        const contentType = format === "json" ? "application/json" : "text/csv";
        const extension = format === "json" ? "json" : "csv";

        return new Response(stream, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="submissions-${form.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${extension}"`,
          },
        });
      },
    },
  },
});
