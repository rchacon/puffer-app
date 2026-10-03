// PKCE (RFC 7636) for the OAuth authorization-code flow. The app is a public
// client (no secret can be kept in a web or native bundle), so PKCE is what
// stops an intercepted authorization code from being redeemed by anyone
// but the app instance that started the sign-in.

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** 32 random bytes, base64url-encoded (43 chars) -- used for both the code
 *  verifier and the `state` parameter. */
export function randomUrlSafe(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
}

export async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

export async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomUrlSafe();
  return { verifier, challenge: await challengeFor(verifier) };
}
