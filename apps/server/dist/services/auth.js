import { hash, verify } from "@node-rs/argon2";
export function normalizeEmail(email) {
    return email.toLowerCase().trim();
}
export function validatePasswordPolicy(password) {
    if (password.length < 8) {
        return { valid: false, reason: "Password must be at least 8 characters" };
    }
    if (password.length > 128) {
        return { valid: false, reason: "Password must be at most 128 characters" };
    }
    return { valid: true };
}
export async function hashPassword(password, memoryCost, timeCost) {
    return hash(password, { memoryCost, timeCost, parallelism: 1 });
}
export async function verifyPassword(hashed, password) {
    return verify(hashed, password);
}
//# sourceMappingURL=auth.js.map