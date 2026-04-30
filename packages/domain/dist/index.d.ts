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
export declare function parseGrid(grid: string): number[];
export declare function createGameState(puzzle: PuzzleDefinition): SerializedGameState;
export declare function cloneGameState(state: SerializedGameState): SerializedGameState;
export declare function serializeGameState(state: SerializedGameState): string;
export declare function deserializeGameState(raw: string): SerializedGameState;
export declare function toggleNoteMode(state: SerializedGameState): SerializedGameState;
export declare function setSelectedCell(state: SerializedGameState, selectedCell: number | null): SerializedGameState;
export declare function setElapsedMs(state: SerializedGameState, elapsedMs: number): SerializedGameState;
export declare function setPaused(state: SerializedGameState, paused: boolean): SerializedGameState;
export declare function restartGame(state: SerializedGameState): SerializedGameState;
export declare function applyInput(state: SerializedGameState, cellIndex: number, value: number, solution?: number[]): SerializedGameState;
export declare function clearCell(state: SerializedGameState, cellIndex: number): SerializedGameState;
export declare function setCellValue(state: SerializedGameState, cellIndex: number, value: number, solution?: number[]): SerializedGameState;
export declare function applyHint(state: SerializedGameState, cellIndex: number, correctValue: number): SerializedGameState;
export declare function toggleCellNote(state: SerializedGameState, cellIndex: number, value: number): SerializedGameState;
export declare function isGivenCell(state: SerializedGameState, cellIndex: number): boolean;
export declare function getConflictingCells(board: number[]): number[];
export declare function isSolved(board: number[]): boolean;
export declare function getPeerIndexes(cellIndex: number): number[];
export declare function getRelatedCells(cellIndex: number): number[];
export declare function getCellsWithValue(board: number[], value: number): number[];
