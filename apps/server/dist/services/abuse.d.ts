export interface AbuseCheckResult {
    abusive: boolean;
    reason: string | null;
}
/**
 * Detect obviously fraudulent submissions.
 * Returns a result object rather than throwing so the route handler
 * can persist the abuse_flag record before returning the error response.
 */
export declare function checkAbuse(elapsedMs: number, minSolveMs: number): AbuseCheckResult;
