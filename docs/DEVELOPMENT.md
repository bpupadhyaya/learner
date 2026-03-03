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
- `docker run --rm -v "$PWD/backend":/app -w /app maven:3.9-eclipse-temurin-21 mvn -B verify`

## Common Tasks
- Rebuild clean: `docker compose down -v && docker compose build --no-cache && docker compose up -d`
- Stop stack: `docker compose down`
