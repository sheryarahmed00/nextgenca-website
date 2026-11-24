/**
 * Staging-only executable composition root.
 * Start only on private staging infrastructure behind HTTPS reverse proxy.
 * Required env: DATABASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY,
 * PORTAL_CODE_HMAC_SECRET, PORTAL_ALLOWED_ORIGIN.
 */
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { createPortalDb } from './postgres-adapter.mjs';
import { createPortalHandlers } from './api-handlers.mjs';
import { createRedemptionRateLimiter } from './redemption-rate-limit.mjs';
import { createSupabaseTokenVerifier } from './supabase-auth.mjs';
import { createPortalHttpServer } from './node-http-server.mjs';
import { createDocumentReservationService } from './document-reservations.mjs';
import { createDocumentLifecycle } from './document-lifecycle.mjs';
import { createPrivateDocumentStorage } from './private-document-storage.mjs';
import { createDocumentWorkflow } from './document-workflow.mjs';
import { createDocumentApiHandlers } from './document-api-handlers.mjs';

const required=['DATABASE_URL','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','PORTAL_CODE_HMAC_SECRET','PORTAL_ALLOWED_ORIGIN','SUPABASE_SECRET_KEY'];
for(const key of required)if(!process.env[key])throw Error('missing_required_env_'+key);
const url=new URL(process.env.SUPABASE_URL);
if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co'))throw Error('invalid_supabase_url');
if(!/^https:\/\/[^/]+$/.test(process.env.PORTAL_ALLOWED_ORIGIN))throw Error('invalid_staging_origin');
if(Buffer.byteLength(process.env.PORTAL_CODE_HMAC_SECRET,'utf8')<32)throw Error('weak_hmac_secret');
const dbUrl=new URL(process.env.DATABASE_URL);
if(dbUrl.protocol!=='postgresql:'&&dbUrl.protocol!=='postgres:')throw Error('invalid_db_url');
const port=Number(process.env.PORT||3001);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('invalid_port');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:5,
  ssl:{rejectUnauthorized:true},connectionTimeoutMillis:5000});
const db=createPortalDb(pool);
const auth=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:false,autoRefreshToken:false}
}).auth;
const verifyBearerToken=createSupabaseTokenVerifier({
  auth,issuer:process.env.SUPABASE_URL.replace(/\/$/,'')+'/auth/v1'
});
const serviceHandlers=createPortalHandlers({
  db,secret:process.env.PORTAL_CODE_HMAC_SECRET,
  rateLimit:createRedemptionRateLimiter({db})
});
const storageClient=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{
  auth:{persistSession:false,autoRefreshToken:false}
});
const documentWorkflow=createDocumentWorkflow({
  reservations:createDocumentReservationService({db,bytesPerClient:Number(process.env.PORTAL_CLIENT_STORAGE_BYTES||524288000)}),
  lifecycle:createDocumentLifecycle({db}),
  storage:createPrivateDocumentStorage({storage:storageClient.storage})
});
const documentHandlers=createDocumentApiHandlers({db,workflow:documentWorkflow});
const handlers={...serviceHandlers,...documentHandlers};
const server=createPortalHttpServer({
  handlers,verifyBearerToken,allowedOrigins:[process.env.PORTAL_ALLOWED_ORIGIN]
});
await pool.query('select 1');
server.listen(port,'127.0.0.1',()=>console.log('NextGen staging API listening on localhost:'+port));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{
  server.close(()=>{void pool.end().then(()=>process.exit(0));});
});
