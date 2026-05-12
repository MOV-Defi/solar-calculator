const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const LOCAL_TEMPLATES_FILE = path.join(DATA_DIR, 'templates_catalog.json');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_TEMPLATES_TABLE = process.env.SUPABASE_TEMPLATES_TABLE || 'shared_templates';

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

const hasSupabaseConfig = () => Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

const ensureLocalTemplatesFile = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LOCAL_TEMPLATES_FILE)) {
    fs.writeFileSync(
      LOCAL_TEMPLATES_FILE,
      JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), templates: [] }, null, 2),
      'utf8'
    );
  }
};

const normalizeTemplatesPayload = (templates) => ({
  schemaVersion: 1,
  updatedAt: new Date().toISOString(),
  templates: Array.isArray(templates) ? templates.map((t) => ({
    id: String(t?.id || ''),
    name: String(t?.name || ''),
    data: t?.data && typeof t.data === 'object' ? t.data : {}
  })) : []
});

const readLocalTemplates = () => {
  ensureLocalTemplatesFile();
  const raw = fs.readFileSync(LOCAL_TEMPLATES_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return normalizeTemplatesPayload(parsed?.templates || []);
};

const writeLocalTemplates = (templates) => {
  const payload = normalizeTemplatesPayload(templates);
  ensureLocalTemplatesFile();
  fs.writeFileSync(LOCAL_TEMPLATES_FILE, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
};

const supabaseHeaders = () => ({
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
});

const readSupabaseTemplates = async () => {
  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TEMPLATES_TABLE}?select=id,name,data,updated_at&order=updated_at.desc`;
  const response = await fetch(url, { headers: supabaseHeaders() });
  if (!response.ok) throw new Error(`supabase_read_failed_${response.status}`);
  const rows = await response.json();
  const templates = (Array.isArray(rows) ? rows : []).map((row) => ({
    id: String(row?.id || ''),
    name: String(row?.name || ''),
    data: row?.data && typeof row.data === 'object' ? row.data : {}
  }));
  return normalizeTemplatesPayload(templates);
};

const writeSupabaseTemplates = async (templates) => {
  const payload = normalizeTemplatesPayload(templates).templates;
  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TEMPLATES_TABLE}?on_conflict=id`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(),
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`supabase_write_failed_${response.status}`);
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'calk-v4-railway', ts: new Date().toISOString() });
});

app.get('/api/templates', async (_req, res) => {
  try {
    const data = hasSupabaseConfig() ? await readSupabaseTemplates() : readLocalTemplates();
    return res.json({ ok: true, data });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || 'read_failed' });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const templates = Array.isArray(req?.body?.templates) ? req.body.templates : null;
    if (!templates) return res.status(400).json({ ok: false, error: 'invalid_templates_payload' });

    if (hasSupabaseConfig()) {
      await writeSupabaseTemplates(templates);
    } else {
      writeLocalTemplates(templates);
    }
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error?.message || 'write_failed' });
  }
});

app.use(express.static(ROOT_DIR));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }
  return res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Calk v4 server is running on port ${PORT}`);
});
