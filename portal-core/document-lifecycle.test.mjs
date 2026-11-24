import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentLifecycle} from './document-lifecycle.mjs';

const alice='a83f5c92-1f38-4f30-9c17-638e391cbb0a';
const bob='b83f5c92-1f38-4f30-9c17-638e391cbb0a';
const documentId='c83f5c92-1f38-4f30-9c17-638e391cbb0a';
function fakeDb({owner=alice,state='pending',size=100}={}){
 const calls=[];
 const tx={
  async maybeOne(sql,params){
   calls.push({sql,params});
   if(params[1]!==owner)return null;
   if(sql.includes("state='ready'")&&state!=='ready')return null;
   return {id:documentId,size_bytes:size,state,object_path:owner+'/'+documentId+'.pdf'};
  },
  async one(sql,params){
   calls.push({sql,params});
   if(!sql.includes('UPDATE'))throw Error('unexpected_sql');
   return {id:documentId};
  }
 };
 return {calls,transaction:fn=>fn(tx)};
}
test('finalizes verified size for document owner',async()=>{
 const db=fakeDb();
 const result=await createDocumentLifecycle({db}).markReady({customerId:alice,documentId,actualSizeBytes:100});
 assert.deepEqual(result,{documentId,state:'ready'});
 assert.equal(db.calls.length,2);
 assert.match(db.calls[0].sql,/FOR UPDATE/);
});
test('rejects different customer without update',async()=>{
 const db=fakeDb();
 await assert.rejects(createDocumentLifecycle({db}).markReady({customerId:bob,documentId,actualSizeBytes:100}),/document_not_ready/);
 assert.equal(db.calls.length,1);
});
test('rejects size mismatch and already completed uploads',async()=>{
 for(const opts of [{size:100,state:'ready'},{size:101,state:'pending'}]){
  const db=fakeDb(opts);
  await assert.rejects(createDocumentLifecycle({db}).markReady({customerId:alice,documentId,actualSizeBytes:100}),/document_not_ready/);
  assert.equal(db.calls.length,1);
 }
});
test('ready metadata is not returned for pending or other-client documents',async()=>{
 const db=fakeDb();
 await assert.rejects(createDocumentLifecycle({db}).getReadyMetadata({customerId:alice,documentId}),/document_not_found/);
 await assert.rejects(createDocumentLifecycle({db}).getReadyMetadata({customerId:bob,documentId}),/document_not_found/);
});
