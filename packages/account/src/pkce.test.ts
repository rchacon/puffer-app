import { describe, expect, it } from "vitest";
import { base64UrlDecode, base64UrlEncode, challengeFor, createPkcePair, randomUrlSafe } from "./pkce";

describe("pkce", () => {
  it("derives the S256 challenge from RFC 7636's own test vector", async () => {
    expect(await challengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });

  it("generates 43-char url-safe random values that differ each time", () => {
    const a = randomUrlSafe();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomUrlSafe()).not.toBe(a);
  });

  it("pairs a verifier with its own challenge", async () => {
    const { verifier, challenge } = await createPkcePair();
    expect(challenge).toBe(await challengeFor(verifier));
  });

  it("round-trips base64url, including bytes that need - and _", () => {
    const bytes = new Uint8Array([251, 255, 191, 0, 1]);
    expect(base64UrlEncode(bytes)).toBe("-_-_AAE");
    expect(base64UrlDecode("-_-_AAE")).toEqual(bytes);
  });
});
