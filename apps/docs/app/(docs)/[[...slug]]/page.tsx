import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { source } from "@/lib/source";
import { openapi } from "@/lib/openapi";
import { getMDXComponents } from "@/mdx-components";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  /*
   * Reference pages declare the spec they need in frontmatter and this loads
   * it, handing the parsed document to <OpenAPIPage /> as a prop.
   *
   * The generated MDX passes only the document path and the operation, so
   * without this the renderer reaches for a schema that was never fetched
   * and the build fails on every endpoint page. Ordinary prose pages have no
   * _openapi block and get an empty object.
   */
  const preloaded = await openapi.preloadOpenAPIPage(page);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents(preloaded)} />
      </DocsBody>
    </DocsPage>
  );
}

/** Every page is known at build time, so all of them are prerendered. */
export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: `${page.data.title} | FormDrop`,
    description: page.data.description,
  };
}
