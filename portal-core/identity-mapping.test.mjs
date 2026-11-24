import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCustomerAccount,resolveAdminAccount} from './identity-mapping.mjs';
const verifiedSession={serverValidated:true,provider:'example',subject:'subject1',emailVerified:true,mfaVerified:true};
test('untrusted or unverified sessions are rejected',async()=>{
  await assert.rejects(resolveCustomerAccount({db:{},verifiedSession:{...verifiedSession,serverValidated:false}}),/verified_identity_required/);
  await assert.rejects(resolveCustomerAccount({db:{},verifiedSession:{...verifiedSession,emailVerified:false}}),/verified_identity_required/);
});
test('identity is bound by provider subject, not email supplied by client',async()=>{
  const db={maybeOne:async(sql,params)=>{assert.deepEqual(params,['example','subject1']);return {id:'internal-id',disabled:false,email_verified:true};}};
  assert.equal((await resolveCustomerAccount({db,verifiedSession})).id,'internal-id');
});
test('admin requires MFA and database role',async()=>{
  const db={maybeOne:async(sql)=>sql.includes('admin_roles')?null:{id:'internal-id',disabled:false,email_verified:true}};
  await assert.rejects(resolveAdminAccount({db,verifiedSession}),/admin_access_denied/);
  await assert.rejects(resolveAdminAccount({db,verifiedSession:{...verifiedSession,mfaVerified:false}}),/admin_mfa_required/);
});
