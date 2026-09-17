import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist-local');
http.createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1');const asset=/^\/assets\/[\w.-]+\.(js|css)$/.test(url.pathname);const file=asset?path.join(root,url.pathname):path.join(root,'index.html');if(req.method!=='GET'||!fs.existsSync(file)){res.writeHead(404);return res.end()}res.setHeader('Content-Type',asset?(file.endsWith('.js')?'application/javascript':'text/css'):'text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://127.0.0.1:3001; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'");res.setHeader('Cache-Control','no-store');fs.createReadStream(file).pipe(res)}).listen(4173,'127.0.0.1',()=>console.log('Oriafen local ready: http://127.0.0.1:4173/admin'));
