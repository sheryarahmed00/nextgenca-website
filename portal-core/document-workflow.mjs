/**
 * Server-only document workflow. A verified customer account ID must be
 * resolved from the authenticated session by the HTTP boundary.
 * Storage upload tickets are returned only after quota reservation.
 */
export function createDocumentWorkflow({reservations,lifecycle,storage}){
  if(!reservations?.reserve||!lifecycle?.markReady||
     !lifecycle?.listReady||!lifecycle?.getReadyMetadata||!lifecycle?.getPendingMetadata||!lifecycle?.cancelPending||!storage?.createUploadTicket||
     !storage?.verifyUploadedObject||!storage?.createDownloadUrl)
    throw Error('document_workflow_dependencies_required');
  return {
    async listDocuments({customerId}){
      return lifecycle.listReady({customerId});
    },
    async beginUpload({customerId,mimeType,sizeBytes,originalFilename}){
      const reservation=await reservations.reserve({customerId,mimeType,sizeBytes,originalFilename});
      // Release the reservation if the signed ticket cannot be issued.
      let ticket;
      try{
        ticket=await storage.createUploadTicket({objectPath:reservation.objectPath});
        if(ticket.path!==reservation.objectPath)throw Error('storage_path_mismatch');
      }catch(error){
        try{await lifecycle.cancelPending({customerId,documentId:reservation.documentId});}
        catch{throw Error('upload_ticket_cleanup_failed');}
        throw error;
      }
      return {documentId:reservation.documentId,uploadToken:ticket.token,
        objectPath:reservation.objectPath,remainingBytes:reservation.remainingBytes};
    },
    async completeUpload({customerId,documentId}){
      // Never trust a browser-supplied size or MIME type.
      const metadata=await lifecycle.getPendingMetadata({customerId,documentId});
      const actual=await storage.verifyUploadedObject({
        objectPath:metadata.object_path,expectedBytes:Number(metadata.size_bytes),
        mimeType:metadata.mime_type
      });
      return lifecycle.markReady({customerId,documentId,actualSizeBytes:actual.sizeBytes});
    },
    async download({customerId,documentId}){
      const metadata=await lifecycle.getReadyMetadata({customerId,documentId});
      return storage.createDownloadUrl({objectPath:metadata.object_path});
    }
  };
}
