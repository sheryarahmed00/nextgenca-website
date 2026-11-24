import test from 'node:test';
import assert from 'node:assert/strict';
import {createHttpBoundary} from './http-boundary.mjs';
const id='a83f5c92-1f38-4f30-9c17-638e391cbb0a';
const body=JSON.stringify({serviceId:id});
function make({session={serverValidated:true},origin=true}={}){
  let invoked=0;
  const dispatch=createHttpBoundary({
    handlers:{checkService:async({verifiedSession,serviceId})=>{invoked++;assert.equal(serviceId,id);assert.equal(verifiedSession.serverValidated,true);return {allowed:true};}},
    verifyBearerToken:async()=>session,
    checkRequestOrigin:()=>origin
  });
  return {dispatch,get invoked(){return invoked;}};
}
const req={method:'POST',path:'/client/check-service',authorization:'Bearer valid-token',origin:'https://staging.example',bodyText:body};
test('dispatches authenticated validated request',async()=>{const x=make();assert.deepEqual(await x.dispatch(req),{status:200,body:{allowed:true}});assert.equal(x.invoked,1);});
test('rejects client-injected identity and unknown fields',async()=>{const x=make();assert.equal((await x.dispatch({...req,bodyText:JSON.stringify({serviceId:id,serverValidated:true})})).status,400);assert.equal(x.invoked,0);});
test('rejects unverified token, missing bearer, and disallowed origin',async()=>{
  assert.equal((await make({session:{serverValidated:false}}).dispatch(req)).status,401);
  assert.equal((await make().dispatch({...req,authorization:''})).status,401);
  assert.equal((await make({origin:false}).dispatch(req)).status,403);
});
test('rejects oversized and malformed bodies',async()=>{
  assert.equal((await make().dispatch({...req,bodyText:'x'.repeat(5000)})).status,413);
  assert.equal((await make().dispatch({...req,bodyText:'{'})).status,400);
});
