import { defineConfig } from "vitest/config";

/**
 * A DOM, because these test a hook and a form component. jsdom rather than a
 * real browser: what is under test is state transitions and what gets
 * serialised, neither of which needs a rendering engine.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    /*
     * Testing Library registers its automatic cleanup through a global
     * afterEach, which only exists when globals are on. Without it the DOM
     * from one test survives into the next, and a document-wide query finds
     * a node the current test never rendered -- which is exactly how the
     * honeypot tests first "failed".
     */
    globals: true,
  },
});
