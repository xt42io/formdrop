import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { palette } from "./palette";

/**
 * palette.ts exists so that Recharts, email templates and SVG logos can have a
 * colour value rather than a class. That is only defensible while it says the
 * same thing as tokens.css -- two lists of hex codes that are allowed to
 * disagree are worse than the hand-typed values they replaced, because they
 * look authoritative.
 *
 * So this reads the CSS and compares. Add a token to one and not the other and
 * the suite fails, which is the only reason the duplication is acceptable.
 *
 * fileURLToPath rather than new URL().pathname: this repo lives under a path
 * with a space in it, and .pathname leaves that as %20, which readFileSync
 * cannot open.
 */
const cssPath = fileURLToPath(new URL("./tokens.css", import.meta.url));
const css = readFileSync(cssPath, "utf8");

function colorTokensFromCss(): Record<string, string> {
  const theme = css.slice(css.indexOf("@theme {") + "@theme {".length);
  const block = theme.slice(0, theme.indexOf("\n}"));

  const found: Record<string, string> = {};
  for (const [, name, value] of block.matchAll(
    /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8});/g,
  )) {
    found[name] = value;
  }
  return found;
}

describe("palette", () => {
  const fromCss = colorTokensFromCss();

  it("finds the tokens in tokens.css at all", () => {
    // Guards the parser itself: if @theme were renamed or the file moved, every
    // other assertion here would pass vacuously against an empty object.
    expect(Object.keys(fromCss).length).toBeGreaterThan(30);
  });

  it("carries exactly the colour tokens tokens.css declares", () => {
    expect(Object.keys(palette).sort()).toEqual(Object.keys(fromCss).sort());
  });

  it("agrees with tokens.css on every value", () => {
    expect({ ...palette }).toEqual(fromCss);
  });

  it("is lowercase throughout, so string comparisons hold", () => {
    for (const [name, value] of Object.entries(palette)) {
      expect(value, name).toBe(value.toLowerCase());
    }
  });
});
