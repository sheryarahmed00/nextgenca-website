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
