import { describe, expect, it } from "vitest";
import { accountConfig } from "./config";

const VALUES = {
  domain: "auth.pufferpower.com",
  clientId: "game-client",
  graphqlUrl: "https://api.pufferpower.com/graphql",
};

describe("accountConfig", () => {
  it("is null when any required value is missing (accounts switched off)", () => {
    expect(accountConfig({}, "https://app.pufferpower.com")).toBeNull();
    expect(accountConfig({ ...VALUES, clientId: "" }, "https://app.pufferpower.com")).toBeNull();
  });

  it("derives the callback and logout URLs from the app's own URL", () => {
    expect(accountConfig(VALUES, "http://localhost:5173/some/page?x=1")).toEqual({
      ...VALUES,
      redirectUri: "http://localhost:5173/auth/callback",
      logoutUri: "http://localhost:5173/",
    });
  });

  it("takes explicit redirect/logout URLs, e.g. a native app's URL scheme", () => {
    const config = accountConfig(
      { ...VALUES, redirectUri: "com.pufferpower.app://auth/callback", logoutUri: "com.pufferpower.app://" },
      "capacitor://localhost",
    );
    expect(config).toMatchObject({
      redirectUri: "com.pufferpower.app://auth/callback",
      logoutUri: "com.pufferpower.app://",
    });
  });

  it("accepts a pasted URL for the domain", () => {
    expect(accountConfig({ ...VALUES, domain: "https://auth.pufferpower.com/" }, "https://x.test")?.domain).toBe(
      "auth.pufferpower.com",
    );
  });
});
