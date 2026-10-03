import { beforeEach, describe, expect, it } from "vitest";
import { loadMuted, saveMuted } from "./muteSelection";

const KEY = "puffer-panic:muted";

beforeEach(() => localStorage.clear());

describe("loadMuted", () => {
  it("defaults to unmuted when nothing is stored", () => {
    expect(loadMuted()).toBe(false);
  });

  it("treats an unrecognized stored value as unmuted", () => {
    localStorage.setItem(KEY, "maybe");
    expect(loadMuted()).toBe(false);
  });

  it("returns true when the stored value is '1'", () => {
    localStorage.setItem(KEY, "1");
    expect(loadMuted()).toBe(true);
  });
});

describe("saveMuted", () => {
  it("round-trips through loadMuted", () => {
    saveMuted(true);
    expect(loadMuted()).toBe(true);
    saveMuted(false);
    expect(loadMuted()).toBe(false);
  });
});
