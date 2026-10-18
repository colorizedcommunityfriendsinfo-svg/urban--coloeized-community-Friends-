import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const mime = {html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',mjs:'text/javascript; charset=utf-8',js:'text/javascript; charset=utf-8',svg:'image/svg+xml',png:'image/png',webmanifest:'application/manifest+json'};

export async function createApp({ directory, service }) {
  // Only build-produced top-level files are served. No user-controlled filesystem paths.
  const files = new Map();
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    if (entry.isFile() && Object.hasOwn(mime,entry.name.split('.').at(-1))) files.set(`/${entry.name}`,await readFile(join(directory,entry.name)));
  }
  if (!files.has('/index.html')) throw new Error('Build output missing. Run the service build first.');
  return http.createServer({maxHeaderSize:8192,requestTimeout:15000,headersTimeout:10000},(req,res)=>{
    const headers = {
      'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin',
      'X-Frame-Options':'DENY', 'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
    };
    function send(status,body,type='application/json; charset=utf-8',extra={}) {
      const bytes=Buffer.isBuffer(body)?body:Buffer.from(body);
      res.writeHead(status,{...headers,'Content-Type':type,'Content-Length':bytes.length,...extra});res.end(req.method==='HEAD'?undefined:bytes);
    }
    let path;
    try { path=decodeURIComponent((req.url||'/').split('?')[0]); } catch { return send(400,'{"error":"INVALID_REQUEST"}'); }
    // A denial boundary, not a Wix entitlement implementation. No credentials, file IDs,
    // member IDs or signed URLs are accepted or issued by this companion service.
    if(path==='/api/workbook'||path.startsWith('/api/workbook/')) return send(403,'{"error":"WORKBOOK_UNAVAILABLE","releaseEnabled":false}');
    if(req.method!=='GET'&&req.method!=='HEAD') return send(405,'{"error":"METHOD_NOT_ALLOWED"}',undefined,{'Allow':'GET, HEAD'});
    if(path==='/healthz') return send(200,JSON.stringify({status:'ok',service,workbookReleaseEnabled:false}));
    if(path==='/') path='/index.html';
    if(!files.has(path)) return send(404,'{"error":"NOT_FOUND"}');
    return send(200,files.get(path),mime[path.split('.').at(-1)],{'Cache-Control':'no-cache'});
  });
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const service=process.argv[2]; if(!['web','mobile'].includes(service)) throw new Error('Expected web or mobile service.');
  const port=Number(process.env.PORT || (service==='web'?80:8080));
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT.');
  const server=await createApp({directory:join(process.cwd(),'dist'),service});
  server.listen(port,'0.0.0.0',()=>console.log(`CCF ${service} listening on port ${port}`));
  const stop=()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();};
  process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
