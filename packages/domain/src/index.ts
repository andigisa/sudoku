export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type InputMode = "pen" | "note";

export interface PuzzleDefinition {
  puzzleId: string;
  givens: string;
  difficulty: Difficulty;
  generatorVersion: string;
  solutionChecksum: string;
}

export interface SerializedGameState {
  puzzle: PuzzleDefinition;
  givens: number[];
  board: number[];
  notes: number[][];
  selectedCell: number | null;
  noteMode: boolean;
  elapsedMs: number;
  paused: boolean;
  completedAt: string | null;
  mistakes: number;
  gameOver: boolean;
  hintsUsed: number;
}

const GRID_SIZE = 81;
const BOX_WIDTH = 3;

export function parseGrid(grid: string): number[] {
  if (!/^[0-9]{81}$/.test(grid)) {
    throw new Error("Grid must be an 81 character numeric string.");
  }

  return Array.from(grid, (char) => Number(char));
}

export function createGameState(puzzle: PuzzleDefinition): SerializedGameState {
  const givens = parseGrid(puzzle.givens);

  return {
    puzzle,
    givens,
    board: [...givens],
    notes: Array.from({ length: GRID_SIZE }, () => []),
    selectedCell: null,
    noteMode: false,
    elapsedMs: 0,
    paused: false,
    completedAt: null,
    mistakes: 0,
    gameOver: false,
    hintsUsed: 0
  };
}

export function cloneGameState(state: SerializedGameState): SerializedGameState {
  return {
    ...state,
    givens: [...state.givens],
    board: [...state.board],
    notes: state.notes.map((values) => [...values])
  };
}

export function serializeGameState(state: SerializedGameState): string {
  return JSON.stringify(state);
}

export function deserializeGameState(raw: string): SerializedGameState {
  const parsed = JSON.parse(raw) as SerializedGameState;

  if (!parsed?.puzzle?.givens) {
    throw new Error("Invalid saved game state.");
  }

  return {
    ...parsed,
    givens: [...parsed.givens],
    board: [...parsed.board],
    notes: parsed.notes.map((values) => [...values]),
    mistakes: parsed.mistakes ?? 0,
    gameOver: parsed.gameOver ?? false,
    hintsUsed: parsed.hintsUsed ?? 0
  };
}

export function toggleNoteMode(state: SerializedGameState): SerializedGameState {
  return { ...state, noteMode: !state.noteMode };
}

export function setSelectedCell(
  state: SerializedGameState,
  selectedCell: number | null
): SerializedGameState {
  return { ...state, selectedCell };
}

export function setElapsedMs(state: SerializedGameState, elapsedMs: number): SerializedGameState {
  return { ...state, elapsedMs };
}

export function setPaused(state: SerializedGameState, paused: boolean): SerializedGameState {
  return { ...state, paused };
}

export function restartGame(state: SerializedGameState): SerializedGameState {
  return createGameState(state.puzzle);
}

export function applyInput(
  state: SerializedGameState,
  cellIndex: number,
  value: number,
  solution?: number[]
): SerializedGameState {
  assertValidIndex(cellIndex);
  assertValidValue(value);

  if (isGivenCell(state, cellIndex) || state.completedAt || state.gameOver) {
    return state;
  }

  return state.noteMode ? toggleCellNote(state, cellIndex, value) : setCellValue(state, cellIndex, value, solution);
}

export function clearCell(state: SerializedGameState, cellIndex: number): SerializedGameState {
  assertValidIndex(cellIndex);

  if (isGivenCell(state, cellIndex) || state.completedAt) {
    return state;
  }

  const next = cloneGameState(state);
  next.board[cellIndex] = 0;
  next.notes[cellIndex] = [];
  next.completedAt = null;
  return next;
}

export function setCellValue(
  state: SerializedGameState,
  cellIndex: number,
  value: number,
  solution?: number[]
): SerializedGameState {
  assertValidIndex(cellIndex);
  assertValidValue(value);

  if (isGivenCell(state, cellIndex) || state.completedAt) {
    return state;
  }

  const isMistake = solution
    ? value !== solution[cellIndex]
    : getPeerIndexes(cellIndex).some((peer) => state.board[peer] === value);

  const next = cloneGameState(state);
  next.board[cellIndex] = value;
  next.notes[cellIndex] = [];
  next.mistakes = isMistake ? state.mistakes + 1 : state.mistakes;
  next.gameOver = next.mistakes >= 3;
  next.completedAt = !next.gameOver && isSolved(next.board) ? new Date().toISOString() : null;
  return next;
}

