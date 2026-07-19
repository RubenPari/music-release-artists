import { describe, expect, it } from "vitest";
import { parseReleaseTypesParam } from "./releases";

describe("parseReleaseTypesParam", () => {
  it("returns null for undefined", () => {
    expect(parseReleaseTypesParam(undefined)).toBeNull();
  });

  it("normalizes and keeps valid types", () => {
    expect(parseReleaseTypesParam("Album, ep")).toEqual(["album", "ep"]);
  });

  it("returns null when nothing valid remains", () => {
    expect(parseReleaseTypesParam("nope")).toBeNull();
  });

  it("drops invalid entries and keeps valid ones", () => {
    expect(parseReleaseTypesParam("album, nope, single")).toEqual([
      "album",
      "single",
    ]);
  });
});
