import { createServer } from 'node:http';
import { createHttpBoundary } from './http-boundary.mjs';

/**
 * Node HTTP adapter for staging. Dependencies must be constructed by a trusted
 * server bootstrap (database, auth verification, handlers, origin allowlist).
 * Never expose this server directly without TLS termination and network limits.
 */
export function createPortalHttpServer({handlers,verifyBearerToken,allowedOrigins,maxBodyBytes=4096}){
  if(!Array.isArray(allowedOrigins)||allowedOrigins.length===0||
     allowedOrigins.some(x=>typeof x!=='string'||!x.startsWith('https://')))
    throw Error('https_origin_allowlist_required');
  const allow=new Set(allowedOrigins);
  const dispatch=createHttpBoundary({
    handlers,verifyBearerToken,maxBodyBytes,
    checkRequestOrigin:origin=>allow.has(origin)
  });
  return createServer(async(req,res)=>{
    const origin=req.headers.origin;
    const permitted=typeof origin==='string'&&allow.has(origin);
    if(permitted){
      res.setHeader('Access-Control-Allow-Origin',origin);
      res.setHeader('Vary','Origin');
      res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
    }
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Type','application/json; charset=utf-8');
    if(req.method==='OPTIONS'){
      res.writeHead(permitted?204:403);res.end();return;
    }
    if(req.method!=='POST'||typeof req.url!=='string'||!/^\/api\/(?:admin|client)\/[a-z-]+$/.test(req.url)){
      res.writeHead(404);res.end(JSON.stringify({error:'not_found'}));return;
    }
    if(!permitted){
      res.writeHead(403);res.end(JSON.stringify({error:'forbidden'}));return;
    }
    if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')){
      res.writeHead(415);res.end(JSON.stringify({error:'unsupported_media_type'}));return;
    }
    let body='',bytes=0;
    try{
      for await(const chunk of req){
        bytes+=chunk.length;
        if(bytes>maxBodyBytes){res.writeHead(413);res.end(JSON.stringify({error:'invalid_body'}));req.resume();return;}
        body+=chunk.toString('utf8');
      }
      const result=await dispatch({
        method:req.method,path:req.url.slice(4).split('?')[0],
        authorization:req.headers.authorization,origin,bodyText:body
      });
      res.writeHead(result.status);res.end(JSON.stringify(result.body));
    }catch{
      if(!res.headersSent)res.writeHead(500);
      if(!res.writableEnded)res.end(JSON.stringify({error:'request_failed'}));
    }
  });
}
