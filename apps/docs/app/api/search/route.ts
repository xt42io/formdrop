import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

/**
 * Built-in search (W5 acceptance: results for "API key", "Slack", "rate
 * limit").
 *
 * Indexed from the same source the pages render from, so a page cannot be
 * published and stay unfindable.
 */
export const { GET } = createFromSource(source);
