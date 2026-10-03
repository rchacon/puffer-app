// A small fetch-based client for puffer-api's AppSync GraphQL API, typed by
// hand from its schema.graphql (rchacon/puffer-api) -- small enough that
// codegen isn't worth a build step yet. AppSync's Cognito User Pool
// authorizer takes the raw ID token as the Authorization header (no
// `Bearer ` prefix), and every resolver scopes reads/writes to the caller's
// own `sub`, so nothing here passes a parent id.

export type Activity = "SIGHT_WORD";
export type ChallengeType = "MULTIPLE_CHOICE" | "SPELL";
export type ProgressStatus = "IN_PROGRESS" | "NEEDS_SUPPORT" | "MASTERED";

export interface Parent {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  avatar: string | null;
  birthday: string;
  createdAt: string;
}

export interface CreateChildProfileInput {
  name: string;
  avatar?: string;
  /** AWSDate, `YYYY-MM-DD`. Required by the schema today -- see the plan's
   *  open question about making it optional / birth-year-only. */
  birthday: string;
}

export interface RecordAttemptInput {
  /** Generate once when the child answers and reuse for every retry -- the
   *  API treats it as the idempotency key. 8-64 chars, no `#`. */
  attemptId: string;
  childId: string;
  activity: Activity;
  target: string;
  challengeType: ChallengeType;
  answer: string;
  /** Multiple choice only. */
  presentedOptions?: string[];
  /** When the child answered (UTC ISO-8601). Rejected if more than 30 days
   *  old or 5 minutes in the future. */
  occurredAt: string;
}

export interface Attempt {
  id: string;
  childId: string;
  activity: Activity;
  target: string;
  challengeType: ChallengeType;
  correct: boolean;
  occurredAt: string;
  receivedAt: string;
}

export interface Progress {
  childId: string;
  activity: Activity;
  target: string;
  status: ProgressStatus;
  attemptCount: number;
  lastPracticedAt: string;
}

/** No session (or the refresh token is no longer valid) -- sign in again. */
export class NotSignedInError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "NotSignedInError";
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    /** AppSync's `errorType`, e.g. `UnauthorizedException`, or a resolver's
     *  own (`NotFound`, `Conflict`, `ValidationError`). */
    readonly errorType?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const CHILD_FIELDS = "id parentId name avatar birthday createdAt";
const ATTEMPT_FIELDS = "id childId activity target challengeType correct occurredAt receivedAt";

const MY_PROFILE = `query MyProfile { myProfile { id email name createdAt } }`;
const MY_CHILDREN = `query MyChildren { myChildren { ${CHILD_FIELDS} } }`;
const CHILD_PROGRESS = `query ChildProgress($childId: ID!, $activity: Activity!, $status: ProgressStatus) {
  childProgress(childId: $childId, activity: $activity, status: $status) {
    childId activity target status attemptCount lastPracticedAt
  }
}`;
const CREATE_CHILD_PROFILE = `mutation CreateChildProfile($input: CreateChildProfileInput!) {
  createChildProfile(input: $input) { ${CHILD_FIELDS} }
}`;
const RECORD_ATTEMPT = `mutation RecordAttempt($input: RecordAttemptInput!) {
  recordAttempt(input: $input) { ${ATTEMPT_FIELDS} }
}`;

export interface ApiClientOptions {
  url: string;
  getIdToken: () => Promise<string | null>;
  fetch?: typeof fetch;
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient({
  url,
  getIdToken,
  fetch: fetchImpl = (...args) => globalThis.fetch(...args),
}: ApiClientOptions) {
  async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const token = await getIdToken();
    if (!token) throw new NotSignedInError();
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json().catch(() => null);
    const [error] = body?.errors ?? [];
    if (error) throw new ApiError(error.message ?? "GraphQL error", error.errorType, res.status);
    if (!res.ok || !body?.data) {
      throw new ApiError(`GraphQL request failed (${res.status})`, undefined, res.status);
    }
    return body.data as T;
  }

  return {
    graphql,
    myProfile: async () => (await graphql<{ myProfile: Parent | null }>(MY_PROFILE)).myProfile,
    myChildren: async () => (await graphql<{ myChildren: Child[] }>(MY_CHILDREN)).myChildren,
    childProgress: async (childId: string, activity: Activity, status?: ProgressStatus) =>
      (await graphql<{ childProgress: Progress[] }>(CHILD_PROGRESS, { childId, activity, status }))
        .childProgress,
    createChildProfile: async (input: CreateChildProfileInput) =>
      (await graphql<{ createChildProfile: Child }>(CREATE_CHILD_PROFILE, { input }))
        .createChildProfile,
    recordAttempt: async (input: RecordAttemptInput) =>
      (await graphql<{ recordAttempt: Attempt }>(RECORD_ATTEMPT, { input })).recordAttempt,
  };
}
