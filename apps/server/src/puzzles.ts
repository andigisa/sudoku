import type { DifficultyDto, PuzzleResponseDto } from "@sudoku/contracts";

type PuzzlePack = Record<DifficultyDto, PuzzleResponseDto[]>;

const easy = [
  {
    puzzle_id: "easy-001",
    givens: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
    difficulty: "easy",
    generator_version: "pack-v1",
    solution_checksum: "sha256:easy-001"
  },
  {
    puzzle_id: "easy-002",
    givens: "000000000009805100051907420290401065000000000140508037026709580003102600000000000",
    difficulty: "easy",
    generator_version: "pack-v1",
    solution_checksum: "sha256:easy-002"
  }
] satisfies PuzzleResponseDto[];

const medium = [
  {
    puzzle_id: "medium-001",
    givens: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    difficulty: "medium",
    generator_version: "pack-v1",
    solution_checksum: "sha256:medium-001"
  },
  {
    puzzle_id: "medium-002",
    givens: "200080300060070084030500209000105408000000000402706000301007040720040060004010003",
    difficulty: "medium",
    generator_version: "pack-v1",
    solution_checksum: "sha256:medium-002"
  }
] satisfies PuzzleResponseDto[];

const hard = [
  {
    puzzle_id: "hard-001",
    givens: "000000907000420180000705026100904000050000040000507009920108000034059000507000000",
    difficulty: "hard",
    generator_version: "pack-v1",
    solution_checksum: "sha256:hard-001"
  },
  {
    puzzle_id: "hard-002",
    givens: "000900002050123400030000160908000000070000090000000205091000050007439020400007000",
    difficulty: "hard",
    generator_version: "pack-v1",
    solution_checksum: "sha256:hard-002"
  }
] satisfies PuzzleResponseDto[];

const expert = [
  {
    puzzle_id: "expert-001",
    givens: "300200000000107000706030500070009080900020004010800050009040301000702000000008006",
    difficulty: "expert",
    generator_version: "pack-v1",
    solution_checksum: "sha256:expert-001"
  },
  {
    puzzle_id: "expert-002",
    givens: "005300000800000020070010500400005300010070006003200080060500009004000030000009700",
    difficulty: "expert",
    generator_version: "pack-v1",
    solution_checksum: "sha256:expert-002"
  }
] satisfies PuzzleResponseDto[];

const puzzlePack: PuzzlePack = { easy, medium, hard, expert };

const allPuzzles = [...easy, ...medium, ...hard, ...expert];

export function getRandomPuzzle(difficulty: DifficultyDto): PuzzleResponseDto {
  const puzzles = puzzlePack[difficulty];
  const index = Math.floor(Math.random() * puzzles.length);
  return puzzles[index];
}

export function getPuzzleById(puzzleId: string): PuzzleResponseDto | undefined {
  return allPuzzles.find((p) => p.puzzle_id === puzzleId);
}
