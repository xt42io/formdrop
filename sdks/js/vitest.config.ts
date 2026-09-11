import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    /*
     * The live contract suite is excluded here and run by `test:contract` in
     * its own CI job (PRD W8). It needs network and staging credentials, and a
     * unit run that goes red when a staging box is down is a unit run people
     * learn to ignore.
     */
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.live.test.ts"],
  },
});
