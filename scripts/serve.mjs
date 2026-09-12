/* Local mirror of the Vercel static config: cleanUrls, no trailing slash, 404.html. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve('C:/Users/nikhi/Claude/nikhil-portfolio/public');
const PORT = Number(process.env.PORT || 4399);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon'
};

function resolveFile(pathname) {
  const clean = decodeURIComponent(pathname).replace(/\/+$/, '') || '/';
  const candidates = clean === '/'
    ? ['index.html']
    : [clean.slice(1), clean.slice(1) + '.html', path.join(clean.slice(1), 'index.html')];
  for (const c of candidates) {
    const abs = path.join(ROOT, c);
    if (!abs.startsWith(ROOT)) continue;
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  }
  return null;
}

http.createServer((req, res) => {
  const { pathname } = url.parse(req.url);
  const file = resolveFile(pathname);
  if (!file) {
    const nf = path.join(ROOT, '404.html');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'Not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('serving ' + ROOT + ' on http://localhost:' + PORT));
