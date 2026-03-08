import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { URL } from 'node:url';
import { config } from './config.js';
import { SiteCatalogService, contentTypeByExt } from './site-service.js';

const service = new SiteCatalogService({
  catalogDbPath: config.catalogDbPath,
  runtimeDbPath: config.runtimeDbPath,
  rootPath: config.rootPath,
  pageSize: config.pageSize,
  favoritesLimit: config.favoritesLimit,
  siteTitle: config.title,
});

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath, contentType) {
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error('[site] file stream failed', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('File stream error');
  });
  res.writeHead(200, { 'Content-Type': contentType });
  stream.pipe(res);
}

function downloadFilename(name) {
  return encodeURIComponent(String(name || 'download'));
}

function serveStatic(req, res, pathname) {
  const target = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.resolve(config.publicDir, `.${target}`);
  if (!fullPath.startsWith(config.publicDir)) {
    json(res, 403, { error: 'forbidden' });
    return;
  }
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    json(res, 404, { error: 'not_found' });
    return;
  }
  sendFile(res, fullPath, contentTypeByExt(path.extname(fullPath).slice(1)));
}

const server = http.createServer((req, res) => {
  const baseUrl = `http://${req.headers.host || `${config.host}:${config.port}`}`;
  const url = new URL(req.url || '/', baseUrl);
  const pathname = url.pathname;

  try {
    if (pathname === '/health') {
      json(res, 200, { ok: true, title: config.title });
      return;
    }

    if (pathname === '/api/bootstrap') {
      json(res, 200, service.getBootstrap());
      return;
    }

    if (pathname === '/api/favorites') {
      json(res, 200, { items: service.getFavorites() });
      return;
    }

    if (pathname === '/api/folder') {
      const folderId = url.searchParams.get('id') || undefined;
      const page = Number.parseInt(url.searchParams.get('page') || '0', 10);
      const payload = service.getFolder(folderId, page);
      if (!payload) {
        json(res, 404, { error: 'folder_not_found' });
        return;
      }
      json(res, 200, payload);
      return;
    }

    if (pathname === '/api/search') {
      const query = String(url.searchParams.get('q') || '').trim();
      json(res, 200, service.search(query));
      return;
    }

    if (pathname === '/api/file') {
      const fileId = String(url.searchParams.get('id') || '');
      const payload = service.getFile(fileId);
      if (!payload) {
        json(res, 404, { error: 'file_not_found' });
        return;
      }
      json(res, 200, payload);
      return;
    }

    if (pathname.startsWith('/download/')) {
      const fileId = pathname.split('/').pop() || '';
      const result = service.resolveDownload(fileId);
      if (!result || !fs.existsSync(result.fullPath)) {
        json(res, 404, { error: 'file_not_found' });
        return;
      }
      service.state.trackItemEvent(result.item, 'send_file');
      res.writeHead(200, {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${downloadFilename(result.item.name)}`,
      });
      fs.createReadStream(result.fullPath).pipe(res);
      return;
    }

    serveStatic(req, res, pathname);
  } catch (err) {
    console.error('[site] request failed', { pathname, err });
    json(res, 500, { error: 'internal_error' });
  }
});

server.listen(config.port, config.host, () => {
  console.log('[site] listening', {
    host: config.host,
    port: config.port,
    title: config.title,
    db: config.catalogDbPath,
    runtimeDb: config.runtimeDbPath,
    rootPath: config.rootPath,
  });
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      service.close();
      process.exit(0);
    });
  });
}
