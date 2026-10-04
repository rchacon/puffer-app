// Cognito Managed Login via OAuth 2.0 authorization code + PKCE, against
// Cognito's standard endpoints (/oauth2/authorize, /oauth2/token,
// /oauth2/revoke, /logout).
//
// Deliberately not Amplify: Amplify's signInWithRedirect navigates the
// current page, which inside a Capacitor WebView would load Google's sign-in
// in an embedded WebView (Google rejects that with `disallowed_useragent`),
// and Amplify has no supported way to adopt tokens obtained elsewhere.
// Owning the flow keeps web and native on one code path; the only
// difference is the injected `AuthOpener` -- a full-page redirect on web, a
// system browser sheet (ASWebAuthenticationSession / Custom Tabs) on native.

import { base64UrlDecode, createPkcePair, randomUrlSafe } from "./pkce";
import type { AccountConfig } from "./config";
import type { KeyValueStorage } from "./storage";

export type IdentityProvider = "Google" | "SignInWithApple";

export interface AuthOpener {
  /**
   * Opens the authorize URL. Native: resolves with the callback URL Cognito
   * redirected to, or null if the parent closed the sheet. Web: navigates
   * the page away, so the returned promise never settles -- the sign-in
   * finishes in `handleCallback` after the redirect back.
   */
  open(url: string): Promise<string | null>;
  /**
   * Ends Managed Login's own browser session (its cookie on the auth
   * domain), so the next sign-in asks for credentials instead of silently
   * reusing it -- matters on a shared classroom Chromebook. Native omits
   * this: its sheet uses an ephemeral session that keeps no cookies.
   */
  endSession?(logoutUrl: string): void;
}

export interface Session {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when the ID/access tokens expire. */
  expiresAt: number;
}

