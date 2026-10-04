import { vi } from "vitest";
import { base64UrlEncode } from "../pkce";
import type { AccountConfig } from "../config";

export const CONFIG: AccountConfig = {
  domain: "auth.example.test",
  clientId: "game-client",
  graphqlUrl: "https://api.example.test/graphql",
  redirectUri: "https://app.example.test/auth/callback",
  logoutUri: "https://app.example.test/",
};

const encodeJson = (value: unknown) => base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));

/** An unsigned JWT-shaped string -- the client never verifies signatures
 *  (AppSync does), it only reads the claims. */
export function fakeJwt(claims: Record<string, unknown>): string {
  return `${encodeJson({ alg: "none" })}.${encodeJson(claims)}.sig`;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A fetch mock that records calls and answers from a queue of responders. */
export function queuedFetch(...responders: Array<() => Response | Promise<Response>>) {
  const queue = [...responders];
  return vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    const next = queue.shift();
    if (!next) throw new Error("Unexpected fetch");
    return next();
  });
}

/** The form-encoded body of a recorded fetch call. */
export function formBody(call: unknown[]): URLSearchParams {
  return new URLSearchParams(String((call[1] as RequestInit).body));
}
