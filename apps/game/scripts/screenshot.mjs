// Drive the running app in a real (headless) browser and save screenshots of
// each screen. No dependencies -- talks to Chrome over the DevTools Protocol
// using Node's built-in fetch + WebSocket.
//
//   npm run dev                       # in another terminal
//   npm run screenshot                # -> screenshots/*.png
//   npm run screenshot http://localhost:4173/   # e.g. a `vite preview` build
//
// It launches its own headless Chrome and shuts it down afterwards. Point it
// at CHROME_BIN if the binary isn't one of the usual names.

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = process.argv[2] || "http://localhost:5173/";
const OUT = new URL("../screenshots/", import.meta.url);
const PORT = 9222;
const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  "google-chrome",
  "google-chrome-stable",
  "chromium",
  "chromium-browser",
].filter(Boolean);

async function reachable(url) {
  try {
    await fetch(url);
    return true;
  } catch {
    return false;
  }
}

async function waitUntil(fn, { tries = 40, gap = 250, label = "condition" } = {}) {
  for (let i = 0; i < tries; i++) {
    if (await fn()) return;
    await sleep(gap);
  }
  throw new Error(`timed out waiting for ${label}`);
}

// --- preconditions ---------------------------------------------------------
if (!(await reachable(BASE))) {
  console.error(`Dev server not reachable at ${BASE}. Start it with \`npm run dev\`.`);
  process.exit(1);
}

// --- launch headless Chrome ---------------------------------------------------
let chrome;
for (const bin of CHROME_CANDIDATES) {
  chrome = spawn(
    bin,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      `--remote-debugging-port=${PORT}`,
      "--window-size=900,1000",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  const started = await new Promise((resolve) => {
    chrome.once("spawn", () => resolve(true));
    chrome.once("error", () => resolve(false));
  });
  if (started) {
    console.log(`launched ${bin}`);
    break;
  }
  chrome = null;
}
if (!chrome) {
  console.error(`Could not launch Chrome. Tried: ${CHROME_CANDIDATES.join(", ")}. Set CHROME_BIN.`);
  process.exit(1);
}

const cleanup = () => chrome?.kill("SIGKILL");
process.on("exit", cleanup);
process.on("SIGINT", () => process.exit(1));

// --- connect to the DevTools Protocol --------------------------------------
await waitUntil(() => reachable(`http://localhost:${PORT}/json/version`), {
  label: "chrome devtools",
});
const targets = await (await fetch(`http://localhost:${PORT}/json`)).json();
const page = targets.find((t) => t.type === "page");
if (!page) throw new Error("no page target in Chrome");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 0;
const pending = new Map();
const consoleMsgs = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  } else if (m.method === "Runtime.consoleAPICalled") {
    const text = m.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
    consoleMsgs.push(`[${m.params.type}] ${text}`);
  } else if (m.method === "Runtime.exceptionThrown") {
    const d = m.params.exceptionDetails;
    consoleMsgs.push(`[exception] ${d.exception?.description || d.text}`);
  }
};

const send = (method, params = {}) => {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
};

const evalJs = async (expression) => {
  const { result, exceptionDetails } = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.text + " " + (exceptionDetails.exception?.description || ""));
  }
  return result.value;
};

const waitForDom = (expr, label = expr) =>
  waitUntil(() => evalJs(`!!(${expr})`), { label });

const shot = async (name) => {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(new URL(`${name}.png`, OUT), Buffer.from(data, "base64"));
  console.log(`  screenshots/${name}.png`);
};

// --- drive the app -------------------------------------------------------------
await mkdir(OUT, { recursive: true });
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 900,
  height: 1000,
  deviceScaleFactor: 2,
  mobile: false,
});

console.log(`\ndriving ${BASE}`);

await send("Page.navigate", { url: BASE });
await waitForDom(`document.querySelector('.start__button')`, "start screen");
await sleep(400);
await shot("01-start");

// Expand the word picker.
await evalJs(`document.querySelector('.wordpicker__summary').click()`);
await waitForDom(`document.querySelector('.wordpicker__body')`, "word picker");
await sleep(200);
await shot("01b-word-picker");
await evalJs(`document.querySelector('.wordpicker__summary').click()`);
await sleep(150);

await evalJs(`document.querySelector('.start__button').click()`);
await waitForDom(
  `document.querySelector('.scene__svg') && document.querySelectorAll('.card').length === 3`,
  "round 1",
);
await sleep(700);
await shot("02-round");

await evalJs(`document.querySelectorAll('.card')[0].click()`);
await waitForDom(`document.querySelector('.card--correct')`, "answer reveal");
await sleep(300);
await shot("03-reveal");

// Use the ?debug=1 overlay to reach each ending.
await evalJs(`location.search = '?debug=1'`);
await waitForDom(`document.querySelector('.debug')`, "debug overlay");
await sleep(300);

for (const [label, file, hold] of [
  ["victory", "04-victory", 1600],
  ["hurt", "05-survive-hurt", 1200],
  ["barely", "06-survive-barely", 1200],
  ["defeat", "07-defeat", 1400],
]) {
  await evalJs(
    `[...document.querySelectorAll('.debug__buttons button')]` +
      `.find(b => /${label}/i.test(b.textContent)).click()`,
  );
  await waitForDom(`document.querySelector('.result')`, `${label} result`);
  await sleep(hold);
  await shot(file);
}

console.log("\nconsole output during run:");
console.log(consoleMsgs.length ? consoleMsgs.map((m) => "  " + m).join("\n") : "  (none)");

const errors = consoleMsgs.filter((m) => /^\[(error|exception)\]/.test(m));
ws.close();
process.exit(errors.length ? 1 : 0);
