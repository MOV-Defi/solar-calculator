const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE_NAME = process.env.SUPABASE_TEMPLATES_TABLE || 'shared_templates';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

const json = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});

const validateConfig = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY';
  }
  return null;
};

const fetchTemplates = async () => {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=id,name,data,updated_at&order=updated_at.desc`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  if (!res.ok) throw new Error(`supabase_read_failed_${res.status}`);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    id: String(row.id || ''),
    name: String(row.name || ''),
    data: row.data && typeof row.data === 'object' ? row.data : {}
  }));
};

const upsertTemplates = async (templates) => {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?on_conflict=id`;
  const payload = templates.map((t) => ({
    id: String(t.id || ''),
    name: String(t.name || ''),
    data: t.data && typeof t.data === 'object' ? t.data : {}
  }));
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`supabase_write_failed_${res.status}`);
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };

  const configError = validateConfig();
  if (configError) return json(500, { ok: false, error: configError });

  try {
    if (event.httpMethod === 'GET') {
      const templates = await fetchTemplates();
      return json(200, {
        ok: true,
        data: {
          schemaVersion: 1,
          updatedAt: new Date().toISOString(),
          templates
        }
      });
    }

    if (event.httpMethod === 'POST') {
      const parsed = JSON.parse(event.body || '{}');
      const templates = Array.isArray(parsed.templates) ? parsed.templates : null;
      if (!templates) return json(400, { ok: false, error: 'invalid_templates_payload' });

      await upsertTemplates(templates);
      return json(200, { ok: true });
    }

    return json(405, { ok: false, error: 'method_not_allowed' });
  } catch (error) {
    return json(500, { ok: false, error: error?.message || 'server_error' });
  }
};

