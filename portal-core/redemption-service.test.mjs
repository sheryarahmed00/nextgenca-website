import test from 'node:test';
import assert from 'node:assert/strict';
import { issueServiceCode, redeemServiceCode } from './redemption-service.mjs';
import { digestServiceCode } from './service-codes.mjs';

const secret='test-secret-only-12345678901234567890123';
const order={id:'o1',customer_id:'u1',status:'approved',verified_at:'yes',approved_at:'yes',approved_by:'admin'};
const item={id:'i1',order_id:'o1',service_id:'vat'};
const admin={id:'admin',isAdmin:true,mfaVerified:true,serverValidated:true};
const user={id:'u1',emailVerified:true,serverValidated:true};

function mockDb(state) {
  return { transaction: async fn => {
    const snapshot = structuredClone(state);
    const tx = {
      async one(sql, params) {
        if (sql.includes('FROM portal_private.order_items')) return item;
        if (sql.includes('FROM portal_private.orders')) return order;
        if (sql.includes('INSERT INTO portal_private.service_codes')) { snapshot.row={id:'c1',order_item_id:'i1',customer_id:'u1',digest:params[2],status:'issued',expires_at:params[5]}; return {id:'c1'}; }
        if (sql.includes("SET status='redeemed'")) { snapshot.row.status='redeemed';snapshot.row.redeemed_by=params[1];snapshot.row.redeemed_at=params[2];return {id:'c1'}; }
        if (sql.includes('INSERT INTO portal_private.entitlements')) { snapshot.entitlement=true; return {id:'e1'}; }
        if (sql.includes('INSERT INTO portal_private.audit_events')) return {id:1};
        throw new Error('unexpected query '+sql);
      },
      async maybeOne(sql,params) {
        if (sql.includes('UPDATE portal_private.service_codes')) return null;
        if (sql.includes('WHERE digest')) return snapshot.row?.digest===params[0]?snapshot.row:null;
        if (sql.includes('WHERE order_item_id')) return snapshot.row?.status==='issued'?{id:snapshot.row.id}:null;
        throw new Error('unexpected query');
      }
    };
    const result=await fn(tx);
    Object.assign(state,snapshot);
    return result;
  }};
}

test('issue then redeem once, rejecting replay and another customer', async()=>{
  const state={};const db=mockDb(state);
  const issued=await issueServiceCode({db,actor:admin,orderItemId:'i1',customerId:'u1',mode:'manual',secret,expiresAt:new Date('2099-01-01')});
  assert.equal(state.row.digest,digestServiceCode(issued.code,secret));
  assert.equal(state.row.digest.includes(issued.code),false);
  await assert.rejects(issueServiceCode({db,actor:admin,orderItemId:'i1',customerId:'u1',mode:'manual',secret,expiresAt:new Date('2099-01-01')}),/already_issued/);
  await assert.rejects(redeemServiceCode({db,user:{id:'u2',emailVerified:true,serverValidated:true},code:issued.code,secret}),/invalid_or_unavailable_code/);
  const redeemed=await redeemServiceCode({db,user,code:issued.code,secret});
  assert.equal(redeemed.serviceId,'vat');assert.equal(state.entitlement,true);
  await assert.rejects(redeemServiceCode({db,user,code:issued.code,secret}),/invalid_or_unavailable_code/);
});
test('admin MFA and verified email are mandatory', async()=>{
  const db=mockDb({});
  await assert.rejects(issueServiceCode({db,actor:{...admin,mfaVerified:false},orderItemId:'i1',customerId:'u1',mode:'manual',secret,expiresAt:new Date('2099-01-01')}),/admin_auth_required/);
  await assert.rejects(redeemServiceCode({db,user:{...user,emailVerified:false},code:'bad',secret}),/verified_login_required/);
});
