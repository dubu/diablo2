import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = process.argv.includes('--dist') ? path.join(project, 'dist') : project;
const baseArg = process.argv.find(arg => arg.startsWith('--base='))?.slice(7) || '/';
const base = '/' + baseArg.split('/').filter(Boolean).join('/') + (baseArg === '/' ? '' : '/');
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (base !== '/' && pathname === base.slice(0, -1)) {
      res.writeHead(302, { Location: base });
      return res.end();
    }
    if (!pathname.startsWith(base)) throw new Error('Outside base');
    const relative = pathname.slice(base.length) || 'index.html';
    if (relative !== 'index.html' && !['src/', 'public/'].some(prefix => relative.startsWith(prefix))) throw new Error('Not public');
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) throw new Error('Outside root');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
server.on('error', error => { console.error(`Cannot start preview: ${error.message}`); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`Emberfall: http://127.0.0.1:${port}${base}`));
