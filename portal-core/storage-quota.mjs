/**
 * Server-side quota calculation for private client documents.
 * A policy helper only: upload routes and atomic DB reservation are not wired.
 * Do not trust file sizes or account IDs supplied by browsers.
 */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export function createStorageQuotaPolicy({bytesPerClient}){
  if(!Number.isSafeInteger(bytesPerClient)||bytesPerClient<MAX_DOCUMENT_BYTES)
    throw Error('invalid_storage_quota');
  return {
    bytesPerClient,
    evaluate({usedBytes,incomingBytes}){
      if(!Number.isSafeInteger(usedBytes)||usedBytes<0||
         !Number.isSafeInteger(incomingBytes)||incomingBytes<1)
        return {allowed:false,reason:'invalid_usage'};
      if(incomingBytes>MAX_DOCUMENT_BYTES)
        return {allowed:false,reason:'file_too_large'};
      if(usedBytes>bytesPerClient||incomingBytes>bytesPerClient-usedBytes)
        return {allowed:false,reason:'quota_exceeded'};
      return {allowed:true,remainingBytes:bytesPerClient-usedBytes-incomingBytes};
    }
  };
}
