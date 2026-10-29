import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { MAX_FILE_BYTES, MAX_JSON_BYTES } from '@papas-choice/registration';
import { createHandler } from './handler.js';
import { localDependencies } from './local.js';
import { HttpError } from './errors.js';

const port = 3001;
const dependencies = localDependencies({
  port,
  outbox: fileURLToPath(new URL('../.local-mail/', import.meta.url)),
});
const handler = createHandler(dependencies);
createServer(async (req, res) => {
  const headers = {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'access-control-allow-origin': dependencies.config.allowedOrigin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
  try {
    if (req.headers.origin !== dependencies.config.allowedOrigin)
      throw new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Open the website at http://localhost:5173.');
    if (req.method === 'OPTIONS') {
      res.writeHead(204, headers);
      res.end();
      return;
    }
    const url = new URL(req.url, `http://localhost:${port}`);
    const upload = /^\/local-upload\/([0-9a-f-]{36})$/.exec(url.pathname);
    const max = upload ? MAX_FILE_BYTES + 64 * 1024 : MAX_JSON_BYTES;
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > max) throw new HttpError(413, 'REQUEST_TOO_LARGE', 'The request is too large.');
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    if (upload && req.method === 'POST') {
      const request = new Request(url, {
        method: 'POST',
        headers: { 'content-type': req.headers['content-type'] || '' },
        body,
      });
      await dependencies.acceptUpload(upload[1], await request.formData());
      res.writeHead(204, headers);
      res.end();
      return;
    }
    const result = await handler({
      rawPath: url.pathname,
      headers: req.headers,
      body: body.toString(),
      requestContext: {
        requestId: 'local',
        http: { method: req.method, sourceIp: req.socket.remoteAddress },
      },
    });
    res.writeHead(result.statusCode, result.headers);
    res.end(result.body);
  } catch (error) {
    res.writeHead(error.status || 500, headers);
    res.end(
      JSON.stringify({
        error: {
          code: error.code || 'LOCAL_ERROR',
          message: error.status ? error.message : 'The local preview could not be saved.',
        },
      }),
    );
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Local registration API: http://localhost:${port}`);
  console.log(
    'No emails are sent. Use sample data. Email previews are saved in apps/api/.local-mail/.',
  );
});
