import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";

/**
 * The sidebar and page frame.
 *
 * The nav title links back to the marketing site rather than to /docs, since
 * the docs are a section of formdrop.co and not a site of their own (D2).
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{ title: "FormDrop docs", url: "/" }}
      githubUrl="https://github.com/devtofunmi/formdrop"
    >
      {children}
    </DocsLayout>
  );
}
