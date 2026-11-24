import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalDb } from './postgres-adapter.mjs';
function fakePool({ fail = false, rows = [{id:'x'}] } = {}) {
  const calls = [];
  let released = false;
  return {
    calls,
    get released() { return released; },
    async connect() { return {
      async query(sql, params) {
        calls.push({sql, params});
        if (fail && sql === 'SELECT test') throw new Error('db_error');
        return {rows: sql.startsWith('SELECT') ? rows : []};
      },
      release() { released = true; }
    }; }
  };
}
test('commits successful serializable transaction and releases client', async()=>{
  const pool=fakePool();
  const db=createPortalDb(pool);
  assert.deepEqual(await db.transaction(tx=>tx.one('SELECT test',[1])),{id:'x'});
  assert.deepEqual(pool.calls.map(x=>x.sql),['BEGIN ISOLATION LEVEL SERIALIZABLE','SELECT test','COMMIT']);
  assert.equal(pool.released,true);
});
test('rolls back failed transaction and releases client',async()=>{
  const pool=fakePool({fail:true});
  await assert.rejects(createPortalDb(pool).transaction(tx=>tx.one('SELECT test')),/db_error/);
  assert.deepEqual(pool.calls.map(x=>x.sql),['BEGIN ISOLATION LEVEL SERIALIZABLE','SELECT test','ROLLBACK']);
  assert.equal(pool.released,true);
});
test('rejects missing and multiple rows',async()=>{
  await assert.rejects(createPortalDb(fakePool({rows:[]})).transaction(tx=>tx.one('SELECT test')),/expected_exactly_one_row/);
  await assert.rejects(createPortalDb(fakePool({rows:[{id:1},{id:2}]})).transaction(tx=>tx.maybeOne('SELECT test')),/expected_at_most_one_row/);
});
