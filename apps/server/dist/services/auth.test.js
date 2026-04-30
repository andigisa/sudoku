import { describe, expect, it } from "vitest";
import { normalizeEmail, validatePasswordPolicy, hashPassword, verifyPassword } from "./auth.js";
describe("normalizeEmail", () => {
    it("lowercases and trims", () => {
        expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com");
    });
    it("handles already-normalized input", () => {
        expect(normalizeEmail("user@example.com")).toBe("user@example.com");
    });
});
describe("validatePasswordPolicy", () => {
    it("rejects passwords shorter than 8 chars", () => {
        const result = validatePasswordPolicy("short");
        expect(result.valid).toBe(false);
        expect(result.reason).toContain("at least 8");
    });
    it("rejects passwords longer than 128 chars", () => {
        const result = validatePasswordPolicy("x".repeat(129));
        expect(result.valid).toBe(false);
        expect(result.reason).toContain("at most 128");
    });
    it("accepts valid passwords", () => {
        expect(validatePasswordPolicy("validpass")).toEqual({ valid: true });
        expect(validatePasswordPolicy("x".repeat(128))).toEqual({ valid: true });
    });
});
describe("hashPassword / verifyPassword", () => {
    it("round-trips correctly", async () => {
        const hashed = await hashPassword("my-password", 1024, 1);
        expect(hashed).toContain("$argon2");
        expect(await verifyPassword(hashed, "my-password")).toBe(true);
        expect(await verifyPassword(hashed, "wrong-password")).toBe(false);
    });
});
//# sourceMappingURL=auth.test.js.map