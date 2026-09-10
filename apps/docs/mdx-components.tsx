import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { OpenAPIPage } from "@/components/openapi-page";

type PreloadedProps = Partial<ComponentProps<typeof OpenAPIPage>>;

/**
 * The components the MDX pages render with.
 *
 * OpenAPIPage is what the generated reference pages call themselves, passing
 * only a document path and an operation -- the parsed spec arrives separately,
 * loaded per page on the server and bound here. Without that binding the
 * renderer reaches for a schema nobody fetched, and every endpoint page fails
 * to build.
 *
 * The preloaded document is plain data, so handing it from a server component
 * to this client one costs a serialisation and nothing else.
 */
export function getMDXComponents(
  preloaded?: PreloadedProps,
  components?: MDXComponents,
): MDXComponents {
  const Reference = (props: ComponentProps<typeof OpenAPIPage>) => (
    <OpenAPIPage {...preloaded} {...props} />
  );

  return {
    ...defaultComponents,
    OpenAPIPage: Reference,
    // v10 called it APIPage, and the generated pages accept either.
    APIPage: Reference,
    ...components,
  };
}
