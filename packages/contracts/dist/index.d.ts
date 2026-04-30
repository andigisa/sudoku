import { z } from "zod";
export declare const difficultySchema: z.ZodEnum<{
    easy: "easy";
    medium: "medium";
    hard: "hard";
    expert: "expert";
}>;
export declare const puzzleResponseSchema: z.ZodObject<{
    puzzle_id: z.ZodString;
    givens: z.ZodString;
    difficulty: z.ZodEnum<{
        easy: "easy";
        medium: "medium";
        hard: "hard";
        expert: "expert";
    }>;
    generator_version: z.ZodString;
    solution_checksum: z.ZodString;
    solution: z.ZodString;
}, z.core.$strip>;
export declare const hintRequestSchema: z.ZodObject<{
    cell_index: z.ZodNumber;
}, z.core.$strip>;
export declare const hintResponseSchema: z.ZodObject<{
    cell_index: z.ZodNumber;
    value: z.ZodNumber;
}, z.core.$strip>;
export declare const sessionResponseSchema: z.ZodObject<{
    session_id: z.ZodString;
    puzzle_id: z.ZodString;
    difficulty: z.ZodEnum<{
        easy: "easy";
        medium: "medium";
        hard: "hard";
        expert: "expert";
    }>;
    state_json: z.ZodString;
    started_at: z.ZodString;
    completed_at: z.ZodNullable<z.ZodString>;
    elapsed_ms: z.ZodNumber;
    mistakes: z.ZodNumber;
}, z.core.$strip>;
export declare const createSessionRequestSchema: z.ZodObject<{
    puzzle_id: z.ZodString;
    difficulty: z.ZodEnum<{
        easy: "easy";
        medium: "medium";
        hard: "hard";
        expert: "expert";
    }>;
    state_json: z.ZodString;
}, z.core.$strip>;
export declare const updateSessionRequestSchema: z.ZodObject<{
    state_json: z.ZodString;
    elapsed_ms: z.ZodNumber;
    mistakes: z.ZodNumber;
    completed_at: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const dailyChallengeResponseSchema: z.ZodObject<{
    date: z.ZodString;
    puzzle: z.ZodObject<{
        puzzle_id: z.ZodString;
        givens: z.ZodString;
        difficulty: z.ZodEnum<{
            easy: "easy";
            medium: "medium";
            hard: "hard";
            expert: "expert";
        }>;
        generator_version: z.ZodString;
        solution_checksum: z.ZodString;
        solution: z.ZodString;
    }, z.core.$strip>;
    session: z.ZodNullable<z.ZodObject<{
        session_id: z.ZodString;
        puzzle_id: z.ZodString;
        difficulty: z.ZodEnum<{
            easy: "easy";
            medium: "medium";
            hard: "hard";
            expert: "expert";
        }>;
        state_json: z.ZodString;
        started_at: z.ZodString;
        completed_at: z.ZodNullable<z.ZodString>;
        elapsed_ms: z.ZodNumber;
        mistakes: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const telemetryEventSchema: z.ZodObject<{
    event: z.ZodString;
    session_id: z.ZodOptional<z.ZodString>;
    payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const tournamentStatusSchema: z.ZodEnum<{
    upcoming: "upcoming";
    active: "active";
    ended: "ended";
}>;
export declare const tournamentResponseSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    title: z.ZodString;
    starts_at: z.ZodString;
    ends_at: z.ZodString;
    puzzle_id: z.ZodString;
    ruleset_version: z.ZodString;
    status: z.ZodEnum<{
        upcoming: "upcoming";
        active: "active";
        ended: "ended";
    }>;
}, z.core.$strip>;
export declare const createTournamentRequestSchema: z.ZodObject<{
    slug: z.ZodString;
    title: z.ZodString;
    starts_at: z.ZodString;
    ends_at: z.ZodString;
    puzzle_id: z.ZodString;
}, z.core.$strip>;
export declare const submitEntryRequestSchema: z.ZodObject<{
    session_id: z.ZodString;
    elapsed_ms: z.ZodNumber;
    mistakes: z.ZodNumber;
    hints_used: z.ZodNumber;
    final_board: z.ZodString;
}, z.core.$strip>;
export declare const submitEntryResponseSchema: z.ZodObject<{
    entry_id: z.ZodString;
    score: z.ZodNumber;
    rank: z.ZodNullable<z.ZodNumber>;
    is_best: z.ZodBoolean;
    idempotent: z.ZodBoolean;
}, z.core.$strip>;
export declare const leaderboardEntrySchema: z.ZodObject<{
    rank: z.ZodNumber;
    display_name: z.ZodString;
    score: z.ZodNumber;
    elapsed_ms: z.ZodNumber;
    mistakes: z.ZodNumber;
    hints_used: z.ZodNumber;
    submitted_at: z.ZodString;
}, z.core.$strip>;
export declare const leaderboardResponseSchema: z.ZodObject<{
    tournament_id: z.ZodString;
    total: z.ZodNumber;
    entries: z.ZodArray<z.ZodObject<{
        rank: z.ZodNumber;
        display_name: z.ZodString;
        score: z.ZodNumber;
        elapsed_ms: z.ZodNumber;
        mistakes: z.ZodNumber;
        hints_used: z.ZodNumber;
        submitted_at: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const registerRequestSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodString;
    display_name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const loginRequestSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    password: z.ZodString;
}, z.core.$strip>;
export declare const userProfileSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    display_name: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
}, z.core.$strip>;
export declare const authResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        display_name: z.ZodNullable<z.ZodString>;
        created_at: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateProfileRequestSchema: z.ZodObject<{
    display_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const passwordResetRequestSchema: z.ZodObject<{
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strip>;
export declare const syncBootstrapResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        display_name: z.ZodNullable<z.ZodString>;
        created_at: z.ZodString;
    }, z.core.$strip>;
    settings: z.ZodRecord<z.ZodString, z.ZodString>;
    recent_sessions: z.ZodArray<z.ZodObject<{
        session_id: z.ZodString;
        puzzle_id: z.ZodString;
        difficulty: z.ZodEnum<{
            easy: "easy";
            medium: "medium";
            hard: "hard";
            expert: "expert";
        }>;
        state_json: z.ZodString;
        started_at: z.ZodString;
        completed_at: z.ZodNullable<z.ZodString>;
        elapsed_ms: z.ZodNumber;
        mistakes: z.ZodNumber;
    }, z.core.$strip>>;
    in_progress_games: z.ZodArray<z.ZodObject<{
        session_id: z.ZodString;
        puzzle_id: z.ZodString;
        difficulty: z.ZodEnum<{
            easy: "easy";
            medium: "medium";
            hard: "hard";
            expert: "expert";
        }>;
        state_json: z.ZodString;
        started_at: z.ZodString;
        completed_at: z.ZodNullable<z.ZodString>;
        elapsed_ms: z.ZodNumber;
        mistakes: z.ZodNumber;
    }, z.core.$strip>>;
    sync_version: z.ZodNumber;
}, z.core.$strip>;
export declare const syncPushItemSchema: z.ZodObject<{
    type: z.ZodEnum<{
        session_update: "session_update";
        setting_change: "setting_change";
    }>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    timestamp: z.ZodString;
}, z.core.$strip>;
export declare const syncPushRequestSchema: z.ZodObject<{
    last_known_version: z.ZodNumber;
    changes: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            session_update: "session_update";
            setting_change: "setting_change";
        }>;
        payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        timestamp: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const syncPushResultSchema: z.ZodObject<{
    accepted: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        status: z.ZodLiteral<"accepted">;
    }, z.core.$strip>>;
    rejected: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        status: z.ZodLiteral<"rejected">;
        reason: z.ZodString;
    }, z.core.$strip>>;
    new_version: z.ZodNumber;
}, z.core.$strip>;
export type DifficultyDto = z.infer<typeof difficultySchema>;
export type PuzzleResponseDto = z.infer<typeof puzzleResponseSchema>;
export type HintRequestDto = z.infer<typeof hintRequestSchema>;
export type HintResponseDto = z.infer<typeof hintResponseSchema>;
export type SessionResponseDto = z.infer<typeof sessionResponseSchema>;
export type CreateSessionRequestDto = z.infer<typeof createSessionRequestSchema>;
export type UpdateSessionRequestDto = z.infer<typeof updateSessionRequestSchema>;
export type DailyChallengeResponseDto = z.infer<typeof dailyChallengeResponseSchema>;
export type TelemetryEventDto = z.infer<typeof telemetryEventSchema>;
export type TournamentStatusDto = z.infer<typeof tournamentStatusSchema>;
export type TournamentResponseDto = z.infer<typeof tournamentResponseSchema>;
export type CreateTournamentRequestDto = z.infer<typeof createTournamentRequestSchema>;
export type SubmitEntryRequestDto = z.infer<typeof submitEntryRequestSchema>;
export type SubmitEntryResponseDto = z.infer<typeof submitEntryResponseSchema>;
export type LeaderboardEntryDto = z.infer<typeof leaderboardEntrySchema>;
export type LeaderboardResponseDto = z.infer<typeof leaderboardResponseSchema>;
export type RegisterRequestDto = z.infer<typeof registerRequestSchema>;
export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
export type UserProfileDto = z.infer<typeof userProfileSchema>;
export type AuthResponseDto = z.infer<typeof authResponseSchema>;
export type UpdateProfileRequestDto = z.infer<typeof updateProfileRequestSchema>;
export type PasswordResetRequestDto = z.infer<typeof passwordResetRequestSchema>;
export type SyncBootstrapResponseDto = z.infer<typeof syncBootstrapResponseSchema>;
export type SyncPushItemDto = z.infer<typeof syncPushItemSchema>;
export type SyncPushRequestDto = z.infer<typeof syncPushRequestSchema>;
export type SyncPushResultDto = z.infer<typeof syncPushResultSchema>;
