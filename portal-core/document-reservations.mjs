import {randomUUID} from 'node:crypto';
import {createPrivateDocumentPath} from './document-paths.mjs';
import {createStorageQuotaPolicy,MAX_DOCUMENT_BYTES} from './storage-quota.mjs';

/**
 * Reserve document bytes in the private database before an upload.
 * The trusted caller supplies customerId from a verified server session,
 * not from request JSON. Reservation counts pending AND ready objects.
 * Storage upload/finalization must be implemented separately.
 */
export function createDocumentReservationService({db,bytesPerClient}){
  if(typeof db?.transaction!=='function')throw Error('db_required');
  const quota=createStorageQuotaPolicy({bytesPerClient});
  return {
    async reserve({customerId,mimeType,sizeBytes,originalFilename}){
      if(typeof originalFilename!=='string'||originalFilename.length<1||
         originalFilename.length>255||/[\x00-\x1f\x7f]/.test(originalFilename))
        throw Error('invalid_filename');
      if(!Number.isSafeInteger(sizeBytes)||sizeBytes<1||sizeBytes>MAX_DOCUMENT_BYTES)
        throw Error('invalid_file_size');
      const documentId=randomUUID();
      const objectPath=createPrivateDocumentPath({customerId,mimeType,documentId});
      return db.transaction(async tx=>{
        // Serializes concurrent reservations for the same customer.
        await tx.one('SELECT pg_advisory_xact_lock(hashtextextended($1,0)) AS locked',
          ['document-quota:'+customerId]);
        const row=await tx.one(`SELECT COALESCE(SUM(size_bytes),0)::bigint AS used_bytes
          FROM portal_private.client_documents
          WHERE customer_id=$1 AND state IN ('pending','ready')`,[customerId]);
        const usedBytes=Number(row.used_bytes);
        const verdict=quota.evaluate({usedBytes,incomingBytes:sizeBytes});
        if(!verdict.allowed)throw Error(verdict.reason);
        await tx.one(`INSERT INTO portal_private.client_documents
          (id,customer_id,object_path,original_filename,mime_type,size_bytes,state)
          VALUES ($1,$2,$3,$4,$5,$6,'pending') RETURNING id`,
          [documentId,customerId,objectPath,originalFilename,mimeType,sizeBytes]);
        return {documentId,objectPath,remainingBytes:verdict.remainingBytes};
      });
    }
  };
}
