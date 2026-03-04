# Development Guide

## Prerequisites
- Docker + Docker Compose
- Node.js 20+ (for local frontend test commands)

## Local Run
- `docker compose up --build`
- Frontend: `http://localhost:5175`
- Backend: `http://localhost:8080`

## Test Commands
Frontend:
- `cd frontend && npm install`
- `npm run test:unit`
- `npm run test:integration`

Backend:
- Unit: `docker run --rm -v "$PWD":/workspace -w /workspace/backend maven:3.9-eclipse-temurin-25 mvn -B -Dskip.integration.tests=true test`
- Integration: `docker run --rm -v "$PWD":/workspace -w /workspace/backend maven:3.9-eclipse-temurin-25 mvn -B -Dskip.unit.tests=true verify`

## CI/CD
- CI: `.github/workflows/ci.yml`
  - Runs frontend unit/integration gates separately
  - Runs backend unit/integration gates separately
  - Validates container builds after all test gates pass
- CD: `.github/workflows/cd.yml`
  - On `main`, publishes backend/frontend images to GHCR

## Common Tasks
- Rebuild clean: `docker compose down -v && docker compose build --no-cache && docker compose up -d`
- Stop stack: `docker compose down`
