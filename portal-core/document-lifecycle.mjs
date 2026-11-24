/**
 * Server-only lifecycle for private uploaded documents.
 * The trusted caller resolves customerId from a verified session.
 * Storage object existence, content type and actual size MUST be checked by
 * the caller before markReady. Never trust client-provided metadata.
 */
export function createDocumentLifecycle({db}){
  if(typeof db?.transaction!=='function')throw Error('db_required');
  return {
    async cancelPending({customerId,documentId}){
      return db.transaction(async tx=>{
        const row=await tx.maybeOne(`DELETE FROM portal_private.client_documents
          WHERE id=$1 AND customer_id=$2 AND state='pending' RETURNING id`,[documentId,customerId]);
        return Boolean(row);
      });
    },
    async markReady({customerId,documentId,actualSizeBytes}){
      if(!Number.isSafeInteger(actualSizeBytes)||actualSizeBytes<1||actualSizeBytes>10485760)
        throw Error('invalid_actual_size');
      return db.transaction(async tx=>{
        const row=await tx.maybeOne(`SELECT id,size_bytes,state FROM portal_private.client_documents
          WHERE id=$1 AND customer_id=$2 FOR UPDATE`,[documentId,customerId]);
        if(!row||row.state!=='pending'||Number(row.size_bytes)!==actualSizeBytes)
          throw Error('document_not_ready');
        await tx.one(`UPDATE portal_private.client_documents
          SET state='ready',completed_at=now() WHERE id=$1 AND customer_id=$2
          RETURNING id`,[documentId,customerId]);
        return {documentId,state:'ready'};
      });
    },
    async getPendingMetadata({customerId,documentId}){
      return db.transaction(async tx=>{
        const row=await tx.maybeOne(`SELECT id,object_path,mime_type,size_bytes
          FROM portal_private.client_documents
          WHERE id=$1 AND customer_id=$2 AND state='pending'`,[documentId,customerId]);
        if(!row)throw Error('document_not_found');
        return row;
      });
    },
    async getReadyMetadata({customerId,documentId}){
      return db.transaction(async tx=>{
        const row=await tx.maybeOne(`SELECT id,object_path,mime_type,size_bytes,original_filename
          FROM portal_private.client_documents
          WHERE id=$1 AND customer_id=$2 AND state='ready'`,[documentId,customerId]);
        if(!row)throw Error('document_not_found');
        return row;
      });
    }
  };
}
