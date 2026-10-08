import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { RoomManager } from './rooms';

const PORT = Number(process.env.PORT ?? 5180);
const PROD = process.env.NODE_ENV === 'production';
const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const DIST = join(ROOT, 'dist/client');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, path);
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(503).end('Client not built. Run `npm run build` first.');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}

let handler: (req: IncomingMessage, res: ServerResponse) => void = serveStatic;
const http = createServer((req, res) => handler(req, res));

// One process, one port: game sockets on /ws, everything else is the web app.
const rooms = new RoomManager();
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', (ws) => rooms.connect(ws));
http.on('upgrade', (req, socket, head) => {
  if (req.url?.split('?')[0] !== '/ws') return; // leave Vite's HMR socket alone
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

if (!PROD) {
  const { createServer: createVite } = await import('vite');
  const vite = await createVite({
    root: ROOT,
    appType: 'spa',
    server: { middlewareMode: true, hmr: { server: http } },
  });
  handler = (req, res) => vite.middlewares(req, res);
}

http.listen(PORT, () => {
  console.log(`WHO AM I? running at http://localhost:${PORT}  (${PROD ? 'production' : 'development'})`);
});
