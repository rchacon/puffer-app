import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

// jsdom does not implement media playback; make it a no-op so the audio helper
// resolves cleanly in tests.
vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() =>
  Promise.resolve(),
);
vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(
  () => undefined,
);
