// React context over an AuthClient + ApiClient: who's signed in, and their
// child profiles. Shared by the game and the portal; each app styles its
// own UI on top of `useAccount()`.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { AuthClient, IdentityProvider, User } from "./oauth";
import { NotSignedInError } from "./api";
import type { ApiClient, Child, CreateChildProfileInput } from "./api";

export type AccountStatus = "loading" | "signedOut" | "signedIn";

export interface AccountState {
  status: AccountStatus;
  user: User | null;
  /** null until loaded (or if loading failed -- see `error`). */
  childProfiles: Child[] | null;
  /** The last sign-in or load failure, for the UI to show. Loading
   *  children while offline lands here too, without signing out. */
  error: Error | null;
}

export interface AccountContextValue extends AccountState {
  signIn(provider?: IdentityProvider): Promise<void>;
  /** Finishes a web redirect sign-in from the `/auth/callback` URL. */
  completeSignIn(callbackUrl: string): Promise<void>;
  signOut(): Promise<void>;
  reloadChildren(): Promise<void>;
  /** Throws on failure, so a form can show the error inline. */
  createChild(input: CreateChildProfileInput): Promise<Child>;
  api: ApiClient;
}

const AccountContext = createContext<AccountContextValue | null>(null);

/**
 * The account context, or null when there's no provider -- how an app
 * renders with accounts switched off (no backend configured): it skips the
 * provider entirely and treats null as "guest only".
 */
export function useAccount(): AccountContextValue | null {
  return useContext(AccountContext);
}

const INITIAL: AccountState = { status: "loading", user: null, childProfiles: null, error: null };
const SIGNED_OUT: AccountState = { status: "signedOut", user: null, childProfiles: null, error: null };

const asError = (err: unknown) => (err instanceof Error ? err : new Error(String(err)));

export function AccountProvider({
  auth,
  api,
  children,
}: {
  auth: AuthClient;
  api: ApiClient;
  children: ReactNode;
}) {
  const [state, setState] = useState<AccountState>(INITIAL);
  // Whose children are loaded, so a token refresh (which also fires the
  // auth listener) doesn't refetch them.
  const loadedSub = useRef<string | null>(null);
  const mounted = useRef(true);

  const update = useCallback((next: (prev: AccountState) => AccountState) => {
    if (mounted.current) setState(next);
  }, []);

  const loadChildren = useCallback(async () => {
    try {
      const childProfiles = await api.myChildren();
      update((prev) => ({ ...prev, childProfiles, error: null }));
    } catch (err) {
      if (err instanceof NotSignedInError) {
        loadedSub.current = null;
        update(() => SIGNED_OUT);
      } else {
        update((prev) => ({ ...prev, error: asError(err) }));
      }
    }
  }, [api, update]);

  const sync = useCallback(async () => {
    const user = await auth.getUser();
    if (!user) {
      loadedSub.current = null;
      update(() => SIGNED_OUT);
      return;
    }
    if (user.sub === loadedSub.current) {
      update((prev) => ({ ...prev, status: "signedIn", user }));
      return;
    }
    loadedSub.current = user.sub;
    update(() => ({ status: "signedIn", user, childProfiles: null, error: null }));
    await loadChildren();
  }, [auth, loadChildren, update]);

  useEffect(() => {
    mounted.current = true;
    void sync();
    const unsubscribe = auth.subscribe(() => void sync());
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [auth, sync]);

  const value = useMemo<AccountContextValue>(
    () => ({
      ...state,
      api,
      async signIn(provider) {
        try {
          await auth.signIn(provider);
        } catch (err) {
          update((prev) => ({ ...prev, error: asError(err) }));
        }
      },
      async completeSignIn(callbackUrl) {
        try {
          await auth.handleCallback(callbackUrl);
        } catch (err) {
          update((prev) => ({ ...prev, error: asError(err) }));
        }
      },
      async signOut() {
        await auth.signOut();
      },
      reloadChildren: loadChildren,
      async createChild(input) {
        const child = await api.createChildProfile(input);
        update((prev) => ({ ...prev, childProfiles: [...(prev.childProfiles ?? []), child] }));
        return child;
      },
    }),
    [state, api, auth, loadChildren, update],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}
