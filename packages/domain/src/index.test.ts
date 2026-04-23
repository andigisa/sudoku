import { describe, expect, it } from "vitest";
import {
  applyInput,
  clearCell,
  createGameState,
  getConflictingCells,
  getPeerIndexes,
  isSolved,
  parseGrid,
  toggleNoteMode
} from "./index.js";

const puzzle = {
  puzzleId: "easy-001",
  givens: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
  difficulty: "easy" as const,
  generatorVersion: "pack-v1",
  solutionChecksum: "sha256:test"
};

describe("domain helpers", () => {
  it("parses puzzle grids", () => {
    expect(parseGrid(puzzle.givens)).toHaveLength(81);
  });

  it("writes notes and pen values separately", () => {
    const game = createGameState(puzzle);
    const noteMode = toggleNoteMode(game);
    const withNote = applyInput(noteMode, 2, 1);
    const withValue = applyInput(withNote, 2, 4);

    expect(withNote.notes[2]).toEqual([1]);
    expect(withValue.board[2]).toBe(0);
  });

  it("clears editable cells", () => {
    const game = createGameState(puzzle);
    const withValue = applyInput(game, 2, 4);
    const cleared = clearCell(withValue, 2);

    expect(cleared.board[2]).toBe(0);
  });

  it("detects conflicts", () => {
    const board = parseGrid(puzzle.givens);
    board[2] = 5;

    expect(getConflictingCells(board)).toContain(2);
  });

  it("returns peer cells for a given index", () => {
    expect(getPeerIndexes(0)).toContain(1);
    expect(getPeerIndexes(0)).toContain(9);
    expect(getPeerIndexes(0)).toContain(10);
  });

  it("detects solved boards", () => {
    const solved = parseGrid(
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
    );

    expect(isSolved(solved)).toBe(true);
  });
});
