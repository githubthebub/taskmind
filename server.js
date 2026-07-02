/**
 * TaskMind lead-capture server — zero dependencies, Node 18+.
 *
 *   node server.js            → http://localhost:3000
 *
 * Endpoints:
 *   GET  /                    landing page (public/)
 *   POST /api/leads           capture a lead  {email, name?, source, quizResult?}
 *   GET  /api/leads.csv       export all leads as CSV (for your email tool)
 *   GET  /api/stats           lead counts by source
 *
 * Leads are stored in data/leads.json. Swap `saveLead` for a call to your
 * email provider (ConvertKit/Kit, Mailchimp, Beehiiv) when you're ready.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8',
  '.pdf': 'application/pdf',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function loadLeads() {
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveLead(lead) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const leads = loadLeads();
  const existing = leads.find((l) => l.email === lead.email);
  if (existing) {
    // Update rather than duplicate — a returning visitor is a warmer lead.
    // Only overwrite with non-empty values so a repeat submit can't erase data.
    for (const [k, v] of Object.entries(lead)) {
      if (v !== undefined && v !== '') existing[k] = v;
    }
    existing.updatedAt = new Date().toISOString();
  } else {
    leads.push({ ...lead, createdAt: new Date().toISOString() });
  }
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  return !existing;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) reject(new Error('payload too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function handleApi(req, res, url) {
  if (req.method === 'POST' && url.pathname === '/api/leads') {
    let payload;
    try {
      payload = JSON.parse(await readBody(req));
    } catch {
      return json(res, 400, { ok: false, error: 'invalid JSON' });
    }
    const email = String(payload.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return json(res, 422, { ok: false, error: 'Please enter a valid email address.' });
    }
    const created = saveLead({
      email,
      name: String(payload.name || '').trim().slice(0, 100),
      source: String(payload.source || 'unknown').slice(0, 50),
      quizResult: payload.quizResult ? String(payload.quizResult).slice(0, 50) : undefined,
    });
    return json(res, created ? 201 : 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/leads.csv') {
    const leads = loadLeads();
    const header = 'email,name,source,quizResult,createdAt,updatedAt';
    const rows = leads.map((l) =>
      [l.email, l.name, l.source, l.quizResult, l.createdAt, l.updatedAt].map(csvEscape).join(',')
    );
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="taskmind-leads.csv"',
    });
    return res.end([header, ...rows].join('\n') + '\n');
  }

  if (req.method === 'GET' && url.pathname === '/api/stats') {
    const leads = loadLeads();
    const bySource = {};
    for (const l of leads) bySource[l.source] = (bySource[l.source] || 0) + 1;
    return json(res, 200, { total: leads.length, bySource });
  }

  return json(res, 404, { ok: false, error: 'not found' });
}

function serveStatic(req, res, url) {
  let filePath = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(url.pathname)));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (url.pathname === '/' || url.pathname === '') filePath = path.join(PUBLIC_DIR, 'index.html');

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return serveStatic(req, res, url);
  } catch (err) {
    return json(res, 500, { ok: false, error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`TaskMind lead engine running → http://localhost:${PORT}`);
});
