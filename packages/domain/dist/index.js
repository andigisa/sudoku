const GRID_SIZE = 81;
const BOX_WIDTH = 3;
export function parseGrid(grid) {
    if (!/^[0-9]{81}$/.test(grid)) {
        throw new Error("Grid must be an 81 character numeric string.");
    }
    return Array.from(grid, (char) => Number(char));
}
export function createGameState(puzzle) {
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
export function cloneGameState(state) {
    return {
        ...state,
        givens: [...state.givens],
        board: [...state.board],
        notes: state.notes.map((values) => [...values])
    };
}
export function serializeGameState(state) {
    return JSON.stringify(state);
}
export function deserializeGameState(raw) {
    const parsed = JSON.parse(raw);
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
export function toggleNoteMode(state) {
    return { ...state, noteMode: !state.noteMode };
}
export function setSelectedCell(state, selectedCell) {
    return { ...state, selectedCell };
}
export function setElapsedMs(state, elapsedMs) {
    return { ...state, elapsedMs };
}
export function setPaused(state, paused) {
    return { ...state, paused };
}
export function restartGame(state) {
    return createGameState(state.puzzle);
}
export function applyInput(state, cellIndex, value, solution) {
    assertValidIndex(cellIndex);
    assertValidValue(value);
    if (isGivenCell(state, cellIndex) || state.completedAt || state.gameOver) {
        return state;
    }
    return state.noteMode ? toggleCellNote(state, cellIndex, value) : setCellValue(state, cellIndex, value, solution);
}
export function clearCell(state, cellIndex) {
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
export function setCellValue(state, cellIndex, value, solution) {
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
export function applyHint(state, cellIndex, correctValue) {
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
export function toggleCellNote(state, cellIndex, value) {
    assertValidIndex(cellIndex);
    assertValidValue(value);
    if (isGivenCell(state, cellIndex) || state.board[cellIndex] !== 0 || state.completedAt) {
        return state;
    }
    const next = cloneGameState(state);
    const existing = new Set(next.notes[cellIndex]);
    if (existing.has(value)) {
        existing.delete(value);
    }
    else {
        existing.add(value);
    }
    next.notes[cellIndex] = [...existing].sort((left, right) => left - right);
    return next;
}
export function isGivenCell(state, cellIndex) {
    return state.givens[cellIndex] !== 0;
}
export function getConflictingCells(board) {
    const conflicts = new Set();
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
export function isSolved(board) {
    return board.every((value) => value >= 1 && value <= 9) && getConflictingCells(board).length === 0;
}
export function getPeerIndexes(cellIndex) {
    assertValidIndex(cellIndex);
    const row = Math.floor(cellIndex / 9);
    const column = cellIndex % 9;
    const rowIndexes = Array.from({ length: 9 }, (_, offset) => row * 9 + offset);
    const columnIndexes = Array.from({ length: 9 }, (_, offset) => offset * 9 + column);
    const boxRowStart = Math.floor(row / BOX_WIDTH) * BOX_WIDTH;
    const boxColumnStart = Math.floor(column / BOX_WIDTH) * BOX_WIDTH;
    const boxIndexes = [];
    for (let rowOffset = 0; rowOffset < BOX_WIDTH; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < BOX_WIDTH; columnOffset += 1) {
            boxIndexes.push((boxRowStart + rowOffset) * 9 + boxColumnStart + columnOffset);
        }
    }
    const peers = new Set([...rowIndexes, ...columnIndexes, ...boxIndexes]);
    peers.delete(cellIndex);
    return [...peers].sort((left, right) => left - right);
}
export function getRelatedCells(cellIndex) {
    assertValidIndex(cellIndex);
    const row = Math.floor(cellIndex / 9);
    const column = cellIndex % 9;
    const boxRowStart = Math.floor(row / BOX_WIDTH) * BOX_WIDTH;
    const boxColumnStart = Math.floor(column / BOX_WIDTH) * BOX_WIDTH;
    const related = new Set();
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
export function getCellsWithValue(board, value) {
    assertValidValue(value);
    return board
        .map((cellValue, index) => ({ cellValue, index }))
        .filter((entry) => entry.cellValue === value)
        .map((entry) => entry.index);
}
function assertValidIndex(cellIndex) {
    if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= GRID_SIZE) {
        throw new Error("Cell index must be between 0 and 80.");
    }
}
function assertValidValue(value) {
    if (!Number.isInteger(value) || value < 1 || value > 9) {
        throw new Error("Cell value must be between 1 and 9.");
    }
}
//# sourceMappingURL=index.js.map