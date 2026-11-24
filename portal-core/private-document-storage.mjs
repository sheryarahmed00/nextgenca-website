/**
 * Server-side private document storage adapter.
 * Caller must verify the authenticated customer and entitlement before invoking.
 * Never use a service-role key in a browser.
 */
export function createPrivateDocumentStorage({storage,bucket='nextgenca-client-documents',urlTtlSeconds=60}){
  if(!storage?.from||typeof bucket!=='string'||!bucket||
     !Number.isInteger(urlTtlSeconds)||urlTtlSeconds<1||urlTtlSeconds>300)
    throw Error('invalid_storage_configuration');
  const files=storage.from(bucket);
  if(!files?.createSignedUploadUrl||!files?.createSignedUrl||!files?.info)
    throw Error('storage_methods_required');
  return {
    async createUploadTicket({objectPath}){
      const {data,error}=await files.createSignedUploadUrl(objectPath,{upsert:false});
      if(error||!data?.token||!data?.path)throw Error('upload_ticket_failed');
      return {path:data.path,token:data.token};
    },
    async verifyUploadedObject({objectPath,expectedBytes,mimeType}){
      const {data,error}=await files.info(objectPath);
      if(error||!data)throw Error('object_not_found');
      const size=Number(data.metadata?.size??data.size);
      const contentType=data.metadata?.mimetype??data.metadata?.contentType;
      if(size!==expectedBytes||contentType!==mimeType)throw Error('object_metadata_mismatch');
      return {sizeBytes:size,mimeType:contentType};
    },
    async createDownloadUrl({objectPath}){
      const {data,error}=await files.createSignedUrl(objectPath,urlTtlSeconds,{download:true});
      if(error||!data?.signedUrl)throw Error('download_url_failed');
      return {url:data.signedUrl,expiresInSeconds:urlTtlSeconds};
    }
  };
}
