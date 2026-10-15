// Generate the spoken clips in public/audio/ via text-to-speech. Zero
// dependencies -- just Node 22's fetch and process.loadEnvFile.
//
//   npm run audio:gen                                  # every clip, ElevenLabs
//   npm run audio:gen -- --only correct,bigger-boat    # just these clips
//   npm run audio:gen -- --provider google             # free Google voice
//
// Providers:
//   elevenlabs (default) -- ElevenLabs' "Sarah" voice. Needs ELEVENLABS_API_KEY,
//     in the environment or in apps/game/.env.local (gitignored). Each clip
//     spends API credits, so prefer --only for one-off additions.
//   google -- the free Google Translate TTS endpoint (the same one gTTS wraps)
//     the game used before. No key needed, but a different voice: don't mix
//     its clips with ElevenLabs ones in one commit.
// There's deliberately no automatic fallback from one to the other, for the
// same reason -- a missing key is an error, not a silent voice change.
//
// --only takes clip names without the .mp3 (prompt-the, victory-the-shark, ...)
// and fails on any name that isn't a known clip, so a typo can't silently
// generate nothing.
//
// The generated .mp3 files are committed, so the app never needs this at runtime.
// The word list is parsed from src/data/words.ts, and the predator labels from
// src/game/predators.ts, so both stay a single source of truth.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { toMidSentence, slugify } from "../src/shared/textUtils.mjs";

const ROOT = new URL("../", import.meta.url);
const OUT = new URL("public/audio/", ROOT);

const { values: opts } = parseArgs({
  options: {
    provider: { type: "string", default: "elevenlabs" },
    only: { type: "string" },
  },
});

const wordsSrc = await readFile(new URL("src/data/words.ts", ROOT), "utf8");
const WORDS = [...wordsSrc.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

if (WORDS.length === 0) {
  console.error("No words found in src/data/words.ts");
  process.exit(1);
}

// One label per level, in order (level 1 first) -- mirrors PREDATOR_LEVELS.
const predatorsSrc = await readFile(new URL("src/game/predators.ts", ROOT), "utf8");
const PREDATOR_LABELS = [...predatorsSrc.matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);

if (PREDATOR_LABELS.length === 0) {
  console.error("No predator labels found in src/game/predators.ts");
  process.exit(1);
}

// defeat-<slug>.mp3 / victory-<slug>.mp3 -- text matches outcomeText() in
// src/game/outcome.ts so the voice says what the screen says. Keyed by the
// predator's own (slugified) label, not its position in PREDATOR_LEVELS,
// so these filenames don't need renaming every time levels get reordered
// -- see AGENTS.md and src/game/outcome.ts's outcomeAudioCue.
const outcomeCues = PREDATOR_LABELS.flatMap((label) => {
  const slug = slugify(label);
  return [
    [`defeat-${slug}`, `${label} caught the puffer fish this time. Try again!`],
    [`victory-${slug}`, `The puffer fish puffed up huge and sent ${toMidSentence(label)} packing!`],
  ];
});

const CUES = [
  ["correct", "Yes! That's right!"],
  ["wrong", "Oops."],
  ["survive-barely", "Phew! The puffer fish barely got away."],
  ["survive-hurt", "Nice work! The puffer fish got away."],
  ["release-the-kraken", "Release the Kraken!"],
  ["bigger-boat", "You're going to need a bigger boat."],
  ["move-in-herds", "They do move in herds."],
  ...outcomeCues,
];

// How a word is written in the prompt text, where its plain spelling reads
// wrong. A lowercase "a" comes out as a drawn-out "aaa"; capitalized, it's said
// clearly. Picked by ear against "ay", quoted and "the letter A" variants.
const SPOKEN_AS = { a: "A" };

const allJobs = [
  ...WORDS.map((w) => [
    `prompt-${w.toLowerCase()}`,
    `Which one spells... ${SPOKEN_AS[w] ?? w}?`,
  ]),
  ...CUES,
];

let jobs = allJobs;
if (opts.only !== undefined) {
  const wanted = opts.only
    .split(",")
    .map((n) => n.trim().replace(/\.mp3$/, ""))
    .filter(Boolean);
  if (wanted.length === 0) {
    console.error("--only needs at least one clip name.");
    process.exit(1);
  }
  const known = new Set(allJobs.map(([name]) => name));
  const unknown = wanted.filter((n) => !known.has(n));
  if (unknown.length > 0) {
    console.error(`Unknown clip name(s) for --only: ${unknown.join(", ")}`);
    process.exit(1);
  }
  jobs = allJobs.filter(([name]) => wanted.includes(name));
}

async function checkedMp3(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) throw new Error(`suspiciously small (${buf.length} bytes)`);
  return buf;
}

