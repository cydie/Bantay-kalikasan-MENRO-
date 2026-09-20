# Bantay Kalikasan — MENRO Portal

Environmental management platform for the **Municipality of Rizal** MENRO office.

## Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐
│      Desktop App        │     │        Web App          │
│      (Electron)         │     │   (React + Vite)        │
│                         │     │                         │
│  Offline-first          │     │  Online only            │
│  Local SQLite (sql.js)  │     │  Direct API calls       │
│  in userData folder     │     │  (requires internet)    │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            │  sync when internet available │  always online
            └───────────────┬───────────────┘
                            │  HTTP / REST
                            ▼
                ┌───────────────────────┐
                │      API Server       │
                │  (Node.js + Express)  │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │     PostgreSQL        │
                │  (central database)   │
                └───────────────────────┘
```

### Storage by platform

| Platform | Local storage | Behavior |
|----------|---------------|----------|
| **Desktop (Electron)** | SQLite file in `%APPDATA%/Bantay Kalikasan MENRO/` | Works offline; queues changes; syncs to server when internet is available |
| **Web** | None | Online only — all data comes from the API / PostgreSQL |
| **Server** | PostgreSQL (Docker) | Central database shared by all clients when they connect |

Auth tokens are separated: `desktop_authToken` vs `web_authToken`.

## Project Structure

```
├── apps/
│   ├── web/          # React website + staff/citizen portals
│   └── desktop/      # Electron desktop wrapper
├── server/           # Express REST API
├── docker-compose.yml
└── package.json      # Monorepo root
```

## Local Database Strategy

**PostgreSQL is the central server database.** Only the desktop app keeps a local copy for offline use:

| Layer | Technology | Location |
|-------|------------|----------|
| **Server** | PostgreSQL | Docker (`localhost:5433`) |
| **Desktop** | SQLite via sql.js | Electron `userData/bantay-kalikasan-local.db` |
| **Web** | — | No local database; requires internet |

When the desktop app has internet, it syncs queued changes to the API (PostgreSQL). The web app always talks directly to the API.

## Quick Start (Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL (database)

**Docker Desktop must be running first** (open the Docker Desktop app on Windows).

Start only the database (fastest for local dev):

```bash
npm run db:up
```

Or start database + API + web together:

```bash
npm run docker:up
```

This starts PostgreSQL on `localhost:5433` (port 5433 avoids conflict with local PostgreSQL on 5432).

### 3. Seed demo data (accounts, charts, etc.)

```bash
npm run seed
```

### 4. Run the Web App

```bash
npm run dev:web
```

Open **http://localhost:5173**

### 5. Run API + Web together

```bash
npm run dev
```

### 6. Run Desktop App

```bash
# Terminal 1: API + Web
npm run dev

# Terminal 2: Electron
npm run dev:desktop
```

## Demo Accounts

**Staff password for all departments:** `rizal2026`

| Department | Email | Password |
|------------|-------|----------|
| Main Admin | `admin@rizal.gov` | `rizal2026` |
| Nursery | `nursery@rizal.gov` | `rizal2026` |
| Environmental | `environmental@rizal.gov` | `rizal2026` |
| Solid Waste | `waste@rizal.gov` | `rizal2026` |
| Landfill | `landfill@rizal.gov` | `rizal2026` |
| Enforcement | `enforcement@rizal.gov` | `rizal2026` |

**Citizen portal:**

| Role | Email | Password |
|------|-------|----------|
| Citizen | `maria.santos123@gmail.com` | `citizen123` |

Re-run seed to restore all department accounts:

```bash
npm run seed
```

## Environment Variables

Copy `.env.example` to `.env` in the project root and in `server/` if running the API locally outside Docker:

```env
DATABASE_URL=postgresql://menro:menro_password@localhost:5433/bantay_kalikasan
PORT=3001
JWT_SECRET=your-secret-key
```

## Troubleshooting

### `ECONNREFUSED` on port 5433 when running `npm run seed`

PostgreSQL is not running. Fix:

1. Open **Docker Desktop** and wait until it is fully started.
2. Run `npm run db:up` (or `npm run docker:up`).
3. Run `npm run seed` again.

### `failed to connect to the docker API` / `dockerDesktopLinuxEngine`

Docker Desktop is not running or not installed. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/), start it, then run `npm run db:up`.

## Docker Commands

```bash
npm run db:up         # Start PostgreSQL only
npm run db:down       # Stop PostgreSQL
npm run docker:up     # Start all services
npm run docker:down   # Stop all services
npm run docker:logs   # View logs
```

## Production Build

```bash
npm run build              # Build web app
npm run build:desktop      # Build web + Electron installer
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/staff/login` | Staff login |
| POST | `/api/auth/citizen/login` | Citizen login |
| POST | `/api/auth/citizen/register` | Citizen registration |
| GET | `/api/inquiries` | List inquiries |
| POST | `/api/inquiries` | Create inquiry |
| GET | `/api/activities` | List activities |
| GET | `/api/employees` | List employees |
| GET | `/api/records` | List records |
| GET | `/api/stats/dashboard` | Dashboard statistics |
