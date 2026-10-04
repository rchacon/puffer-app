/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountProvider, useAccount } from "./AccountProvider";
import type { AccountContextValue } from "./AccountProvider";
import { NotSignedInError } from "./api";
import type { ApiClient, Child } from "./api";
import type { AuthClient, User } from "./oauth";

afterEach(() => cleanup());

const PAT: User = { sub: "parent-1", email: "pat@example.test" };
const MAYA: Child = {
  id: "child-1",
  parentId: "parent-1",
  name: "Maya",
  avatar: null,
  birthday: "2019-04-01",
  createdAt: "2026-10-01T00:00:00.000Z",
};

function fakeAuth(initialUser: User | null) {
  let user = initialUser;
  const listeners = new Set<() => void>();
  const auth: AuthClient = {
    signIn: vi.fn(async () => true),
    handleCallback: vi.fn(async () => {}),
    getIdToken: vi.fn(async () => (user ? "token" : null)),
    getUser: vi.fn(async () => user),
    signOut: vi.fn(async () => {
      user = null;
      listeners.forEach((l) => l());
    }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  /** Simulates the session changing underneath (sign-in, refresh, expiry). */
  const setUser = (next: User | null) =>
    act(() => {
      user = next;
      listeners.forEach((l) => l());
    });
  return { auth, setUser };
}

function fakeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    graphql: vi.fn(),
    myProfile: vi.fn(),
    myChildren: vi.fn(async () => [MAYA]),
    childProgress: vi.fn(),
    createChildProfile: vi.fn(),
    recordAttempt: vi.fn(),
    ...overrides,
  };
}

let account: AccountContextValue | null = null;
function Probe() {
  account = useAccount();
  return (
    <p>
      {account?.status}:{account?.childProfiles?.map((c) => c.name).join(",") ?? "none"}:
      {account?.error?.message ?? ""}
    </p>
  );
}

function renderWith(auth: AuthClient, api: ApiClient) {
  return render(
    <AccountProvider auth={auth} api={api}>
      <Probe />
    </AccountProvider>,
  );
}

describe("AccountProvider", () => {
  it("is null outside a provider, which apps treat as accounts switched off", () => {
    render(<Probe />);
    expect(account).toBeNull();
  });

  it("starts loading, then reports signed out with no session", async () => {
    const { auth } = fakeAuth(null);
    const api = fakeApi();
    renderWith(auth, api);
    expect(screen.getByText(/^loading:/)).toBeInTheDocument();
    await screen.findByText(/^signedOut:none/);
    expect(api.myChildren).not.toHaveBeenCalled();
  });

  it("loads the parent's child profiles when signed in", async () => {
    const { auth } = fakeAuth(PAT);
    renderWith(auth, fakeApi());
    await screen.findByText(/^signedIn:Maya/);
    expect(account?.user).toEqual(PAT);
  });

  it("doesn't refetch children when only the token refreshed", async () => {
    const { auth, setUser } = fakeAuth(PAT);
    const api = fakeApi();
    renderWith(auth, api);
    await screen.findByText(/^signedIn:Maya/);

    setUser({ ...PAT }); // same sub, fresh token
    await screen.findByText(/^signedIn:Maya/);
    expect(api.myChildren).toHaveBeenCalledTimes(1);
  });

  it("goes signed out when the session expires underneath it", async () => {
    const { auth, setUser } = fakeAuth(PAT);
    renderWith(auth, fakeApi());
    await screen.findByText(/^signedIn:Maya/);

    setUser(null);
    await screen.findByText(/^signedOut:none/);
  });

  it("stays signed in with an error when children can't load (offline)", async () => {
    const { auth } = fakeAuth(PAT);
    renderWith(auth, fakeApi({ myChildren: vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))) }));
    await screen.findByText(/^signedIn:none:Failed to fetch/);
  });

  it("goes signed out when the API says the session is gone", async () => {
    const { auth } = fakeAuth(PAT);
    renderWith(auth, fakeApi({ myChildren: vi.fn(async () => Promise.reject(new NotSignedInError())) }));
    await screen.findByText(/^signedOut:none/);
  });

  it("appends a newly created child", async () => {
    const theo: Child = { ...MAYA, id: "child-2", name: "Theo" };
    const { auth } = fakeAuth(PAT);
    const api = fakeApi({ createChildProfile: vi.fn(async () => theo) });
    renderWith(auth, api);
    await screen.findByText(/^signedIn:Maya/);

    await act(() => account!.createChild({ name: "Theo", birthday: "2020-01-01" }));
    await screen.findByText(/^signedIn:Maya,Theo/);
  });

  it("records a failed callback as an error instead of throwing", async () => {
    const { auth } = fakeAuth(null);
    vi.mocked(auth.handleCallback).mockRejectedValueOnce(new Error("state mismatch"));
    renderWith(auth, fakeApi());
    await screen.findByText(/^signedOut/);

    await act(() => account!.completeSignIn("https://app.example.test/auth/callback?code=x&state=y"));
    await waitFor(() => expect(screen.getByText(/state mismatch/)).toBeInTheDocument());
  });

  it("signs out", async () => {
    const { auth } = fakeAuth(PAT);
    renderWith(auth, fakeApi());
    await screen.findByText(/^signedIn:Maya/);

    await act(() => account!.signOut());
    await screen.findByText(/^signedOut:none/);
  });
});
