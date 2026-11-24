/**
 * Minimal pg-compatible adapter. Inject a configured server-side pg Pool.
 * Do not instantiate this in a browser or expose connection strings.
 */
export function createPortalDb(pool) {
  if (!pool || typeof pool.connect !== 'function') throw new TypeError('pg_pool_required');
  const queries = client => ({
    async execute(sql, params = []) { const result = await client.query(sql, params); return result.rowCount; },
    async maybeOne(sql, params = []) {
      const result = await client.query(sql, params);
      if (result.rows.length > 1) throw new Error('expected_at_most_one_row');
      return result.rows[0] ?? null;
    },
    async one(sql, params = []) {
      const result = await client.query(sql, params);
      if (result.rows.length !== 1) throw new Error('expected_exactly_one_row');
      return result.rows[0];
    }
  });
  return {
    async maybeOne(sql, params) {
      const client = await pool.connect();
      try { return await queries(client).maybeOne(sql, params); }
      finally { client.release(); }
    },
    async transaction(work) {
      const client = await pool.connect();
      let begun = false;
      try {
        await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
        begun = true;
        const result = await work(queries(client));
        await client.query('COMMIT');
        begun = false;
        return result;
      } catch (error) {
        if (begun) {
          try { await client.query('ROLLBACK'); }
          catch (rollbackError) { error.rollbackError = rollbackError; }
        }
        throw error;
      } finally { client.release(); }
    }
  };
}
