# Render Deployment + Supabase

## 1. Push project to GitHub

```bash
git add .
git commit -m "Prepare Render deployment"
git push
```

## 2. Create Render service

1. Open https://render.com
2. New + -> Blueprint
3. Select your GitHub repository
4. Confirm `render.yaml`
5. Click Apply

Render will create one web service with:
- Build command: `npm run setup && npm run build`
- Start command: `npm start`
- Health check: `/api/health`

## 3. Connect Supabase database

Preferred option (recommended):
- Use `DATABASE_URL` from Supabase connection string (with `sslmode=require`)

Where to find it in Supabase:
- Project -> Settings -> Database -> Connection string
- Use the Node.js/Postgres connection URI

Set this in Render env vars:
- `DATABASE_URL=postgresql://...`

Fallback option (if you do not use `DATABASE_URL`):
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME=postgres`
- `DB_PORT=5432`

## 4. Set required environment variables in Render

Required:
- `NODE_ENV=production`
- `JWT_SECRET=<strong-random-secret>`
- `VITE_SUPABASE_URL=https://<your-project>.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<your-anon-key>`
- `VITE_API_URL=/api`

Optional (admin login override):
- `VITE_ADMIN_EMAIL=admin@english.local`
- `VITE_ADMIN_PASSWORD=<strong-password>`

## 5. Redeploy after env changes

After adding/changing env vars:
1. Open Render service
2. Click Manual Deploy -> Deploy latest commit

## 6. Verify deployment

- Health endpoint: `https://<your-render-url>/api/health`
- Frontend: `https://<your-render-url>/`
- API test: `https://<your-render-url>/api/lessons`

If health works but lessons fail:
- Check `DATABASE_URL`/DB variables
- Check Supabase network and credentials
- Check Render logs for `pg` connection errors
