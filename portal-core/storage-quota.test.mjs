import test from 'node:test';
import assert from 'node:assert/strict';
import {createStorageQuotaPolicy,MAX_DOCUMENT_BYTES} from './storage-quota.mjs';

const MB=1024*1024;
const policy=createStorageQuotaPolicy({bytesPerClient:500*MB});
test('accepts uploads within quota and reports remaining bytes',()=>{
  assert.deepEqual(policy.evaluate({usedBytes:490*MB,incomingBytes:10*MB}),
    {allowed:true,remainingBytes:0});
});
test('rejects oversized individual files',()=>{
  assert.deepEqual(policy.evaluate({usedBytes:0,incomingBytes:MAX_DOCUMENT_BYTES+1}),
    {allowed:false,reason:'file_too_large'});
});
test('rejects uploads exceeding total account quota',()=>{
  assert.deepEqual(policy.evaluate({usedBytes:495*MB,incomingBytes:6*MB}),
    {allowed:false,reason:'quota_exceeded'});
});
test('rejects malformed usage including negatives and fractions',()=>{
  for(const usedBytes of [-1,NaN,1.5,'10'])
    assert.equal(policy.evaluate({usedBytes,incomingBytes:1}).allowed,false);
  for(const incomingBytes of [0,-1,NaN,1.5,'10'])
    assert.equal(policy.evaluate({usedBytes:0,incomingBytes}).allowed,false);
});
test('rejects unsafe configuration',()=>{
  for(const bytesPerClient of [0,MAX_DOCUMENT_BYTES-1,1.5,NaN])
    assert.throws(()=>createStorageQuotaPolicy({bytesPerClient}));
});
