import { docs } from "@/.source/server";
import { loader } from "fumadocs-core/source";
import { openapiPlugin } from "fumadocs-openapi/server";

/**
 * The content tree, shared by the pages, the sidebar and the search route.
 *
 * baseUrl is "/" rather than "/docs" because Next's basePath already adds the
 * prefix -- setting it in both places produces /docs/docs/getting-started.
 */
export const source = loader({
  baseUrl: "/",
  source: docs.toFumadocsSource(),
  /*
   * The generated reference pages declare the spec they need in frontmatter
   * (`_openapi.preload`), and this is what reads it. Without the plugin the
   * page renders with no document and the renderer throws on a schema that
   * was never loaded.
   */
  plugins: [openapiPlugin()],
});
