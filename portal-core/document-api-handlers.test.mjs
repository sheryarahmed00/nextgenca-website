import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentApiHandlers} from './document-api-handlers.mjs';
const id='a83f5c92-1f38-4f30-9c17-638e391cbb0a';
const verifiedSession={serverValidated:true,provider:'supabase',subject:'provider-subject',emailVerified:true};
test('document requests resolve customer identity from verified session, never body',async()=>{
 const calls=[];
 const db={maybeOne:async(_sql,params)=>{calls.push(['identity',params]);return {id,disabled:false,email_verified:true};}};
 const workflow={
  listDocuments:async input=>{calls.push(['list',input]);return {documents:[]};},
  beginUpload:async input=>{calls.push(['upload',input]);return {ok:true};},
  completeUpload:async input=>{calls.push(['complete',input]);return {ok:true};},
  download:async input=>{calls.push(['download',input]);return {ok:true};}
 };
 const handlers=createDocumentApiHandlers({db,workflow});
 await handlers.beginDocumentUpload({verifiedSession,body:{customerId:'attacker',mimeType:'application/pdf',sizeBytes:10,originalFilename:'a.pdf'}});
 assert.equal(calls[1][1].customerId,id);
 assert.equal(Object.hasOwn(calls[1][1],'verifiedSession'),false);
});
test('unverified identity cannot upload',async()=>{
 const db={maybeOne:async()=>{throw Error('should_not_query');}};
 const workflow={listDocuments:async()=>({documents:[]}),beginUpload:async()=>{},completeUpload:async()=>{},download:async()=>{}};
 const handlers=createDocumentApiHandlers({db,workflow});
 await assert.rejects(handlers.beginDocumentUpload({verifiedSession:{...verifiedSession,emailVerified:false},body:{}}),/verified_identity_required/);
});

test('document listing is scoped to verified identity',async()=>{
 const db={maybeOne:async()=>({id,disabled:false,email_verified:true})};
 const workflow={listDocuments:async input=>({customerId:input.customerId}),beginUpload:async()=>{},completeUpload:async()=>{},download:async()=>{}};
 const handlers=createDocumentApiHandlers({db,workflow});
 assert.deepEqual(await handlers.listDocuments({verifiedSession,body:{customerId:'attacker'}}),{customerId:id});
});
