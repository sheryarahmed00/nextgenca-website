import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDirectOrderInput,registerDirectOrder,approveDirectOrder} from './direct-orders.mjs';
const admin={id:'a1',isAdmin:true,mfaVerified:true};
test('direct orders accept supported sources and reject invalid input',()=>{
  assert.equal(validateDirectOrderInput({customerId:' c1 ',serviceId:'s1',source:'whatsapp',reference:'call'}).customerId,'c1');
  assert.throws(()=>validateDirectOrderInput({customerId:'',serviceId:'s1',source:'phone',reference:''}),/customer_required/);
  assert.throws(()=>validateDirectOrderInput({customerId:'c1',serviceId:'s1',source:'unknown',reference:''}),/invalid_source/);
});
test('direct order creation requires authenticated MFA admin',async()=>{
  await assert.rejects(registerDirectOrder({db:{},admin:{...admin,mfaVerified:false},input:{}}),/admin_auth_required/);
});
test('approval requires explicit verification',async()=>{
  await assert.rejects(approveDirectOrder({db:{},admin,orderId:'o1',verificationConfirmed:false}),/verification_required/);
});
test('direct order is initially pending and then can be approved',async()=>{
  let status='awaiting_verification';
  const db={transaction:async fn=>fn({
    maybeOne:async()=>({id:'s1'}),
    one:async(sql)=>{
      if(sql.includes('INSERT INTO portal_private.orders')) return {id:'o1'};
      if(sql.includes('INSERT INTO portal_private.order_items')) return {id:'i1'};
      if(sql.includes('SELECT * FROM portal_private.orders')) return {id:'o1',status};
      if(sql.includes('UPDATE portal_private.orders')){status='approved';return {id:'o1'};}
      if(sql.includes('INSERT INTO portal_private.audit_events')) return {id:1};
      throw Error('unexpected sql');
    }
  })};
  const registered=await registerDirectOrder({db,admin,input:{customerId:'c1',serviceId:'s1',source:'phone',reference:'offline'}});
  assert.equal(registered.status,'awaiting_verification');
  const approved=await approveDirectOrder({db,admin,orderId:'o1',verificationConfirmed:true});
  assert.equal(approved.status,'approved');
});
