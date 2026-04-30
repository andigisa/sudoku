export declare function createAuthSession(userId: string, ttlDays: number): {
    sessionId: string;
    expiresAt: string;
};
export declare function validateAuthSession(sessionId: string): {
    valid: boolean;
    userId?: string;
};
export declare function revokeAuthSession(sessionId: string): void;
export declare function cleanupExpiredSessions(userId: string): void;
