# 🎓 English Learning Website

Moderní platforma pro výuku angličtiny s React frontendem a Node.js backendem.

## 🚀 Quick Start - Lokální Spuštění

### Jednoduše:
```bash
npm run setup    # Instaluje všechny dependencies (jednorazově)
npm run dev      # Spustí frontend + backend
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

### Nebo ručně (pro debug):
```bash
# Terminal 1 - Frontend
cd client
npm install
npm run dev

# Terminal 2 - Backend
cd server
npm install
npm run dev
```

---

## 📦 Struktura Projektu

```
english_website/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/        # Stránky (Home, Dashboard, atd)
│   │   ├── components/   # Komponenty
│   │   └── services/     # API volání
│   ├── dist/             # Build output (po npm run build)
│   └── package.json
│
├── server/                 # Express backend
│   ├── app.js            # Express setup + static files
│   ├── server.js         # Server start
│   ├── db.js             # PostgreSQL connection
│   ├── Authroutes.js     # Auth API
│   ├── leassonRoutes.js  # Lessons API
│   ├── .env              # Environment variables (TAJNÉ!)
│   └── package.json
│
├── package.json          # Root scripts
├── .gitignore           # Git ignore rules
└── RAILWAY_DEPLOYMENT.md # Nahrání na produkci
```

---

## 🛠️ Dostupné Příkazy

```bash
npm run dev       # Development mode (frontend + backend)
npm run build     # Build React pro produkci
npm start         # Spustit backend (produkce)
npm run setup     # První instalace všech závisleností
```

---

## 🌐 Nahrání na Railway (Produkce)

**Úplný průvodce**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

## 🌐 Nahrání na Render (Produkce)

**Úplný průvodce**: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

### TL;DR:
1. Push na GitHub
2. Připoj repo na https://railway.app/
3. Přidej environment variables
4. Railway automaticky builidí a deployuje ✨

### Zdarma:
- $5/měsíc credit (stačí 1-2 měsíční)
- Bez kreditní karty

---

## 🔧 Konfigurace

### Server .env
```env
PORT=5000
NODE_ENV=production
DB_HOST=your-supabase.supabase.co
DB_USER=postgres
DB_PASSWORD=xxx
JWT_SECRET=very-long-secret-key
```

### Client .env
```env
VITE_API_URL=/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

See [server/.env.example](./server/.env.example) a [client/.env.example](./client/.env.example)

---

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS configured
- ❌ Nikdy nenahrávej `.env` soubor (je v `.gitignore`)

---

## 📊 Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT
- **Deployment**: Railway

---

## 📝 Notes

- Frontend se servíruje z backendu (Express)
- React Router fallback na `index.html` (SPA)
- Supabase poskytuje PostgreSQL

---

**Vytvořeno s ❤️ pro výuku**
