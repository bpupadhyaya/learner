# Learning

Monorepo web app scaffold for broad AI feature expansion (ML, DL, RL, AGI, ASI).

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Java 21 + Spring Boot
- Database: PostgreSQL
- Containers: Docker Compose

## Initial Login
- Username: `admin`
- Password: `admin123`

Password is stored hashed with BCrypt in Postgres.
Login and logout are available in the UI.

## Monorepo Structure
- `frontend/`
  - `src/`
  - `tests/unit/`
  - `tests/integration/`
- `backend/`
  - `src/main/`
  - `src/test/unit/`
  - `src/test/integration/`

## Run with Docker Compose
```bash
docker compose up --build
```

## Test Commands
Frontend:
```bash
cd frontend
npm install
npm run test:unit
npm run test:integration
```

Backend (run via Dockerized Maven):
```bash
docker run --rm -v '/Users/bhimupadhyaya/coding_common/misc/learner/backend':/app -w /app maven:3.9-eclipse-temurin-21 mvn -B verify
```

## Endpoints
- Frontend: http://localhost:5175
- Backend API: http://localhost:8080
- Login API: `POST /api/auth/login`