/** Identity claims from the ID token. */
export interface User {
  sub: string;
  email?: string;
  name?: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    /** OAuth error code (e.g. `invalid_grant`, `access_denied`) or one of
     *  this module's own (`state_mismatch`, `token_request_failed`). */
    readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthClient {
  /**
   * Starts a sign-in. `provider` skips Managed Login's chooser page and
   * goes straight to Google/Apple; omitted, the parent gets the branded
   * Managed Login page (email sign-in/sign-up). Native: resolves true once
   * signed in, false if cancelled. Web: never resolves (page navigates).
   */
  signIn(provider?: IdentityProvider): Promise<boolean>;
  /** Finishes a sign-in from the URL Cognito redirected back to. */
  handleCallback(callbackUrl: string): Promise<void>;
  /**
   * A valid ID token, refreshing it first if it's near expiry, or null if
   * signed out (including a refresh token that's expired or revoked).
   * Throws on a network failure rather than signing out, so a kid playing
   * offline isn't logged out -- callers treat that as "try later".
   */
  getIdToken(): Promise<string | null>;
  /** The signed-in user from the stored session, without any network call. */
  getUser(): Promise<User | null>;
  /** Signs out locally first (always succeeds, even offline), then revokes
   *  the refresh token and ends the Managed Login session best-effort. */
  signOut(): Promise<void>;
  /** Called whenever the session changes (sign-in, refresh, sign-out). */
  subscribe(listener: () => void): () => void;
}

export interface AuthClientOptions {
  config: AccountConfig;
  storage: KeyValueStorage;
  opener: AuthOpener;
  fetch?: typeof fetch;
  now?: () => number;
}

const SESSION_KEY = "puffer-power:auth:session";
const PENDING_KEY = "puffer-power:auth:pending";
// Refresh a minute early so a token can't expire between being handed out
// and reaching AppSync.
const REFRESH_MARGIN_MS = 60_000;

interface TokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface PendingSignIn {
  verifier: string;
  state: string;
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  if (!payload) throw new Error("Malformed JWT");
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function createAuthClient({
  config,
  storage,
  opener,
  fetch: fetchImpl = (...args) => globalThis.fetch(...args),
  now = Date.now,
}: AuthClientOptions): AuthClient {
  const base = `https://${config.domain}`;
  // undefined = not yet read from storage; null = signed out.
  let session: Session | null | undefined;
  let refreshing: Promise<Session | null> | null = null;
  const listeners = new Set<() => void>();

  // One shared read: concurrent first callers must all see the same Session
  // object, or refresh()'s "did the session change while I was in flight?"
  // identity check would mistake a duplicate parse for a sign-out.
  let loading: Promise<void> | null = null;
  async function load(): Promise<Session | null> {
    loading ??= storage.getItem(SESSION_KEY).then((raw) => {
      if (session === undefined) session = parseJson<Session>(raw);
    });
    await loading;
    return session ?? null;
  }

  async function save(next: Session | null): Promise<void> {
    session = next;
    if (next) await storage.setItem(SESSION_KEY, JSON.stringify(next));
    else await storage.removeItem(SESSION_KEY);
    for (const listener of listeners) listener();
  }

  async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
    const res = await fetchImpl(`${base}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new AuthError(
        body.error_description ?? `Token request failed (${res.status})`,
        body.error ?? "token_request_failed",
      );
    }
    return body as TokenResponse;
  }

  function sessionFrom(tokens: TokenResponse, refreshToken: string): Session {
    return {
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      refreshToken,
      expiresAt: now() + tokens.expires_in * 1000,
    };
  }

  async function handleCallback(callbackUrl: string): Promise<void> {
    const params = new URL(callbackUrl).searchParams;
    const pending = parseJson<PendingSignIn>(await storage.getItem(PENDING_KEY));
    // One-shot: a verifier is never reused, whatever the outcome.
    await storage.removeItem(PENDING_KEY);

    const error = params.get("error");
    if (error) throw new AuthError(params.get("error_description") ?? error, error);

    const code = params.get("code");
    if (!pending || !code || params.get("state") !== pending.state) {
      throw new AuthError("Sign-in response didn't match a sign-in started here", "state_mismatch");
    }

    const tokens = await tokenRequest({
      grant_type: "authorization_code",
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: pending.verifier,
    });
    if (!tokens.refresh_token) {
      throw new AuthError("Token response had no refresh token", "token_request_failed");
    }
    await save(sessionFrom(tokens, tokens.refresh_token));
  }

  async function refresh(current: Session): Promise<Session | null> {
    let tokens: TokenResponse;
    try {
      tokens = await tokenRequest({
        grant_type: "refresh_token",
        client_id: config.clientId,
        refresh_token: current.refreshToken,
      });
    } catch (err) {
      if (err instanceof AuthError && err.code === "invalid_grant") {
        // Refresh token expired or revoked: genuinely signed out.
        if (session === current) await save(null);
        return null;
      }
      throw err;
    }
    // Signed out (or signed in as someone else) while the request was in
    // flight -- don't resurrect the old session.
    if (session !== current) return session ?? null;
    // Cognito only returns a new refresh token if rotation is enabled.
    const next = sessionFrom(tokens, tokens.refresh_token ?? current.refreshToken);
    await save(next);
    return next;
  }

  return {
    async signIn(provider) {
      const { verifier, challenge } = await createPkcePair();
      const state = randomUrlSafe();
      await storage.setItem(PENDING_KEY, JSON.stringify({ verifier, state } satisfies PendingSignIn));

      const params = new URLSearchParams({
        response_type: "code",
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: "openid email profile",
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
      });
      if (provider) params.set("identity_provider", provider);

      const callbackUrl = await opener.open(`${base}/oauth2/authorize?${params}`);
      if (!callbackUrl) {
        await storage.removeItem(PENDING_KEY);
        return false;
      }
      await handleCallback(callbackUrl);
      return true;
    },

    handleCallback,

    async getIdToken() {
      const current = await load();
      if (!current) return null;
      if (current.expiresAt - now() > REFRESH_MARGIN_MS) return current.idToken;
      // Concurrent callers share one refresh request.
      refreshing ??= refresh(current).finally(() => {
        refreshing = null;
      });
      return (await refreshing)?.idToken ?? null;
    },

    async getUser() {
      const current = await load();
      if (!current) return null;
      try {
        const claims = decodeJwtPayload(current.idToken);
        if (typeof claims.sub !== "string") return null;
        return {
          sub: claims.sub,
          email: typeof claims.email === "string" ? claims.email : undefined,
          name: typeof claims.name === "string" ? claims.name : undefined,
        };
      } catch {
        return null;
      }
    },

    async signOut() {
      const current = await load();
      await storage.removeItem(PENDING_KEY);
      await save(null);
      if (current) {
        // Best-effort: the local sign-out above already took effect.
        await fetchImpl(`${base}/oauth2/revoke`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: current.refreshToken, client_id: config.clientId }),
        }).catch(() => undefined);
      }
      const logout = new URLSearchParams({ client_id: config.clientId, logout_uri: config.logoutUri });
      opener.endSession?.(`${base}/logout?${logout}`);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The web `AuthOpener`: full-page redirects to Managed Login and back. */
export const webOpener: AuthOpener = {
  open(url) {
    window.location.assign(url);
    return new Promise<never>(() => {});
  },
  endSession(logoutUrl) {
    window.location.assign(logoutUrl);
  },
};
