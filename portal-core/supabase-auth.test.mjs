import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupabaseTokenVerifier} from './supabase-auth.mjs';
const issuer='https://example.supabase.co/auth/v1';
const claims={iss:issuer,sub:'id1',role:'authenticated',session_id:'sess1',exp:Math.floor(Date.now()/1000)+3600,aal:'aal2'};
const user={id:'id1',email:'test@example.com',email_confirmed_at:'2026-01-01'};
function make(c=claims,u=user){
 return createSupabaseTokenVerifier({issuer,auth:{
  getClaims:async()=>({data:{claims:c},error:null}),
  getUser:async()=>({data:{user:u},error:null})
 }});
}
test('accepts verified Supabase user with MFA',async()=>assert.deepEqual(await make()('a'.repeat(50)),{serverValidated:true,provider:'supabase',subject:'id1',emailVerified:true,mfaVerified:true}));
test('rejects mismatched subject and unconfirmed email',async()=>{
 await assert.rejects(make({...claims,sub:'another'})('a'.repeat(50)));
 await assert.rejects(make(claims,{...user,email_confirmed_at:null})('a'.repeat(50)));
});
test('rejects expired claims and missing session id',async()=>{
 await assert.rejects(make({...claims,exp:1})('a'.repeat(50)));
 await assert.rejects(make({...claims,session_id:null})('a'.repeat(50)));
});
test('aal1 does not grant admin MFA',async()=>assert.equal((await make({...claims,aal:'aal1'})('a'.repeat(50))).mfaVerified,false));
