import test from 'node:test';
import assert from 'node:assert/strict';
import { validateIssuance, validateRedemption } from './order-policy.mjs';

const order = { id: 'order-1', customer_id: 'alice', status: 'approved', verified_at: '2026-11-01', approved_at: '2026-11-02', approved_by: 'admin' };
const item = { id: 'item-1', order_id: 'order-1', service_id: 'vat' };
const codeRow = { status: 'issued', customer_id: 'alice', order_item_id: 'item-1', expires_at: '2027-01-01T00:00:00Z' };
const now = new Date('2026-12-01T00:00:00Z');

test('automatic issuance requires verified approved order', () => {
  assert.deepEqual(validateIssuance({order,item,customerId:'alice',mode:'automatic'}), {ok:true});
  assert.equal(validateIssuance({order:{...order,status:'submitted'},item,customerId:'alice',mode:'automatic'}).ok,false);
  assert.equal(validateIssuance({order:{...order,verified_at:null},item,customerId:'alice',mode:'automatic'}).ok,false);
});
test('manual issuance requires admin and correct customer', () => {
  assert.equal(validateIssuance({order,item,customerId:'alice',mode:'manual',actorIsAdmin:false}).ok,false);
  assert.equal(validateIssuance({order,item,customerId:'alice',mode:'manual',actorIsAdmin:true}).ok,true);
  assert.equal(validateIssuance({order,item,customerId:'bob',mode:'manual',actorIsAdmin:true}).ok,false);
});
test('redemption is bound to customer, order item and expiry', () => {
  const base={codeRow,item,order,authenticatedUserId:'alice',now};
  assert.equal(validateRedemption(base).ok,true);
  assert.equal(validateRedemption({...base,authenticatedUserId:'bob'}).ok,false);
  assert.equal(validateRedemption({...base,codeRow:{...codeRow,status:'redeemed'}}).ok,false);
  assert.equal(validateRedemption({...base,codeRow:{...codeRow,expires_at:'2026-01-01T00:00:00Z'}}).ok,false);
  assert.equal(validateRedemption({...base,item:{...item,order_id:'different'}}).ok,false);
  assert.equal(validateRedemption({...base,order:{...order,status:'cancelled'}}).ok,false);
});
