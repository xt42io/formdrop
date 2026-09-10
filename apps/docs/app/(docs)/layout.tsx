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
      githubUrl="https://github.com/xt42io/formdrop"
      /*
       * No theme switch (D5: "No dark mode").
       *
       * RootProvider already forces light, so the control in the sidebar
       * footer had nothing to switch -- it rendered, it accepted clicks, and
       * the page stayed exactly as it was. Offering a toggle that does
       * nothing is worse than not offering one.
       */
      themeSwitch={{ enabled: false }}
    >
      {children}
    </DocsLayout>
  );
}
