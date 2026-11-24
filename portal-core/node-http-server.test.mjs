import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortalHttpServer} from './node-http-server.mjs';

const id='a83f5c92-1f38-4f30-9c17-638e391cbb0a';
const origin='https://staging.example';
async function withServer(run){
  const server=createPortalHttpServer({
    allowedOrigins:[origin],
    verifyBearerToken:async token=>token==='valid-token'?{serverValidated:true}:null,
    handlers:{checkService:async()=>({allowed:true})}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{return await run('http://127.0.0.1:'+server.address().port);}
  finally{await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}
}
test('valid authenticated request reaches handler',async()=>{
 await withServer(async base=>{
  const r=await fetch(base+'/api/client/check-service',{
    method:'POST',headers:{origin,authorization:'Bearer valid-token','content-type':'application/json'},
    body:JSON.stringify({serviceId:id})});
  assert.equal(r.status,200);
  assert.deepEqual(await r.json(),{allowed:true});
 });
});
test('rejects unauthorized origin and ambiguous API paths',async()=>{
 await withServer(async base=>{
  const headers={origin,authorization:'Bearer valid-token','content-type':'application/json'};
  const body=JSON.stringify({serviceId:id});
  assert.equal((await fetch(base+'/api/client/check-service?serviceId='+id,{method:'POST',headers,body})).status,404);
  assert.equal((await fetch(base+'/api/client/check-service/',{method:'POST',headers,body})).status,404);
  assert.equal((await fetch(base+'/api/client/check-service',{method:'POST',headers:{...headers,origin:'https://evil.example'},body})).status,403);
  assert.equal((await fetch(base+'/api/client/check-service',{method:'POST',headers:{...headers,authorization:'Bearer invalid'},body})).status,401);
 });
});
test('rejects invalid media type and oversized request',async()=>{
 await withServer(async base=>{
  const headers={origin,authorization:'Bearer valid-token'};
  assert.equal((await fetch(base+'/api/client/check-service',{method:'POST',headers:{...headers,'content-type':'text/plain'},body:'hello'})).status,415);
  assert.equal((await fetch(base+'/api/client/check-service',{method:'POST',headers:{...headers,'content-type':'application/json'},body:'x'.repeat(5000)})).status,413);
 });
});
