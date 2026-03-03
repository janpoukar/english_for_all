# English Website - Deployment Guide

## Local Development

```bash
# Setup all dependencies
npm run setup

# Dev mode (frontend + backend)
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## Build for Production

```bash
npm run build
```

This creates `client/dist` which is served by the backend.

## Railway Deployment

### 1. Příprava (Preparation)

```bash
# Initialize git if not done
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

### 2. GitHub Repository
Push your code to GitHub (required for Railway)

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 3. Railway Setup

1. Jdi na https://railway.app/
2. Přihlás se/zaregistruj (přes GitHub)
3. Klikni "Create New Project"
4. Vyber "Deploy from GitHub"
5. Připoj svůj GitHub account a vyber `english_website` repo

### 4. Environment Variables v Railway

Přidej tyto proměnné v Railway dashboard:

```
NODE_ENV=production
PORT=5000
DB_HOST=tvuj-host.supabase.co
DB_USER=postgres
DB_PASSWORD=tvuj-password
DB_NAME=postgres
DB_PORT=5432
JWT_SECRET=tvuj-dlouhy-tajny-klic-min-32-znaku
VITE_SUPABASE_URL=https://srvxvawubgjdgghddwxp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_sO8tzOX2x01uXBSMjGQmSg_qsSzkxsh
```

⚠️ **Změň:**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD` - tvoje Supabase credentials
- `JWT_SECRET` - silný tajný klíč (min 32 znaků)

### 5. Build & Deploy

Railway automaticky:
1. Nainstaluje dependencies
2. Spustí `npm run build` (kompiluje React)
3. Spustí `npm start` (frontend + backend)

### 6. Custom Domain (volitelné)

V Railway dashboard → Settings → Custom Domain

---

## Free vs Paid

- **Free**: $5/měsíc kredit (stačí na 1-2 měsíce)
- **Afterwards**: Různé tariffy, jako https://railway.app/pricing

---

## Troubleshooting

### "npm: command not found"
Railway potřebuje Node.js. Zkontroluj `engines` v `package.json`

### "Cannot find module"
```bash
npm run setup
```

### "Static files not serving"
Ujisti se, že `npm run build` vytvořil `client/dist/`

---

## Struktura Projektu

```
.
├── client/              # React + Vite frontend
│   ├── src/
│   ├── dist/           # Build output (production)
│   ├── package.json
│   └── vite.config.js
├── server/              # Node.js + Express backend
│   ├── app.js          # Express config
│   ├── server.js       # Server start
│   ├── db.js           # Database connection
│   ├── package.json
│   └── .env            # Environment variables
├── package.json         # Root scripts
├── railway.json         # Railway config
└── .gitignore          # Git ignore rules
```

---

**Potřebuješ pomoc?** Zavolej Railway support nebo napište na Discord.
