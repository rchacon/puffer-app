import { beforeEach, describe, expect, it } from "vitest";
import { loadSelection, saveSelection } from "./wordSelection";

const ALL = ["a", "cat", "dog", "run", "fish"];
const KEY = "puffer-panic:selected-words";

beforeEach(() => localStorage.clear());

describe("loadSelection", () => {
  it("returns the full list when nothing is stored", () => {
    expect(loadSelection(ALL)).toEqual(ALL);
  });

  it("returns the full list when the stored value is not valid JSON", () => {
    localStorage.setItem(KEY, "{not json");
    expect(loadSelection(ALL)).toEqual(ALL);
  });

  it("returns the full list when nothing stored is still a known word", () => {
    localStorage.setItem(KEY, JSON.stringify(["gone", "missing"]));
    expect(loadSelection(ALL)).toEqual(ALL);
  });

  it("returns the stored subset, filtered to known words", () => {
    localStorage.setItem(KEY, JSON.stringify(["dog", "cat", "stale"]));
    expect(loadSelection(ALL)).toEqual(["dog", "cat"]);
  });
});

describe("saveSelection", () => {
  it("round-trips through loadSelection", () => {
    saveSelection(["cat", "fish"]);
    expect(loadSelection(ALL)).toEqual(["cat", "fish"]);
  });
});
