import test from 'node:test';
import assert from 'node:assert/strict';
import {createRedemptionRateLimiter} from './redemption-rate-limit.mjs';
test('fail closed on invalid scope or identity',async()=>{
  const limit=createRedemptionRateLimiter({db:{transaction:async()=>{throw Error('should not query');}}});
  assert.equal(await limit({scope:'other',accountId:'u'}),false);
  assert.equal(await limit({scope:'code-redemption',accountId:''}),false);
});
test('allows first five attempts then denies sixth',async()=>{
  let attempts=0;
  const db={transaction:async work=>work({one:async(sql,params)=>{
    if(sql.includes('pg_advisory_xact_lock'))return {locked:true};
    assert.equal(params[2],15);
    return {attempts:++attempts};
  }})};
  const limit=createRedemptionRateLimiter({db});
  for(let i=0;i<5;i++) assert.equal(await limit({scope:'code-redemption',accountId:'u'}),true);
  assert.equal(await limit({scope:'code-redemption',accountId:'u'}),false);
});
test('rejects unsafe config',()=>{
  assert.throws(()=>createRedemptionRateLimiter({db:{transaction(){}},maxAttempts:0}),/invalid_rate_limit_config/);
});
