import { describe, expect, it, vi } from "vitest";
import { AuthError, createAuthClient } from "./oauth";
import type { AuthOpener, Session } from "./oauth";
import { challengeFor } from "./pkce";
import { memoryStorage } from "./storage";
import { CONFIG, fakeJwt, formBody, jsonResponse, queuedFetch } from "./test/helpers";

const SESSION_KEY = "puffer-power:auth:session";
const PENDING_KEY = "puffer-power:auth:pending";
const NOW = 1_800_000_000_000;

const ID_TOKEN = fakeJwt({ sub: "parent-1", email: "pat@example.test", name: "Pat" });

function tokenResponse(overrides: Record<string, unknown> = {}) {
  return jsonResponse({
    id_token: ID_TOKEN,
    access_token: "access-1",
    refresh_token: "refresh-1",
    expires_in: 3600,
    token_type: "Bearer",
    ...overrides,
  });
}

function storedSession(overrides: Partial<Session> = {}): Record<string, string> {
  const session: Session = {
    idToken: ID_TOKEN,
    accessToken: "access-1",
    refreshToken: "refresh-1",
    expiresAt: NOW + 3600_000,
    ...overrides,
  };
  return { [SESSION_KEY]: JSON.stringify(session) };
}

/** A native-style opener: resolves with whatever callback URL the test
 *  builds from the authorize URL it was handed. */
function nativeOpener(respond: (authorizeUrl: URL) => string | null): AuthOpener & {
  opened: URL[];
} {
  const opened: URL[] = [];
  return {
    opened,
    async open(url) {
      const parsed = new URL(url);
      opened.push(parsed);
      return respond(parsed);
    },
  };
}

const callbackFor = (authorizeUrl: URL, params: Record<string, string> = {}) =>
  `${CONFIG.redirectUri}?${new URLSearchParams({
    code: "auth-code",
    state: authorizeUrl.searchParams.get("state")!,
    ...params,
  })}`;

describe("signIn", () => {
  it("sends the parent to Managed Login with a PKCE S256 challenge and a state", async () => {
    const storage = memoryStorage();
    const opener: AuthOpener = { open: vi.fn(() => new Promise<never>(() => {})) };
    const auth = createAuthClient({ config: CONFIG, storage, opener, fetch: queuedFetch() });

    void auth.signIn();
    await vi.waitFor(() => expect(opener.open).toHaveBeenCalled());

    const url = new URL(vi.mocked(opener.open).mock.calls[0][0]);
    expect(`${url.origin}${url.pathname}`).toBe("https://auth.example.test/oauth2/authorize");
    const params = Object.fromEntries(url.searchParams);
    expect(params).toMatchObject({
      response_type: "code",
      client_id: "game-client",
      redirect_uri: CONFIG.redirectUri,
      scope: "openid email profile",
      code_challenge_method: "S256",
    });
    expect(params.identity_provider).toBeUndefined();

    // The verifier is kept (for after a web redirect) and matches the challenge.
    const pending = JSON.parse(storage.data.get(PENDING_KEY)!);
    expect(pending.state).toBe(params.state);
    expect(await challengeFor(pending.verifier)).toBe(params.code_challenge);
  });

  it("skips Managed Login's chooser when a provider is given", async () => {
    const opener = nativeOpener(() => null);
    const auth = createAuthClient({ config: CONFIG, storage: memoryStorage(), opener });
    await auth.signIn("SignInWithApple");
    expect(opener.opened[0].searchParams.get("identity_provider")).toBe("SignInWithApple");
  });

  it("completes a native sign-in from the callback URL the sheet returns", async () => {
    const storage = memoryStorage();
    const fetch = queuedFetch(() => tokenResponse());
    const opener = nativeOpener((url) => callbackFor(url));
    const listener = vi.fn();
    const auth = createAuthClient({ config: CONFIG, storage, opener, fetch, now: () => NOW });
    auth.subscribe(listener);

    expect(await auth.signIn()).toBe(true);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe("https://auth.example.test/oauth2/token");
    const body = formBody(fetch.mock.calls[0]);
    expect(Object.fromEntries(body)).toMatchObject({
      grant_type: "authorization_code",
      client_id: "game-client",
      code: "auth-code",
      redirect_uri: CONFIG.redirectUri,
    });
    expect(await challengeFor(body.get("code_verifier")!)).toBe(
      opener.opened[0].searchParams.get("code_challenge"),
    );

    expect(await auth.getUser()).toEqual({ sub: "parent-1", email: "pat@example.test", name: "Pat" });
    expect(await auth.getIdToken()).toBe(ID_TOKEN);
    expect(JSON.parse(storage.data.get(SESSION_KEY)!).expiresAt).toBe(NOW + 3600_000);
    expect(storage.data.has(PENDING_KEY)).toBe(false);
    expect(listener).toHaveBeenCalled();
  });

  it("returns false and forgets the verifier when the parent closes the sheet", async () => {
    const storage = memoryStorage();
    const fetch = queuedFetch();
    const auth = createAuthClient({ config: CONFIG, storage, opener: nativeOpener(() => null), fetch });

    expect(await auth.signIn()).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    expect(storage.data.size).toBe(0);
  });
});