export function applyHint(
  state: SerializedGameState,
  cellIndex: number,
  correctValue: number
): SerializedGameState {
  assertValidIndex(cellIndex);
  assertValidValue(correctValue);

  if (isGivenCell(state, cellIndex) || state.completedAt || state.gameOver) {
    return state;
  }

  const next = cloneGameState(state);
  next.board[cellIndex] = correctValue;
  next.notes[cellIndex] = [];
  next.hintsUsed += 1;
  next.completedAt = isSolved(next.board) ? new Date().toISOString() : null;
  return next;
}

export function toggleCellNote(
  state: SerializedGameState,
  cellIndex: number,
  value: number
): SerializedGameState {
  assertValidIndex(cellIndex);
  assertValidValue(value);

  if (isGivenCell(state, cellIndex) || state.board[cellIndex] !== 0 || state.completedAt) {
    return state;
  }

  const next = cloneGameState(state);
  const existing = new Set(next.notes[cellIndex]);

  if (existing.has(value)) {
    existing.delete(value);
  } else {
    existing.add(value);
  }

  next.notes[cellIndex] = [...existing].sort((left, right) => left - right);
  return next;
}

export function isGivenCell(state: SerializedGameState, cellIndex: number): boolean {
  return state.givens[cellIndex] !== 0;
}

export function getConflictingCells(board: number[]): number[] {
  const conflicts = new Set<number>();

  for (let index = 0; index < GRID_SIZE; index += 1) {
    const value = board[index];
    if (value === 0) {
      continue;
    }

    for (const peer of getPeerIndexes(index)) {
      if (board[peer] === value) {
        conflicts.add(index);
        conflicts.add(peer);
      }
    }
  }

  return [...conflicts].sort((left, right) => left - right);
}

export function isSolved(board: number[]): boolean {
  return board.every((value) => value >= 1 && value <= 9) && getConflictingCells(board).length === 0;
}

export function getPeerIndexes(cellIndex: number): number[] {
  assertValidIndex(cellIndex);

  const row = Math.floor(cellIndex / 9);
  const column = cellIndex % 9;
  const rowIndexes = Array.from({ length: 9 }, (_, offset) => row * 9 + offset);
  const columnIndexes = Array.from({ length: 9 }, (_, offset) => offset * 9 + column);

  const boxRowStart = Math.floor(row / BOX_WIDTH) * BOX_WIDTH;
  const boxColumnStart = Math.floor(column / BOX_WIDTH) * BOX_WIDTH;
  const boxIndexes: number[] = [];

  for (let rowOffset = 0; rowOffset < BOX_WIDTH; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < BOX_WIDTH; columnOffset += 1) {
      boxIndexes.push((boxRowStart + rowOffset) * 9 + boxColumnStart + columnOffset);
    }
  }

  const peers = new Set<number>([...rowIndexes, ...columnIndexes, ...boxIndexes]);
  peers.delete(cellIndex);

  return [...peers].sort((left, right) => left - right);
}

export function getRelatedCells(cellIndex: number): number[] {
  assertValidIndex(cellIndex);

  const row = Math.floor(cellIndex / 9);
  const column = cellIndex % 9;
  const boxRowStart = Math.floor(row / BOX_WIDTH) * BOX_WIDTH;
  const boxColumnStart = Math.floor(column / BOX_WIDTH) * BOX_WIDTH;
  const related = new Set<number>();

  for (let offset = 0; offset < 9; offset += 1) {
    related.add(row * 9 + offset);
    related.add(offset * 9 + column);
  }

  for (let rowOffset = 0; rowOffset < BOX_WIDTH; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < BOX_WIDTH; columnOffset += 1) {
      related.add((boxRowStart + rowOffset) * 9 + boxColumnStart + columnOffset);
    }
  }

  return [...related].sort((left, right) => left - right);
}

export function getCellsWithValue(board: number[], value: number): number[] {
  assertValidValue(value);

  return board
    .map((cellValue, index) => ({ cellValue, index }))
    .filter((entry) => entry.cellValue === value)
    .map((entry) => entry.index);
}

function assertValidIndex(cellIndex: number): void {
  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= GRID_SIZE) {
    throw new Error("Cell index must be between 0 and 80.");
  }
}

function assertValidValue(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 9) {
    throw new Error("Cell value must be between 1 and 9.");
  }
}
