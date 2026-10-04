const http = require('node:http');
const crypto = require('node:crypto');
const { Client } = require('../client.cjs');

function selectWindow(window) {
  if (!window) return null;
  return Object.fromEntries(['usedPercent', 'windowDurationMins', 'resetsAt'].map(key => [key, window[key] ?? null]));
}
function selectBucket(bucket) {
  if (!bucket) return null;
  return {
    limitId: bucket.limitId ?? null, limitName: bucket.limitName ?? null,
    normalModelSlug: bucket.normalModelSlug ?? null,
    planType: bucket.planType ?? null,
    primary: selectWindow(bucket.primary), secondary: selectWindow(bucket.secondary),
    credits: bucket.credits ? {
      balance: bucket.credits.balance ?? null,
      unlimited: bucket.credits.unlimited === true,
      hasCredits: bucket.credits.hasCredits === true
    } : null
  };
}
function publicUsage(raw) {
  return {
    rateLimits: selectBucket(raw.rateLimits),
    rateLimitsByLimitId: raw.rateLimitsByLimitId
      ? Object.fromEntries(Object.entries(raw.rateLimitsByLimitId).map(([key, value]) => [key, selectBucket(value)])) : null
  };
}
function createService({ key, readUsage, cacheMs = 30000, now = Date.now }) {
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(key)) {
    throw new Error('Set METER_ACCESS_KEY to 32-128 random letters, numbers, underscores or hyphens.');
  }
  const keyHash = crypto.createHash('sha256').update(key).digest();
  let snapshot = { data: null, updated: null, error: null }, pending, nextRead = 0;
  async function read() {
    if (pending) return pending;
    if (now() < nextRead) return snapshot;
    pending = (async () => {
      try { snapshot = { data: publicUsage(await readUsage()), updated: now(), error: null }; }
      catch { snapshot = { ...snapshot, error: 'cloud_unavailable' }; }
      finally { nextRead = now() + cacheMs; }
      return snapshot;
    })();
    try { return await pending; } finally { pending = null; }
  }
  const server = http.createServer(async (req, res) => {
    const send = (status, value) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'
      });
      res.end(JSON.stringify(value));
    };
    if (req.url === '/health' && req.method === 'GET') return send(200, { ok: true });
    const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    const authorized = token.length <= 128 && crypto.timingSafeEqual(keyHash, crypto.createHash('sha256').update(token).digest());
    if (!authorized) return send(401, { error: 'unauthorized' });
    if (req.method !== 'GET') return send(405, { error: 'method_not_allowed' });
    if (req.url !== '/api/usage') return send(404, { error: 'not_found' });
    try { send(200, await read()); } catch { send(503, { error: 'cloud_unavailable' }); }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  return server;
}

function codexProvider() {
  let client;
  return {
    async read() {
      try {
        if (!client || client.dead) { client?.close(); client = new Client(); await client.start(); }
        return await client.call('account/rateLimits/read');
      } catch (error) { client?.close(); client = null; throw error; }
    },
    close() { client?.close(); }
  };
}
module.exports = { createService, codexProvider, publicUsage };
if (require.main === module) {
  const provider = codexProvider();
  const server = createService({ key: process.env.METER_ACCESS_KEY, readUsage: () => provider.read() });
  const port = Number(process.env.PORT || 8080);
  server.listen(port, process.env.METER_BIND || '127.0.0.1', () => console.log('Codex Meter service listening on port ' + port));
  const stop = () => { provider.close(); server.close(); server.closeAllConnections(); };
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
}
