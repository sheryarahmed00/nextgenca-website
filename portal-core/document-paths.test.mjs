import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrivateDocumentPath,belongsToCustomer} from './document-paths.mjs';
const alice='a83f5c92-1f38-4f30-9c17-638e391cbb0a';
const bob='b83f5c92-1f38-4f30-9c17-638e391cbb0a';
const documentId='c83f5c92-1f38-4f30-9c17-638e391cbb0a';
test('generates predictable ownership prefix with opaque document id',()=>{
 const path=createPrivateDocumentPath({customerId:alice,mimeType:'application/pdf',documentId});
 assert.equal(path,alice+'/'+documentId+'.pdf');
 assert.equal(belongsToCustomer({path,customerId:alice}),true);
 assert.equal(belongsToCustomer({path,customerId:bob}),false);
});
test('rejects traversal, unsafe ids and unsupported file types',()=>{
 for(const customerId of ['../admin',alice+'/../'+bob,'not-an-id'])
   assert.throws(()=>createPrivateDocumentPath({customerId,mimeType:'application/pdf'}));
 assert.throws(()=>createPrivateDocumentPath({customerId:alice,mimeType:'text/html'}));
 assert.equal(belongsToCustomer({path:alice+'/../'+bob+'/'+documentId+'.pdf',customerId:alice}),false);
});
