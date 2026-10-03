import { beforeEach, describe, expect, it } from "vitest";
import { loadMode, saveMode } from "./modeSelection";

const KEY = "puffer-panic:mode";

beforeEach(() => localStorage.clear());

describe("loadMode", () => {
  it("returns 'easy' when nothing is stored", () => {
    expect(loadMode()).toBe("easy");
  });

  it("returns 'easy' when the stored value isn't a known mode", () => {
    localStorage.setItem(KEY, "impossible");
    expect(loadMode()).toBe("easy");
  });

  it("returns the stored mode when valid", () => {
    localStorage.setItem(KEY, "hard");
    expect(loadMode()).toBe("hard");
  });
});

describe("saveMode", () => {
  it("round-trips through loadMode", () => {
    saveMode("hard");
    expect(loadMode()).toBe("hard");
  });
});
