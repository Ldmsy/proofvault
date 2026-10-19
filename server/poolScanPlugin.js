// Local backend for Live Scan: mounts POST /api/pool-scan on the Vite dev and preview servers.
import { handlePoolScan } from './poolScan.js';

const MAX_BODY_BYTES = 20 * 1024 * 1024;

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Upload too large (max 20 MB)'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON body'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function middleware() {
  return async (req, res, next) => {
    if (req.url !== '/api/pool-scan') return next();
    const send = (status, body) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'POST') return send(405, { error: 'Use POST' });
    try {
      const { status, body } = await handlePoolScan(await readJson(req));
      send(status, body);
    } catch (err) {
      send(err.status ?? 500, { error: err.message });
    }
  };
}

export default function poolScanPlugin() {
  return {
    name: 'proofvault-pool-scan',
    configureServer(server) {
      server.middlewares.use(middleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware());
    },
  };
}
