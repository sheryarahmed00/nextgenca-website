import {resolveCustomerAccount} from './identity-mapping.mjs';

/**
 * Authenticated document operations. Identity always comes from verified
 * server session; the request body must never supply a customer ID.
 * These handlers require an HTTP boundary with strict route validation.
 */
export function createDocumentApiHandlers({db,workflow}){
 if(!db?.maybeOne||!workflow?.beginUpload||!workflow?.completeUpload||!workflow?.download)
   throw Error('document_api_dependencies_required');
 async function customerId(verifiedSession){
   const customer=await resolveCustomerAccount({db,verifiedSession});
   return customer.id;
 }
 return {
   async beginDocumentUpload({verifiedSession,body}){
     return workflow.beginUpload({customerId:await customerId(verifiedSession),
       mimeType:body.mimeType,sizeBytes:body.sizeBytes,
       originalFilename:body.originalFilename});
   },
   async completeDocumentUpload({verifiedSession,body}){
     return workflow.completeUpload({customerId:await customerId(verifiedSession),
       documentId:body.documentId});
   },
   async downloadDocument({verifiedSession,body}){
     return workflow.download({customerId:await customerId(verifiedSession),
       documentId:body.documentId});
   }
 };
}
