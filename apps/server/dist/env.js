export const env = {
    PORT: Number(process.env.PORT ?? 3002),
    HOST: process.env.HOST ?? "0.0.0.0",
    NODE_ENV: process.env.NODE_ENV ?? "development",
    COOKIE_SECRET: process.env.COOKIE_SECRET ?? "dev-secret-please-change-in-production",
    DB_PATH: process.env.DB_PATH ?? "./data/sudoku.db",
    LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
    TOURNAMENT_MIN_SOLVE_MS: Number(process.env.TOURNAMENT_MIN_SOLVE_MS ?? 20_000),
    TOURNAMENT_RULESET_VERSION: process.env.TOURNAMENT_RULESET_VERSION ?? "v1",
    ADMIN_SECRET: process.env.ADMIN_SECRET ?? "dev-admin-secret",
    AUTH_SESSION_TTL_DAYS: Number(process.env.AUTH_SESSION_TTL_DAYS ?? 7),
    ARGON2_MEMORY_COST: Number(process.env.ARGON2_MEMORY_COST ?? 65536),
    ARGON2_TIME_COST: Number(process.env.ARGON2_TIME_COST ?? 3)
};
if (env.NODE_ENV === "production") {
    if (env.COOKIE_SECRET === "dev-secret-please-change-in-production") {
        throw new Error("COOKIE_SECRET must be set in production");
    }
    if (env.ADMIN_SECRET === "dev-admin-secret") {
        throw new Error("ADMIN_SECRET must be set in production");
    }
}
//# sourceMappingURL=env.js.map