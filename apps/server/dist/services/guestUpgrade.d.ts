/**
 * Migrate all guest-owned data to a user account.
 * The `AND user_id IS NULL` guard makes this idempotent — running it twice
 * for the same guestId/userId pair is a no-op the second time.
 */
export declare function upgradeGuestToUser(guestId: string, userId: string): void;
