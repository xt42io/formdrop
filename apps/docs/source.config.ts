import { defineDocs, defineConfig } from "fumadocs-mdx/config";

/**
 * MDX content lives in content/docs and is compiled at build time.
 *
 * Frontmatter carries `title` and `description`; both are used by the page,
 * the sidebar and the search index, so a page missing them is a page nobody
 * can find.
 */
export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig();
