export interface AbuseCheckResult {
  abusive: boolean;
  reason: string | null;
}

/**
 * Detect obviously fraudulent submissions.
 * Returns a result object rather than throwing so the route handler
 * can persist the abuse_flag record before returning the error response.
 */
export function checkAbuse(elapsedMs: number, minSolveMs: number): AbuseCheckResult {
  if (elapsedMs < minSolveMs) {
    return {
      abusive: true,
      reason: `elapsed_ms ${elapsedMs} is below minimum threshold ${minSolveMs}`
    };
  }
  return { abusive: false, reason: null };
}
