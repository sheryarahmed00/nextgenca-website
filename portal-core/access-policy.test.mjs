import test from 'node:test';
import assert from 'node:assert/strict';
import { requireVerifiedUser, requireMfaAdmin, requireActiveService } from './access-policy.mjs';
const client={user:{id:'client-1',emailVerified:true,role:'client'}};
test('public and unverified accounts are denied',()=>{
  assert.throws(()=>requireVerifiedUser({}),/authentication_required/);
  assert.throws(()=>requireVerifiedUser({user:{id:'u',emailVerified:false}}),/authentication_required/);
  assert.equal(requireVerifiedUser(client).id,'client-1');
});
test('admin role alone is insufficient without server validation and MFA',()=>{
  const admin={user:{id:'admin',emailVerified:true,role:'admin',mfaVerified:true}};
  assert.throws(()=>requireMfaAdmin(admin),/admin_authorization_required/);
  assert.equal(requireMfaAdmin({...admin,serverValidated:true}).id,'admin');
});
test('service access always queries entitlement for authenticated user',async()=>{
  const db={maybeOne:async(sql,params)=>{assert.match(sql,/revoked_at IS NULL/);assert.deepEqual(params,['client-1','vat']);return {id:'e1'};}};
  assert.deepEqual(await requireActiveService({context:client,db,serviceId:'vat'}),{userId:'client-1',serviceId:'vat'});
  await assert.rejects(requireActiveService({context:client,db:{maybeOne:async()=>null},serviceId:'payroll'}),/service_access_denied/);
});
