import {randomUUID} from 'node:crypto';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const extensions={'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg'};
export function createPrivateDocumentPath({customerId,mimeType,documentId=randomUUID()}){
  if(typeof customerId!=='string'||!uuid.test(customerId)||
     typeof documentId!=='string'||!uuid.test(documentId)||
     !Object.hasOwn(extensions,mimeType))throw Error('invalid_document_metadata');
  return customerId.toLowerCase()+'/'+documentId.toLowerCase()+'.'+extensions[mimeType];
}
export function belongsToCustomer({path,customerId}){
  if(typeof path!=='string'||typeof customerId!=='string'||!uuid.test(customerId))return false;
  const match=/^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(pdf|png|jpg)$/i.exec(path);
  return match!==null && match[1].toLowerCase()===customerId.toLowerCase();
}
