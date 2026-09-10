"use client";

import { createOpenAPIPage } from "fumadocs-openapi/ui";

/**
 * The reference renderer, in its own client module.
 *
 * createOpenAPIPage builds a client component and cannot be called from the
 * server, so it cannot live in mdx-components.tsx -- and marking that whole
 * file "use client" would drag every other MDX component onto the client
 * with it, for one that needs it.
 */
export const OpenAPIPage = createOpenAPIPage();
