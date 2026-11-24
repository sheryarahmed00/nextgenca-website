// Staging-only admin UI. Never place privileged keys in the browser.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4';
const supabase=createClient('https://nzoogwpabqvyojptivom.supabase.co','sb_publishable_Sf_5TL3lZvGrcrD4IIJ_BQ_prCHUsPp');
const el=id=>document.getElementById(id);
const origin=window.NEXTGEN_STAGING_API_ORIGIN;
const ready=typeof origin==='string'&&/^https:\/\/[^/]+$/.test(origin);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ids=['customer','source','service','reference','order','order-item','issue-customer','expiry','create-order','approve-order','issue-code'];
const status=message=>{el('admin-status').textContent=message;};
let factorId=null;
async function sessionReady(){
 if(!ready)return false;
 const {data:{user}}=await supabase.auth.getUser();
 if(!user?.email_confirmed_at)return false;
 const {data,error}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
 return !error&&data?.currentLevel==='aal2';
}
async function refresh(){
 const allowed=await sessionReady();
 for(const id of ids)el(id).disabled=!allowed;
 status(!ready?'Staging API not configured.':allowed?'MFA verified. Server will check your admin role on every request.':'Sign in and verify MFA to enable admin actions.');
}
async function api(path,body){
 if(!await sessionReady())throw Error('mfa_required');
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.access_token)throw Error('not_authenticated');
 const response=await fetch(origin+'/api/admin/'+path,{method:'POST',cache:'no-store',
  headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
  body:JSON.stringify(body)});
 if(!response.ok)throw Error('request_denied');
 return response.json();
}
el('admin-login').addEventListener('submit',async event=>{
 event.preventDefault();
 const {error}=await supabase.auth.signInWithPassword({email:el('admin-email').value.trim(),password:el('admin-password').value});
 status(error?'Sign-in failed.':'Signed in. Verify MFA.');await refresh();
});
el('admin-mfa').addEventListener('submit',async event=>{
 event.preventDefault();
 try{
  if(!factorId){
   const {data,error}=await supabase.auth.mfa.listFactors();
   if(error)throw error;
   factorId=data.totp?.find(f=>f.status==='verified')?.id;
  }
  if(!factorId)throw Error('no_enrolled_factor');
  const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId});
  if(challengeError)throw challengeError;
  const {error}=await supabase.auth.mfa.verify({factorId,challengeId:challenge.id,code:el('mfa-code').value});
  if(error)throw error;
  el('mfa-code').value='';await refresh();
 }catch{status('MFA failed. Ensure your authenticator is enrolled and try again.');}
});
el('admin-logout').addEventListener('click',async()=>{
 await supabase.auth.signOut();factorId=null;el('issued-code').textContent='';await refresh();
});
el('create-order').addEventListener('click',async()=>{
 try{
  const customerId=el('customer').value.trim(),serviceId=el('service').value.trim();
  if(!uuid.test(customerId)||!uuid.test(serviceId))throw Error('invalid_id');
  const result=await api('direct-orders',{customerId,serviceId,source:el('source').value,reference:el('reference').value});
  el('order').value=result.orderId;el('order-item').value=result.orderItemId;el('issue-customer').value=customerId;
  status('Order created. Verify supporting evidence before approving.');
 }catch{status('Order creation failed. Check verified customer, service and admin permissions.');}
});
el('approve-order').addEventListener('click',async()=>{
 try{
  if(!uuid.test(el('order').value.trim())||!confirm('Have you independently verified this order and customer?'))return;
  await api('approve-order',{orderId:el('order').value.trim(),verificationConfirmed:true});
  status('Order approved. Code may now be issued.');
 }catch{status('Order approval denied.');}
});
el('issue-code').addEventListener('click',async()=>{
 try{
  const orderItemId=el('order-item').value.trim(),customerId=el('issue-customer').value.trim();
  if(!uuid.test(orderItemId)||!uuid.test(customerId))throw Error('invalid_id');
  const expiresAt=new Date(el('expiry').value);
  if(!Number.isFinite(expiresAt.getTime())||expiresAt<=new Date())throw Error('invalid_expiry');
  if(!confirm('Issue a one-time code for this approved customer and order item?'))return;
  const result=await api('issue-code',{orderItemId,customerId,expiresAt:expiresAt.toISOString()});
  el('issued-code').textContent='One-time code (copy securely, then clear): '+result.code;
  status('Code issued. Never send it to an unverified recipient.');
 }catch{status('Code issuance denied.');}
});
await refresh();
