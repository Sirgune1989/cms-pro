# PUP InfoHub CMS Pro v9

System CMS do zarzadzania wyswietlaczami TV w Powiatowym Urzedzie Pracy.

## Architektura

```
cms-pro-v9/
  backend/     Express + SQLite API (:4000)
  frontend/    React + Vite panel CMS (:3000)
  tv-screen/   Ekran TV (:8080)
```

## Uruchomienie lokalne

### Bez Dockera

```bash
# 1. Backend
cd backend
cp ../.env.example .env
npm install
npm run dev

# 2. Frontend (nowy terminal)
cd frontend
npm install
npm run dev

# 3. TV Screen — otworz tv-screen/index.html w przegladarce
#    lub uzyj dowolnego serwera HTTP
```

### Z Dockerem

```bash
# Development
docker-compose up -d

# Adresy:
# CMS Panel:  http://localhost:3000
# API:        http://localhost:4000/api
# TV Screen:  http://localhost:8080

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Logowanie

Domyslny token: `dev-token-12345` (zmien w pliku `.env`).

## API

| Endpoint | Metody | Opis |
|----------|--------|------|
| `/api/config` | GET, PUT | Konfiguracja (motyw, akcent, dane organizacji) |
| `/api/slides` | GET, POST, PUT, DELETE | Slajdy (10 typow) |
| `/api/slides/reorder` | PUT | Zmiana kolejnosci slajdow |
| `/api/ticker` | GET, POST, PUT, DELETE | Pasek wiadomosci |
| `/api/rooms` | GET, POST, PUT, DELETE | Lista pokojow |
| `/api/stat-cards` | GET, POST, PUT, DELETE | Karty statystyk |
| `/api/map-data` | GET, PUT | Dane mapy powiatu |
| `/api/icons` | GET, POST, DELETE | Ikony SVG |
| `/api/media` | GET, POST, DELETE | Pliki mediow |
| `/api/screen/:room` | GET | JSON dla ekranu TV (bez autoryzacji) |
| `/api/backup` | GET, POST | Eksport/import danych |

## Backup

```bash
# Eksport z API
curl http://localhost:4000/api/backup -H "Authorization: Bearer dev-token-12345" > backup.json

# Import
curl -X POST http://localhost:4000/api/backup -H "Authorization: Bearer dev-token-12345" -H "Content-Type: application/json" -d @backup.json

# SQLite bezposrednio
sqlite3 db.sqlite ".backup backup-$(date +%Y%m%d).db"
```

## Migracja z v8.1

```bash
cd backend
node src/utils/migrate-v81.js sciezka/do/backup-v81.json
```

## Dodawanie nowych funkcji

- Nowy endpoint API: `backend/src/routes/`
- Nowy komponent React: `frontend/src/components/`
- Nowy typ slajdu: dodaj edytor + renderer w TV screen
