import { describe, expect, it } from "vitest";
import { ApiError, createApiClient, NotSignedInError } from "./api";
import { CONFIG, jsonResponse, queuedFetch } from "./test/helpers";

const CHILD = {
  id: "child-1",
  parentId: "parent-1",
  name: "Maya",
  avatar: null,
  birthday: "2019-04-01",
  createdAt: "2026-10-01T00:00:00.000Z",
};

describe("createApiClient", () => {
  it("sends the raw ID token as Authorization and returns the field's data", async () => {
    const fetch = queuedFetch(() => jsonResponse({ data: { myChildren: [CHILD] } }));
    const api = createApiClient({ url: CONFIG.graphqlUrl, getIdToken: async () => "id-token", fetch });

    expect(await api.myChildren()).toEqual([CHILD]);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(CONFIG.graphqlUrl);
    expect(init?.headers).toMatchObject({ Authorization: "id-token" });
    expect(JSON.parse(String(init?.body)).query).toContain("myChildren");
  });

  it("passes mutation inputs as variables", async () => {
    const fetch = queuedFetch(() => jsonResponse({ data: { createChildProfile: CHILD } }));
    const api = createApiClient({ url: CONFIG.graphqlUrl, getIdToken: async () => "t", fetch });

    const input = { name: "Maya", birthday: "2019-04-01" };
    expect(await api.createChildProfile(input)).toEqual(CHILD);
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).variables).toEqual({ input });
  });

  it("throws NotSignedInError without calling the API when there's no token", async () => {
    const fetch = queuedFetch();
    const api = createApiClient({ url: CONFIG.graphqlUrl, getIdToken: async () => null, fetch });
    await expect(api.myProfile()).rejects.toBeInstanceOf(NotSignedInError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("surfaces a resolver error with its AppSync errorType", async () => {
    const fetch = queuedFetch(() =>
      jsonResponse({
        data: null,
        errors: [{ message: "Child child-9 not found for this parent", errorType: "NotFound" }],
      }),
    );
    const api = createApiClient({ url: CONFIG.graphqlUrl, getIdToken: async () => "t", fetch });

    const err = await api
      .recordAttempt({
        attemptId: "attempt-0001",
        childId: "child-9",
        activity: "SIGHT_WORD",
        target: "cat",
        challengeType: "SPELL",
        answer: "cat",
        occurredAt: "2026-10-03T00:00:00.000Z",
      })
      .catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ errorType: "NotFound", message: "Child child-9 not found for this parent" });
  });

  it("surfaces AppSync's 401 for a rejected token", async () => {
    const fetch = queuedFetch(() =>
      jsonResponse({ errors: [{ errorType: "UnauthorizedException", message: "Valid authorization header not provided." }] }, 401),
    );
    const api = createApiClient({ url: CONFIG.graphqlUrl, getIdToken: async () => "t", fetch });
    await expect(api.myChildren()).rejects.toMatchObject({ errorType: "UnauthorizedException", status: 401 });
  });

  it("surfaces a non-JSON failure", async () => {
    const fetch = queuedFetch(() => new Response("Bad Gateway", { status: 502 }));
    const api = createApiClient({ url: CONFIG.graphqlUrl, getIdToken: async () => "t", fetch });
    await expect(api.myChildren()).rejects.toMatchObject({ status: 502 });
  });
});
