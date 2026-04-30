import type { DifficultyDto, PuzzleResponseDto } from "@sudoku/contracts";
export declare function getRandomPuzzle(difficulty: DifficultyDto): PuzzleResponseDto;
export declare function getPuzzleById(puzzleId: string): PuzzleResponseDto | undefined;
export declare function listAllPuzzleIds(): Array<{
    puzzle_id: string;
    difficulty: string;
}>;
