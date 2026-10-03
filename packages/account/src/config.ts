// Where an app's Cognito Managed Login and GraphQL API live. Each app reads
// its own build-time env vars (the game: VITE_COGNITO_DOMAIN,
// VITE_COGNITO_GAME_CLIENT_ID, VITE_GRAPHQL_URL) and passes the values in,
// rather than this package reading import.meta.env itself -- the portal uses
// a different client id, and tests shouldn't depend on Vite.

export interface AccountConfig {
  /** Managed Login host, e.g. `auth.pufferpower.com` (no scheme). */
  domain: string;
  /** This app's public Cognito app client id. */
  clientId: string;
  /** AppSync endpoint, e.g. `https://api.pufferpower.com/graphql`. */
  graphqlUrl: string;
  /** Must exactly match one of the app client's registered callback URLs. */
  redirectUri: string;
  /** Must exactly match one of the app client's registered logout URLs. */
  logoutUri: string;
}

export interface AccountConfigValues {
  domain?: string;
  clientId?: string;
  graphqlUrl?: string;
  /** Overrides the `<appUrl>/auth/callback` default, e.g. a native app's
   *  `com.pufferpower.app://auth/callback`. */
  redirectUri?: string;
  /** Overrides the `<appUrl>/` default. */
  logoutUri?: string;
}

/**
 * Returns null when any required value is missing, which is how an app
 * knows accounts are switched off (local dev and tests with no backend):
 * it hides its account UI and plays as a guest.
 */
export function accountConfig(values: AccountConfigValues, appUrl: string): AccountConfig | null {
  const { domain, clientId, graphqlUrl } = values;
  if (!domain || !clientId || !graphqlUrl) return null;
  return {
    // Tolerate a pasted URL rather than a bare host.
    domain: domain.replace(/^https?:\/\//, "").replace(/\/+$/, ""),
    clientId,
    graphqlUrl,
    redirectUri: values.redirectUri ?? new URL("/auth/callback", appUrl).toString(),
    logoutUri: values.logoutUri ?? new URL("/", appUrl).toString(),
  };
}
