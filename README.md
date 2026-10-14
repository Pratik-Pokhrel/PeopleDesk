# PeopleDesk

An HR management system with Employee Management, Attendance and Leave Management modules, plus JWT login with three roles (`ADMIN`, `MANAGER`, `EMPLOYEE`). The backend is Node.js + Express with PostgreSQL and Prisma, and the frontend is React + Vite.

This README covers how to set up and run the project. 

## Contents

1. [Project structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Setup](#setup)
4. [Running the project](#running-the-project)
5. [Seeded accounts](#seeded-accounts)
6. [Stopping and resetting](#stopping-and-resetting)
7. [Troubleshooting](#troubleshooting)

---

## Project structure

```
peopledesk/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       database models
│   │   ├── migrations/         committed SQL migrations
│   │   └── seed.js             demo users, leave types, balances
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           login and register
│   │   │   ├── employees/      core module
│   │   │   ├── attendance/
│   │   │   └── leave/
│   │   ├── middleware/         auth, roles, validation, error handler
│   │   ├── utils/              AppError, JWT helpers
│   │   ├── config/             env validation, Prisma client
|   |   ├── tests/              test files, Vitest
│   │   ├── app.js              builds the Express app
│   │   └── server.js           connects the DB and starts listening
|   |
│   ├── .env                    required credentials for running backend
│   └── package.json
├── frontend/
│   ├── src/                    pages, components, auth context, API client
│   └── package.json
├── docker-compose.yml          PostgreSQL and Adminer
└── README.md
```

Each backend module has the same files: routes, controller, service, repository, validation, and an `index.js` that exports only the service. Requests flow `routes -> controller -> service -> repository -> database`.

---

## Prerequisites

| Tool           | Version                             | Check with         |
| -------------- | ----------------------------------- | ------------------ |
| Node.js        | 20.11 or newer (22 recommended)     | `node -v`          |
| npm            | comes with Node                     | `npm -v`           |
| Docker Desktop | any recent version, must be running | `docker --version` |
| Git            | any                                 | `git --version`    |

Commands below are for **Windows PowerShell**. On macOS or Linux, the only difference is `cp` instead of `Copy-Item`.

---

## Setup

### 1. Clone the repository

```powershell
git clone <YOUR_REPO_URL> peopledesk
cd peopledesk
```

### 2. Start the database

Run this from the repo root, where `docker-compose.yml` lives:

```powershell
docker compose up -d
docker compose ps
```

The Postgres container should show as running. Adminer, a small web UI for the database, starts alongside it. Open `http://localhost:8080` and sign in with the credentials written in `docker-compose.yml`.

### 3. Configure the backend

The backend reads `backend/.env`, which is gitignored. Create it from the example:

```powershell
cd backend
Copy-Item .env.example .env
```

Then open `backend/.env` and replace every placeholder:

```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# User, password and database name must match docker-compose.yml exactly
DATABASE_URL=postgresql://<db_user>:<db_password>@localhost:5432/<db_name>

# Any random string of 16 or more characters
JWT_SECRET=change-me-to-something-long-and-random
JWT_EXPIRES_IN=1d
```

Two values are easy to get wrong:

- `DATABASE_URL` must use the same user, password and database name as `docker-compose.yml`.
- `JWT_SECRET` must be at least 16 characters, or the server refuses to start.

### 4. Install dependencies, migrate and seed

Still inside `backend/`:

```powershell
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

| Command                     | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `npm install`               | Installs backend dependencies                           |
| `npx prisma generate`       | Builds the Prisma client from `schema.prisma`           |
| `npx prisma migrate deploy` | Applies the committed migrations and creates all tables |
| `npm run db:seed`           | Creates demo users, leave types and leave balances      |

The seed can be run again safely. It uses upserts, so nothing is duplicated.

### 5. Install frontend dependencies

Open a second PowerShell window at the repo root:

```powershell
cd frontend
npm install
```

The frontend calls the API at `http://<current-host>:4000/api` by default. Only if your backend uses a different port or host, create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:<port>/api
```

---

## Running the project

You need two terminals, one for each side.

**Terminal 1, backend** (from `backend/`):

```powershell
npm run dev
```

Expected output: `Connected to DB`, then `API running on http://localhost:4000`.

Check it from any other window:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

This should return `status: ok` and `database: up`.

**Terminal 2, frontend** (from `frontend/`):

```powershell
npm run dev
```

Open `http://localhost:5173` and sign in with one of the accounts below.

---

## Seeded accounts

All seeded accounts use the password **`321@drowssap`**.

| Role     | Email                     | Notes                             |
| -------- | ------------------------- | --------------------------------- |
| Admin    | `admin@peopledesk.test`   | Full access                       |
| Admin    | `admin2@peopledesk.test`  | Second admin                      |
| Manager  | `manager@peopledesk.test` | Manages the three employees below |
| Employee | `alice@peopledesk.test`   | Reports to the manager            |
| Employee | `bob@peopledesk.test`     | Reports to the manager            |
| Employee | `carol@peopledesk.test`   | Reports to the manager            |

Each user starts with Annual (18 days), Sick (12 days) and Casual (6 days) leave for the current year.

A quick way to see the app working end to end: sign in as Alice, submit a leave request, then sign in as the manager and approve it from the Approvals page.

---

## Stopping and resetting

```powershell
# Stop the containers, keep the data (run from the repo root)
docker compose down

# Stop the containers and delete all database data (full reset)
docker compose down -v
```

After a full reset, run `docker compose up -d`, then `npx prisma migrate deploy` and `npm run db:seed` from `backend/`.

---

## Troubleshooting

| Problem                                                           | Likely cause                                                                                                     | Fix                                                                                                                                           |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker compose up` cannot connect to the Docker daemon           | Docker Desktop is not running                                                                                    | Start Docker Desktop, wait until it reports running, retry                                                                                    |
| `port is already allocated` for 5432 or 8080                      | Another Postgres or service already uses that port                                                               | Stop it, or change the left side of the port mapping in `docker-compose.yml` (for example `5433:5432`) and use the new port in `DATABASE_URL` |
| Prisma `P1000: Authentication failed`                             | `DATABASE_URL` does not match `docker-compose.yml`, or the volume was created earlier with different credentials | Fix the URL. If you changed credentials after the first start, run `docker compose down -v`, then `docker compose up -d`                      |
| Prisma `P1001: Can't reach database server`                       | Container not ready yet, or wrong port in the URL                                                                | Check `docker compose ps`, wait a few seconds, confirm the port                                                                               |
| Server exits with `Invalid environment variables`                 | `backend/.env` is missing or a value is invalid, such as a short `JWT_SECRET`                                    | The message names the variable. Fix it in `backend/.env`                                                                                      |
| Prisma client error such as `Cannot find module '.prisma/client'` | The client was never generated                                                                                   | Run `npx prisma generate` in `backend/`                                                                                                       |
| Seed fails with "table does not exist"                            | Migrations were not applied                                                                                      | Run `npx prisma migrate deploy`, then `npm run db:seed`                                                                                       |
| Login page shows a network error, or the console mentions CORS    | Backend is not running, or the frontend is not on port 5173                                                      | Start the backend. If Vite picked another port, set `CORS_ORIGIN` in `backend/.env` to match and restart the backend                          |
| `EADDRINUSE: address already in use :::4000`                      | Something else uses the backend port                                                                             | Change `PORT` in `backend/.env` and set `VITE_API_URL` in `frontend/.env` to match                                                            |
| `import.meta.dirname` is undefined                                | Node.js is too old                                                                                               | Upgrade to Node 20.11 or newer                                                                                                                |
| PowerShell blocks `npm` with a script execution error             | Windows execution policy                                                                                         | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use `npm.cmd` instead of `npm`                                                  |
