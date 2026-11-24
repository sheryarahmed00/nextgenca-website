import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentWorkflow} from './document-workflow.mjs';
const customerId='a83f5c92-1f38-4f30-9c17-638e391cbb0a';
const documentId='c83f5c92-1f38-4f30-9c17-638e391cbb0a';
const objectPath=customerId+'/'+documentId+'.pdf';
function setup(){
 const calls=[];
 const reservations={reserve:async input=>{
  calls.push(['reserve',input]);return {documentId,objectPath,remainingBytes:100};
 }};
 const lifecycle={
  cancelPending:async input=>{calls.push(['cancel',input]);return true;},
  getPendingMetadata:async input=>{
   calls.push(['pending',input]);return {object_path:objectPath,mime_type:'application/pdf',size_bytes:50};
  },
  markReady:async input=>{calls.push(['ready',input]);return {state:'ready'};},
  getReadyMetadata:async input=>{calls.push(['metadata',input]);return {object_path:objectPath};}
 };
 const storage={
  createUploadTicket:async input=>{calls.push(['ticket',input]);return {path:objectPath,token:'signed'};},
  verifyUploadedObject:async input=>{calls.push(['verify',input]);return {sizeBytes:50};},
  createDownloadUrl:async input=>{calls.push(['download',input]);return {url:'https://example.test/signed'};}
 };
 return {calls,reservations,lifecycle,storage};
}
test('reserves quota before issuing upload ticket',async()=>{
 const d=setup(),workflow=createDocumentWorkflow(d);
 const result=await workflow.beginUpload({customerId,mimeType:'application/pdf',sizeBytes:50,originalFilename:'a.pdf'});
 assert.equal(result.uploadToken,'signed');
 assert.deepEqual(d.calls.map(x=>x[0]),['reserve','ticket']);
});
test('verifies storage metadata before finalizing',async()=>{
 const d=setup(),workflow=createDocumentWorkflow(d);
 await workflow.completeUpload({customerId,documentId});
 assert.deepEqual(d.calls.map(x=>x[0]),['pending','verify','ready']);
 assert.equal(d.calls[2][1].actualSizeBytes,50);
});
test('retrieves owner-scoped ready metadata before signing download',async()=>{
 const d=setup(),workflow=createDocumentWorkflow(d);
 await workflow.download({customerId,documentId});
 assert.deepEqual(d.calls.map(x=>x[0]),['metadata','download']);
});
test('fails closed on a mismatched upload path',async()=>{
 const d=setup();d.storage.createUploadTicket=async()=>({path:'other/file.pdf',token:'signed'});
 await assert.rejects(createDocumentWorkflow(d).beginUpload({customerId,mimeType:'application/pdf',sizeBytes:50,originalFilename:'a.pdf'}),/storage_path_mismatch/);
 assert.deepEqual(d.calls.map(x=>x[0]),['reserve','cancel']);
});
