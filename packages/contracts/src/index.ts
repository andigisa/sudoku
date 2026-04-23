import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard", "expert"]);

export const puzzleResponseSchema = z.object({
  puzzle_id: z.string(),
  givens: z.string().regex(/^[0-9]{81}$/),
  difficulty: difficultySchema,
  generator_version: z.string(),
  solution_checksum: z.string()
});

export type DifficultyDto = z.infer<typeof difficultySchema>;
export type PuzzleResponseDto = z.infer<typeof puzzleResponseSchema>;
