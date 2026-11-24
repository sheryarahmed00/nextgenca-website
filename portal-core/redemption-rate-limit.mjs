/**
 * Distributed rate limit using a private PostgreSQL table.
 * Run only after migration 007. No per-process memory counters.
 * Returns false when an account exceeds its allowed redemption attempts.
 */
export function createRedemptionRateLimiter({ db, maxAttempts = 5, windowMinutes = 15 }) {
  if (!db?.transaction || !Number.isSafeInteger(maxAttempts) || maxAttempts < 1 ||
      !Number.isSafeInteger(windowMinutes) || windowMinutes < 1) throw new Error('invalid_rate_limit_config');
  return async function rateLimit({ scope, accountId }) {
    if (scope !== 'code-redemption' || typeof accountId !== 'string' || !accountId) return false;
    return db.transaction(async tx => {
      // Advisory transaction lock serializes attempts for this account/scope.
      // Key derived server-side; never interpolate accountId into SQL.
      await tx.one(`SELECT pg_advisory_xact_lock(hashtextextended($1, 0)) AS locked`, [scope + ':' + accountId]);
      const row = await tx.one(`INSERT INTO portal_private.redemption_attempts
        (account_id,scope,window_started_at,attempts)
        VALUES ($1,$2,now(),1)
        ON CONFLICT (account_id,scope) DO UPDATE SET
          attempts=CASE WHEN portal_private.redemption_attempts.window_started_at <= now() - ($3::int * interval '1 minute')
            THEN 1 ELSE portal_private.redemption_attempts.attempts + 1 END,
          window_started_at=CASE WHEN portal_private.redemption_attempts.window_started_at <= now() - ($3::int * interval '1 minute')
            THEN now() ELSE portal_private.redemption_attempts.window_started_at END
        RETURNING attempts`, [accountId,scope,windowMinutes]);
      return row.attempts <= maxAttempts;
    });
  };
}
