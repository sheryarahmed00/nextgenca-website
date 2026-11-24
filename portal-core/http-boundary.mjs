/**
 * Server-only, framework-independent HTTP dispatch.
 * verifyBearerToken MUST cryptographically validate provider-issued JWT:
 * signature, issuer, audience, expiry and verification/MFA claims.
 * This module NEVER trusts session or role fields from the request body.
 */
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const routes={
  'POST /admin/direct-orders':{handler:'createDirectOrder',fields:['customerId','serviceId','source','reference']},
  'POST /admin/approve-order':{handler:'approveDirectOrder',fields:['orderId','verificationConfirmed']},
  'POST /admin/issue-code':{handler:'issueCode',fields:['orderItemId','customerId','expiresAt']},
  'POST /client/redeem-code':{handler:'redeemCode',fields:['code']},
  'POST /client/check-service':{handler:'checkService',fields:['serviceId']},
  'POST /client/documents/begin-upload':{handler:'beginDocumentUpload',fields:['mimeType','sizeBytes','originalFilename']},
  'POST /client/documents/complete-upload':{handler:'completeDocumentUpload',fields:['documentId']},
  'POST /client/documents/download':{handler:'downloadDocument',fields:['documentId']}
};
function validBody(body,fields){
  return body && typeof body==='object' && !Array.isArray(body) &&
    Object.keys(body).every(key=>fields.includes(key)) &&
    fields.every(key=>Object.hasOwn(body,key));
}
function validateRoute(handler,body){
  if(handler==='createDirectOrder')return uuid.test(body.customerId)&&uuid.test(body.serviceId)&&
    ['phone','email','whatsapp','in_person','other'].includes(body.source)&&typeof body.reference==='string'&&body.reference.length<=120;
  if(handler==='approveDirectOrder')return uuid.test(body.orderId)&&body.verificationConfirmed===true;
  if(handler==='issueCode')return uuid.test(body.orderItemId)&&uuid.test(body.customerId)&&
    typeof body.expiresAt==='string'&&Number.isFinite(Date.parse(body.expiresAt));
  if(handler==='redeemCode')return typeof body.code==='string'&&/^[A-Za-z0-9_-]{43}$/.test(body.code);
  if(handler==='checkService')return uuid.test(body.serviceId);
  if(handler==='beginDocumentUpload')return ['application/pdf','image/png','image/jpeg'].includes(body.mimeType)&&Number.isSafeInteger(body.sizeBytes)&&body.sizeBytes>0&&body.sizeBytes<=10485760&&typeof body.originalFilename==='string'&&body.originalFilename.length>0&&body.originalFilename.length<=255&&!/[\\x00-\\x1f\\x7f]/.test(body.originalFilename);
  if(handler==='completeDocumentUpload'||handler==='downloadDocument')return uuid.test(body.documentId);
  return false;
}
export function createHttpBoundary({handlers,verifyBearerToken,checkRequestOrigin,maxBodyBytes=4096}){
  if(!handlers||typeof verifyBearerToken!=='function'||typeof checkRequestOrigin!=='function')throw Error('http_security_dependencies_required');
  return async function dispatch({method,path,authorization,origin,bodyText}){
    const route=routes[method+' '+path];
    if(!route)return {status:404,body:{error:'not_found'}};
    if(typeof bodyText!=='string'||Buffer.byteLength(bodyText,'utf8')>maxBodyBytes)return {status:413,body:{error:'invalid_body'}};
    if(checkRequestOrigin(origin)!==true)return {status:403,body:{error:'forbidden'}};
    if(typeof authorization!=='string'||!/^Bearer [^\s]+$/.test(authorization))return {status:401,body:{error:'unauthorized'}};
    let body;
    try{body=JSON.parse(bodyText);}catch{return {status:400,body:{error:'invalid_body'}};}
    if(!validBody(body,route.fields)||!validateRoute(route.handler,body))return {status:400,body:{error:'invalid_body'}};
    try{
      const verifiedSession=await verifyBearerToken(authorization.slice(7));
      if(verifiedSession?.serverValidated!==true)return {status:401,body:{error:'unauthorized'}};
      const result=await handlers[route.handler](
        route.handler==='checkService'?{verifiedSession,serviceId:body.serviceId}:{verifiedSession,body}
      );
      return {status:200,body:result};
    }catch{
      // No internal DB/auth/entitlement errors in HTTP responses.
      return {status:403,body:{error:'request_denied'}};
    }
  };
}
