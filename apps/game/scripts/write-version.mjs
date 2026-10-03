// Writes dist/version.json ({ commit, builtAt }) after a production build so a
// deployed copy can be identified with `curl <site>/version.json`. Runs as the
// `postbuild` npm hook. Zero dependencies -- Node built-ins only.
//
// Adapted from cd-webapp's scripts/write-version.mjs.

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const SHA_RE = /^[0-9a-f]{7,40}$/i;
const isSha = (value) => typeof value === "string" && SHA_RE.test(value.trim());

function getCommit() {
  // Prefer a SHA injected by CI / the deploy platform: it's correct even when
  // the checkout is shallow or detached, where git can't be trusted. Still
  // validate it -- a real cd-webapp prod build once injected the literal
  // string "HEAD" here instead of a hash.
  for (const injected of [process.env.GITHUB_SHA, process.env.AWS_COMMIT_ID]) {
    if (isSha(injected)) return injected.trim().slice(0, 7);
  }

  try {
    // --verify: fail loudly on an unresolvable HEAD rather than risk a
    // success-with-garbage-output failure mode.
    const out = execSync("git rev-parse --verify --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (isSha(out)) return out;
  } catch {
    // not a git repo, or HEAD unresolvable -- fall through
  }

  return "unknown";
}

const version = {
  commit: getCommit(),
  builtAt: new Date().toISOString(),
};

mkdirSync("dist", { recursive: true });
writeFileSync("dist/version.json", JSON.stringify(version, null, 2) + "\n");
console.log("Wrote dist/version.json:", version);