function googleProvider() {
  return {
    label: "Google Translate TTS",
    delayMs: 250, // be polite to the endpoint
    async fetchTts(text) {
      const url =
        "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=" +
        encodeURIComponent(text);
      return checkedMp3(await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } }));
    },
  };
}

// "Sarah", one of ElevenLabs' default premade voices -- clear and warm, picked
// by ear against a handful of other premade female voices on the word prompts.
// 64kbps mono matches the bitrate of the Google clips this replaced, so the
// committed audio doesn't grow; plenty for a single speaking voice.
const ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
const ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";

function elevenLabsProvider() {
  try {
    process.loadEnvFile(new URL(".env.local", ROOT));
  } catch (err) {
    // No .env.local -- fall back to whatever is already in the environment.
    // Anything else (unreadable file, a Node too old for loadEnvFile) would
    // otherwise surface as a misleading "set ELEVENLABS_API_KEY" below.
    if (err.code !== "ENOENT") throw err;
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error(
      "Set ELEVENLABS_API_KEY in apps/game/.env.local or the environment" +
        " (or pass --provider google).",
    );
    process.exit(1);
  }
  return {
    label: "ElevenLabs (Sarah)",
    delayMs: 0,
    async fetchTts(text) {
      const url =
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}` +
        "?output_format=mp3_44100_64";
      return checkedMp3(
        await fetch(url, {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ text, model_id: ELEVENLABS_MODEL_ID }),
        }),
      );
    },
  };
}

const PROVIDERS = { elevenlabs: elevenLabsProvider, google: googleProvider };
if (!Object.hasOwn(PROVIDERS, opts.provider)) {
  console.error(`Unknown --provider "${opts.provider}". Use: ${Object.keys(PROVIDERS).join(", ")}`);
  process.exit(1);
}
const provider = PROVIDERS[opts.provider]();

await mkdir(OUT, { recursive: true });
console.log(`Generating ${jobs.length} clips into public/audio/ via ${provider.label} ...`);

// One retry after a pause rides out a transient rate limit or network blip.
async function fetchWithRetry(text) {
  try {
    return await provider.fetchTts(text);
  } catch {
    await sleep(2000);
    return provider.fetchTts(text);
  }
}

const failed = [];
for (const [name, text] of jobs) {
  const file = `${name}.mp3`;
  try {
    const buf = await fetchWithRetry(text);
    await writeFile(new URL(file, OUT), buf);
    process.stdout.write(`  ${file}  (${buf.length} b)\n`);
  } catch (err) {
    process.stdout.write(`  ${file}  FAILED: ${err.message}\n`);
    failed.push(name);
  }
  if (provider.delayMs) await sleep(provider.delayMs);
}

console.log(`\nDone: ${jobs.length - failed.length}/${jobs.length} clips written.`);
if (failed.length > 0) {
  // A failed clip keeps whatever file was there before -- possibly another
  // provider's voice -- so don't commit until these are regenerated too.
  console.error(
    `\n${failed.length} clip(s) failed and still hold their previous audio.` +
      ` Rerun just those before committing:\n` +
      `  npm run audio:gen -- --provider ${opts.provider} --only ${failed.join(",")}`,
  );
  process.exit(1);
}
