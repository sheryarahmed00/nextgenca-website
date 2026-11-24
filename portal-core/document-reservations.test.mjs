import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentReservationService} from './document-reservations.mjs';
const customerId='a83f5c92-1f38-4f30-9c17-638e391cbb0a';
const MB=1024*1024;
function fakeDb(usedBytes){
  const calls=[];
  const tx={
    async one(sql,params){
      calls.push({sql,params});
      if(sql.includes('pg_advisory_xact_lock'))return {locked:null};
      if(sql.includes('COALESCE(SUM'))return {used_bytes:String(usedBytes)};
      if(sql.includes('INSERT INTO'))return {id:params[0]};
      throw Error('unexpected_query');
    }
  };
  return {calls,transaction:async fn=>fn(tx)};
}
test('reserves space and counts pending documents',async()=>{
  const db=fakeDb(490*MB);
  const service=createDocumentReservationService({db,bytesPerClient:500*MB});
  const result=await service.reserve({customerId,mimeType:'application/pdf',sizeBytes:10*MB,originalFilename:'accounts.pdf'});
  assert.equal(result.remainingBytes,0);
  assert.ok(result.objectPath.startsWith(customerId+'/'));
  assert.equal(db.calls.length,3);
  assert.match(db.calls[1].sql,/pending','ready/);
});
test('rejects quota overflow without inserting a record',async()=>{
  const db=fakeDb(495*MB);
  const service=createDocumentReservationService({db,bytesPerClient:500*MB});
  await assert.rejects(service.reserve({customerId,mimeType:'image/png',sizeBytes:6*MB,originalFilename:'receipt.png'}),/quota_exceeded/);
  assert.equal(db.calls.length,2);
});
test('rejects malicious names, invalid MIME and oversize files',async()=>{
  const db=fakeDb(0),service=createDocumentReservationService({db,bytesPerClient:500*MB});
  const base={customerId,mimeType:'application/pdf',sizeBytes:100,originalFilename:'file.pdf'};
  await assert.rejects(service.reserve({...base,originalFilename:'evil\nname.pdf'}),/invalid_filename/);
  await assert.rejects(service.reserve({...base,sizeBytes:11*MB}),/invalid_file_size/);
  await assert.rejects(service.reserve({...base,mimeType:'text/html'}),/invalid_document_metadata/);
  assert.equal(db.calls.length,0);
});
