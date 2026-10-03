// Where the auth session (tokens) and an in-progress sign-in's PKCE verifier
// are kept. Async so a native adapter can sit behind the same interface:
// Capacitor Preferences on iOS/Android (Phase 5), since iOS can evict a
// WebView's localStorage under storage pressure and a kid's tablet should
// stay signed in.

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Browser localStorage. Every access is guarded, like the game's own
 * src/data/*Selection.ts helpers: private-mode browsers and disabled
 * storage throw. A write that fails just means the session won't survive a
 * reload -- the parent signs in again.
 */
export const localStorageAdapter: KeyValueStorage = {
  async getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // storage unavailable -- session just won't persist
    }
  },
  async removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // storage unavailable -- nothing was persisted to remove
    }
  },
};

/** In-memory storage, for tests. */
export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    async getItem(key) {
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
}
