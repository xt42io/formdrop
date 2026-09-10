import { docs } from "@/.source/server";
import { loader } from "fumadocs-core/source";

/**
 * The content tree, shared by the pages, the sidebar and the search route.
 *
 * baseUrl is "/" rather than "/docs" because Next's basePath already adds the
 * prefix -- setting it in both places produces /docs/docs/getting-started.
 */
export const source = loader({
  baseUrl: "/",
  source: docs.toFumadocsSource(),
});
