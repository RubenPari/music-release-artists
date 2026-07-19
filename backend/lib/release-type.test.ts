import { describe, expect, it } from "vitest";
import { classifyReleaseType } from "./release-type";

describe("classifyReleaseType", () => {
  it("maps album", () => {
    expect(classifyReleaseType("album", 12)).toBe("album");
  });
  it("maps short singles as ep", () => {
    expect(classifyReleaseType("single", 4)).toBe("ep");
  });
  it("maps one-track as single", () => {
    expect(classifyReleaseType("single", 1)).toBe("single");
  });
});
