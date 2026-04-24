import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring.js";

describe("calculateScore", () => {
  it("easy, no mistakes, no hints → 1000", () => {
    expect(calculateScore("easy", 0, 0, "v1")).toBe(1000);
  });

  it("medium, no mistakes, no hints → 1500", () => {
    expect(calculateScore("medium", 0, 0, "v1")).toBe(1500);
  });

  it("hard, no mistakes, no hints → 2200", () => {
    expect(calculateScore("hard", 0, 0, "v1")).toBe(2200);
  });

  it("expert, no mistakes, no hints → 3000", () => {
    expect(calculateScore("expert", 0, 0, "v1")).toBe(3000);
  });

  it("medium, 2 mistakes, 1 hint → 1300", () => {
    expect(calculateScore("medium", 2, 1, "v1")).toBe(1300);
  });

  it("easy, 1 mistake → 950", () => {
    expect(calculateScore("easy", 1, 0, "v1")).toBe(950);
  });

  it("expert, 1 hint → 2900", () => {
    expect(calculateScore("expert", 0, 1, "v1")).toBe(2900);
  });

  it("score is floored at 0 for extreme penalties", () => {
    expect(calculateScore("easy", 30, 0, "v1")).toBe(0);
  });

  it("throws on unknown ruleset version", () => {
    expect(() => calculateScore("easy", 0, 0, "v99")).toThrow("Unknown ruleset version: v99");
  });
});
