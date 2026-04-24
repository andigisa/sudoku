import { describe, it, expect } from "vitest";
import { buildLeaderboard, deriveDisplayName } from "./leaderboard.js";

const base = {
  entryId: "e1",
  mistakes: 0,
  hintsUsed: 0
};

describe("buildLeaderboard", () => {
  it("higher score ranks first", () => {
    const entries = [
      { ...base, guestId: "aaa", entryId: "e1", score: 900, elapsedMs: 60_000, createdAt: "2026-04-23T10:00:00Z" },
      { ...base, guestId: "bbb", entryId: "e2", score: 1000, elapsedMs: 90_000, createdAt: "2026-04-23T11:00:00Z" }
    ];
    const ranked = buildLeaderboard(entries);
    expect(ranked[0].guestId).toBe("bbb");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });

  it("tie on score: lower elapsed time wins", () => {
    const entries = [
      { ...base, guestId: "aaa", entryId: "e1", score: 1000, elapsedMs: 120_000, createdAt: "2026-04-23T10:00:00Z" },
      { ...base, guestId: "bbb", entryId: "e2", score: 1000, elapsedMs: 60_000, createdAt: "2026-04-23T11:00:00Z" }
    ];
    const ranked = buildLeaderboard(entries);
    expect(ranked[0].guestId).toBe("bbb");
  });

  it("tie on score and time: earlier submission wins", () => {
    const entries = [
      { ...base, guestId: "aaa", entryId: "e1", score: 1000, elapsedMs: 60_000, createdAt: "2026-04-23T12:00:00Z" },
      { ...base, guestId: "bbb", entryId: "e2", score: 1000, elapsedMs: 60_000, createdAt: "2026-04-23T10:00:00Z" }
    ];
    const ranked = buildLeaderboard(entries);
    expect(ranked[0].guestId).toBe("bbb");
  });

  it("assigns sequential ranks", () => {
    const entries = [
      { ...base, guestId: "aaa", entryId: "e1", score: 500, elapsedMs: 60_000, createdAt: "2026-04-23T10:00:00Z" },
      { ...base, guestId: "bbb", entryId: "e2", score: 1000, elapsedMs: 60_000, createdAt: "2026-04-23T10:00:00Z" },
      { ...base, guestId: "ccc", entryId: "e3", score: 750, elapsedMs: 60_000, createdAt: "2026-04-23T10:00:00Z" }
    ];
    const ranked = buildLeaderboard(entries);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(ranked.map((r) => r.score)).toEqual([1000, 750, 500]);
  });

  it("returns empty array for empty input", () => {
    expect(buildLeaderboard([])).toEqual([]);
  });
});

describe("deriveDisplayName", () => {
  it("uses first 5 chars of guestId", () => {
    expect(deriveDisplayName("abcdef1234")).toBe("Guest #abcde");
  });

  it("is deterministic", () => {
    const id = "deadbeef1234567890";
    expect(deriveDisplayName(id)).toBe(deriveDisplayName(id));
  });
});
