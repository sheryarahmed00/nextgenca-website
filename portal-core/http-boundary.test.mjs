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

test('document routes reject forged identities, control characters, and oversize files',async()=>{
 const calls=[];
 const dispatch=createHttpBoundary({
  handlers:{beginDocumentUpload:async({verifiedSession,body})=>{
   calls.push({verifiedSession,body});return {accepted:true};
  }},
  verifyBearerToken:async()=>({serverValidated:true,subject:'verified-user'}),
  checkRequestOrigin:()=>true
 });
 const base={method:'POST',path:'/client/documents/begin-upload',
   authorization:'Bearer valid-token',origin:'https://staging.example'};
 const request=bodyText=>dispatch({...base,bodyText:JSON.stringify(bodyText)});
 const valid={mimeType:'application/pdf',sizeBytes:100,originalFilename:'document.pdf'};
 assert.equal((await request(valid)).status,200);
 assert.equal((await request({...valid,customerId:id})).status,400);
 assert.equal((await request({...valid,sizeBytes:10485761})).status,400);
 assert.equal((await request({...valid,originalFilename:'bad\\nname.pdf'})).status,400);
 assert.equal((await request({...valid,mimeType:'text/html'})).status,400);
 assert.equal(calls.length,1);
});
test('document finalization and download accept only valid document IDs',async()=>{
 const called=[];
 const dispatch=createHttpBoundary({
  handlers:{
   completeDocumentUpload:async()=>{called.push('complete');return {ok:true};},
   downloadDocument:async()=>{called.push('download');return {ok:true};}
  },
  verifyBearerToken:async()=>({serverValidated:true}),checkRequestOrigin:()=>true
 });
 for(const [path,action] of [['/client/documents/complete-upload','complete'],['/client/documents/download','download']]){
  const base={method:'POST',path,authorization:'Bearer valid-token',
    origin:'https://staging.example'};
  assert.equal((await dispatch({...base,bodyText:JSON.stringify({documentId:id})})).status,200);
  assert.equal((await dispatch({...base,bodyText:JSON.stringify({documentId:'../../admin'})})).status,400);
  assert.equal(called.at(-1),action);
 }
 assert.deepEqual(called,['complete','download']);
});

test('document listing requires authentication and rejects customer ID injection',async()=>{
 let calls=0;
 const dispatch=createHttpBoundary({
  handlers:{listDocuments:async({verifiedSession})=>{
   calls++;assert.equal(verifiedSession.serverValidated,true);
   return {documents:[]};
  }},
  verifyBearerToken:async token=>token==='good'?{serverValidated:true}:null,
  checkRequestOrigin:()=>true
 });
 const req={method:'POST',path:'/client/documents/list',authorization:'Bearer good',
   origin:'https://staging.example',bodyText:'{}'};
 assert.deepEqual(await dispatch(req),{status:200,body:{documents:[]}});
 assert.equal((await dispatch({...req,bodyText:JSON.stringify({customerId:id})})).status,400);
 assert.equal((await dispatch({...req,authorization:'Bearer bad'})).status,401);
 assert.equal(calls,1);
});