describe("handleCallback", () => {
  async function startWebSignIn() {
    const storage = memoryStorage();
    const opener: AuthOpener = { open: vi.fn(() => new Promise<never>(() => {})) };
    return { storage, opener };
  }

  it("rejects a callback whose state doesn't match, without redeeming the code", async () => {
    const { storage, opener } = await startWebSignIn();
    const fetch = queuedFetch();
    const auth = createAuthClient({ config: CONFIG, storage, opener, fetch });
    void auth.signIn();
    await vi.waitFor(() => expect(opener.open).toHaveBeenCalled());

    await expect(
      auth.handleCallback(`${CONFIG.redirectUri}?code=auth-code&state=forged`),
    ).rejects.toMatchObject({ code: "state_mismatch" });
    expect(fetch).not.toHaveBeenCalled();
    expect(storage.data.has(PENDING_KEY)).toBe(false);
  });

  it("rejects a callback when no sign-in was started here", async () => {
    const fetch = queuedFetch();
    const auth = createAuthClient({ config: CONFIG, storage: memoryStorage(), opener: nativeOpener(() => null), fetch });
    await expect(auth.handleCallback(`${CONFIG.redirectUri}?code=c&state=s`)).rejects.toMatchObject({
      code: "state_mismatch",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("surfaces an error Cognito redirected back with", async () => {
    const auth = createAuthClient({ config: CONFIG, storage: memoryStorage(), opener: nativeOpener(() => null) });
    const err = await auth
      .handleCallback(`${CONFIG.redirectUri}?error=access_denied&error_description=User+cancelled`)
      .catch((e) => e);
    expect(err).toBeInstanceOf(AuthError);
    expect(err).toMatchObject({ code: "access_denied", message: "User cancelled" });
  });

  it("surfaces a failed code exchange", async () => {
    const fetch = queuedFetch(() => jsonResponse({ error: "invalid_grant" }, 400));
    const opener = nativeOpener((url) => callbackFor(url));
    const auth = createAuthClient({ config: CONFIG, storage: memoryStorage(), opener, fetch });
    await expect(auth.signIn()).rejects.toMatchObject({ code: "invalid_grant" });
    expect(await auth.getUser()).toBeNull();
  });
});

describe("getIdToken", () => {
  it("returns null when signed out", async () => {
    const auth = createAuthClient({ config: CONFIG, storage: memoryStorage(), opener: nativeOpener(() => null) });
    expect(await auth.getIdToken()).toBeNull();
  });

  it("returns the stored token without a network call while it's fresh", async () => {
    const fetch = queuedFetch();
    const auth = createAuthClient({
      config: CONFIG,
      storage: memoryStorage(storedSession()),
      opener: nativeOpener(() => null),
      fetch,
      now: () => NOW,
    });
    expect(await auth.getIdToken()).toBe(ID_TOKEN);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refreshes once for concurrent callers when the token is near expiry", async () => {
    const refreshed = fakeJwt({ sub: "parent-1", email: "pat@example.test" });
    const fetch = queuedFetch(() => jsonResponse({ id_token: refreshed, access_token: "access-2", expires_in: 3600 }));
    const storage = memoryStorage(storedSession({ expiresAt: NOW + 30_000 }));
    const auth = createAuthClient({ config: CONFIG, storage, opener: nativeOpener(() => null), fetch, now: () => NOW });

    const tokens = await Promise.all([auth.getIdToken(), auth.getIdToken(), auth.getIdToken()]);

    expect(tokens).toEqual([refreshed, refreshed, refreshed]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(Object.fromEntries(formBody(fetch.mock.calls[0]))).toEqual({
      grant_type: "refresh_token",
      client_id: "game-client",
      refresh_token: "refresh-1",
    });
    // Cognito didn't rotate the refresh token, so the old one is kept.
    const saved = JSON.parse(storage.data.get(SESSION_KEY)!);
    expect(saved).toMatchObject({ idToken: refreshed, refreshToken: "refresh-1", expiresAt: NOW + 3600_000 });
  });

  it("signs out when the refresh token is no longer valid", async () => {
    const fetch = queuedFetch(() => jsonResponse({ error: "invalid_grant" }, 400));
    const storage = memoryStorage(storedSession({ expiresAt: NOW - 1 }));
    const listener = vi.fn();
    const auth = createAuthClient({ config: CONFIG, storage, opener: nativeOpener(() => null), fetch, now: () => NOW });
    auth.subscribe(listener);

    expect(await auth.getIdToken()).toBeNull();
    expect(storage.data.has(SESSION_KEY)).toBe(false);
    expect(await auth.getUser()).toBeNull();
    expect(listener).toHaveBeenCalled();
  });

  it("keeps the session and throws when offline, so a kid isn't signed out", async () => {
    const fetch = queuedFetch(() => {
      throw new TypeError("Failed to fetch");
    });
    const storage = memoryStorage(storedSession({ expiresAt: NOW - 1 }));
    const auth = createAuthClient({ config: CONFIG, storage, opener: nativeOpener(() => null), fetch, now: () => NOW });

    await expect(auth.getIdToken()).rejects.toThrow("Failed to fetch");
    expect(storage.data.has(SESSION_KEY)).toBe(true);
    expect(await auth.getUser()).toMatchObject({ sub: "parent-1" });
  });

  it("doesn't resurrect a session signed out while its refresh was in flight", async () => {
    let finishRefresh!: (res: Response) => void;
    const fetch = queuedFetch(
      () => new Promise<Response>((resolve) => (finishRefresh = resolve)),
      () => new Response(null, { status: 200 }), // revoke
    );
    const storage = memoryStorage(storedSession({ expiresAt: NOW - 1 }));
    const auth = createAuthClient({ config: CONFIG, storage, opener: nativeOpener(() => null), fetch, now: () => NOW });

    const token = auth.getIdToken();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await auth.signOut();
    finishRefresh(jsonResponse({ id_token: ID_TOKEN, access_token: "a", expires_in: 3600 }));

    expect(await token).toBeNull();
    expect(storage.data.has(SESSION_KEY)).toBe(false);
  });
});

describe("signOut", () => {
  it("clears the session, revokes the refresh token and ends the Managed Login session", async () => {
    const fetch = queuedFetch(() => new Response(null, { status: 200 }));
    const storage = memoryStorage(storedSession());
    const opener = { ...nativeOpener(() => null), endSession: vi.fn() };
    const auth = createAuthClient({ config: CONFIG, storage, opener, fetch });

    await auth.signOut();

    expect(storage.data.size).toBe(0);
    expect(fetch.mock.calls[0][0]).toBe("https://auth.example.test/oauth2/revoke");
    expect(Object.fromEntries(formBody(fetch.mock.calls[0]))).toEqual({
      token: "refresh-1",
      client_id: "game-client",
    });
    const logout = new URL(opener.endSession.mock.calls[0][0]);
    expect(`${logout.origin}${logout.pathname}`).toBe("https://auth.example.test/logout");
    expect(Object.fromEntries(logout.searchParams)).toEqual({
      client_id: "game-client",
      logout_uri: CONFIG.logoutUri,
    });
  });

  it("still signs out locally when the revoke request fails (offline)", async () => {
    const fetch = queuedFetch(() => {
      throw new TypeError("Failed to fetch");
    });
    const storage = memoryStorage(storedSession());
    const auth = createAuthClient({ config: CONFIG, storage, opener: nativeOpener(() => null), fetch });

    await auth.signOut();
    expect(await auth.getUser()).toBeNull();
    expect(storage.data.size).toBe(0);
  });
});

describe("stored session", () => {
  it("treats corrupt stored JSON as signed out", async () => {
    const auth = createAuthClient({
      config: CONFIG,
      storage: memoryStorage({ [SESSION_KEY]: "{not json" }),
      opener: nativeOpener(() => null),
    });
    expect(await auth.getUser()).toBeNull();
    expect(await auth.getIdToken()).toBeNull();
  });

  it("decodes non-ASCII names from the ID token", async () => {
    const auth = createAuthClient({
      config: CONFIG,
      storage: memoryStorage(storedSession({ idToken: fakeJwt({ sub: "p", name: "Zoë Muñoz" }) })),
      opener: nativeOpener(() => null),
    });
    expect(await auth.getUser()).toEqual({ sub: "p", email: undefined, name: "Zoë Muñoz" });
  });
});
