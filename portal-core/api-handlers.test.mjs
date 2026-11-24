import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortalHandlers } from './api-handlers.mjs';
const session={serverValidated:true,provider:'test',subject:'sub',emailVerified:true};
test('handlers refuse missing rate limiter',()=>{
  assert.throws(()=>createPortalHandlers({db:{transaction(){},maybeOne(){}},secret:'x'}),/missing_secure_dependencies/);
});
test('redemption fails closed when rate limit rejects',async()=>{
  const db={
    transaction:async()=>{throw new Error('should_not_redeem');},
    maybeOne:async()=>({id:'internal-user',email_verified:true,disabled:false})
  };
  const handlers=createPortalHandlers({db,secret:'test-secret-long-enough-1234567890',rateLimit:async()=>false});
  await assert.rejects(handlers.redeemCode({verifiedSession:session,body:{code:'irrelevant'}}),/too_many_attempts/);
});
test('unverified sessions cannot access service checks',async()=>{
  const db={transaction:async()=>{},maybeOne:async()=>null};
  const handlers=createPortalHandlers({db,secret:'test-secret-long-enough-1234567890',rateLimit:async()=>true});
  await assert.rejects(handlers.checkService({verifiedSession:{...session,serverValidated:false},serviceId:'vat'}),/verified_identity_required/);
});

test('My Services returns only rows selected for verified customer',async()=>{
 const queries=[];
 const db={
  transaction:async()=>{throw Error('unexpected_transaction');},
  maybeOne:async(sql,params)=>{
   queries.push({sql,params});
   if(sql.includes('customer_accounts'))return {id:'verified-customer',email_verified:true,disabled:false};
   return {services:[{serviceId:'vat',title:'VAT Returns',activatedAt:'2026-11-24'}]};
  }
 };
 const handlers=createPortalHandlers({db,secret:'test-secret-long-enough-1234567890',rateLimit:async()=>true});
 const result=await handlers.listMyServices({verifiedSession:session,body:{customerId:'attacker'}});
 assert.equal(result.services[0].title,'VAT Returns');
 assert.deepEqual(queries[1].params,['verified-customer']);
 assert.match(queries[1].sql,/e\.revoked_at IS NULL/);
 assert.match(queries[1].sql,/o\.customer_id=\$1/);
});
test('My Services rejects unverified sessions',async()=>{
 const db={transaction:async()=>{},maybeOne:async()=>{throw Error('identity_query_must_not_run');}};
 const handlers=createPortalHandlers({db,secret:'test-secret-long-enough-1234567890',rateLimit:async()=>true});
 await assert.rejects(handlers.listMyServices({verifiedSession:{...session,emailVerified:false}}),/verified_identity_required/);
});
