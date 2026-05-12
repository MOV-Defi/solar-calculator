# Railway Setup (Calk v4)

## 1) Local run

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## 2) Required env vars (Railway)

- `PORT` = `3000` (or leave Railway default)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_TEMPLATES_TABLE` = `shared_templates` (optional)

If Supabase env vars are empty, app will use local fallback file `data/templates_catalog.json`.

## 3) Deploy to Railway

1. Create new Railway project from this GitHub repo.
2. Set Start Command: `npm start`
3. Add env vars listed above.
4. Deploy.
5. Verify:
   - `/api/health`
   - `/api/templates`
   - main app `/`

## 4) Notes

- Current frontend already uses `/api/templates`, so no frontend API URL changes are required.
- Existing Netlify function can stay during transition; Railway server now provides the same endpoint contract.
