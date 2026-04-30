export declare function normalizeEmail(email: string): string;
export declare function validatePasswordPolicy(password: string): {
    valid: boolean;
    reason?: string;
};
export declare function hashPassword(password: string, memoryCost: number, timeCost: number): Promise<string>;
export declare function verifyPassword(hashed: string, password: string): Promise<boolean>;
