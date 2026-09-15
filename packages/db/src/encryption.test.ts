import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  isEncrypted,
  resetEncryptionKey,
} from "./encryption.ts";

const KEY = Buffer.alloc(32, 7).toString("base64");
const OTHER_KEY = Buffer.alloc(32, 9).toString("base64");

const TOKEN = "1//0gL9xQmT_exampleRefreshTokenValue-1234567890";

beforeEach(() => {
  process.env.TOKEN_ENCRYPTION_KEY = KEY;
  resetEncryptionKey();
});

afterEach(() => {
  delete process.env.TOKEN_ENCRYPTION_KEY;
  resetEncryptionKey();
});

describe("encryptSecret", () => {
  it("round-trips", () => {
    expect(decryptSecret(encryptSecret(TOKEN))).toBe(TOKEN);
  });

  it("does not leave the token in the stored value", () => {
    // A substring check catches an "encryption" that only wraps or encodes.
    expect(encryptSecret(TOKEN)).not.toContain(TOKEN);
    expect(encryptSecret(TOKEN)).not.toContain("exampleRefreshToken");
  });

  it("produces a different ciphertext every time", () => {
    // A fixed IV would make equal tokens equal ciphertexts, which leaks that
    // two rows hold the same credential.
    expect(encryptSecret(TOKEN)).not.toBe(encryptSecret(TOKEN));
  });

  it("round-trips an empty string and multibyte text", () => {
    expect(decryptSecret(encryptSecret(""))).toBe("");
    expect(decryptSecret(encryptSecret("tøkèn–✓"))).toBe("tøkèn–✓");
  });
});

describe("decryptSecret", () => {
  it("passes legacy plaintext through untouched", () => {
    // The dual-read window: the backfill can run after the deploy, not during.
    expect(isEncrypted(TOKEN)).toBe(false);
    expect(decryptSecret(TOKEN)).toBe(TOKEN);
  });

  it("refuses a value encrypted under a different key", () => {
    const sealed = encryptSecret(TOKEN);

    process.env.TOKEN_ENCRYPTION_KEY = OTHER_KEY;
    resetEncryptionKey();

    // Rubbish would reach Google and surface as an auth error far from here.
    expect(() => decryptSecret(sealed)).toThrow();
  });

  it("refuses a tampered ciphertext", () => {
    const sealed = encryptSecret(TOKEN);
    const edited = sealed.slice(0, -2) + (sealed.endsWith("A") ? "BB" : "AA");

    expect(() => decryptSecret(edited)).toThrow();
  });

  it("refuses a value that is missing its parts", () => {
    expect(() => decryptSecret("fd.v1.onlyonesegment")).toThrow(/malformed/);
  });
});

describe("the key", () => {
  it("is required before anything can be sealed", () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    resetEncryptionKey();

    expect(() => encryptSecret(TOKEN)).toThrow(/TOKEN_ENCRYPTION_KEY/);
  });

  it("is not required to read a row written before this landed", () => {
    delete process.env.TOKEN_ENCRYPTION_KEY;
    resetEncryptionKey();

    // Otherwise an environment without the key breaks on deploy, not on use.
    expect(decryptSecret(TOKEN)).toBe(TOKEN);
  });

  it("accepts hex as well as base64", () => {
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("hex");
    resetEncryptionKey();

    expect(decryptSecret(encryptSecret(TOKEN))).toBe(TOKEN);
  });

  it("rejects a key that is the wrong length", () => {
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(16, 7).toString("base64");
    resetEncryptionKey();

    // A short key that silently worked would be AES-128 dressed as AES-256.
    expect(() => encryptSecret(TOKEN)).toThrow(/16 bytes, not 32/);
  });
});
