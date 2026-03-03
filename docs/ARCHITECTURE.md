# Architecture Overview

## High-Level Components
- Frontend: React + TypeScript + Vite
- Backend: Spring Boot (REST API)
- Database: PostgreSQL
- Deployment: Docker Compose for local environment

## Request Flow
1. User opens frontend UI.
2. Frontend sends auth request to `/api/auth/login`.
3. Backend validates user credentials against stored BCrypt hash.
4. Frontend transitions to dashboard on success.

## Current Auth Model
- Basic credential check endpoint.
- Seeded admin account (`admin`).
- Password stored as BCrypt hash.
- JWT/session model is planned but not yet implemented.

## Code Structure
- `frontend/src`: UI and API client
- `frontend/tests`: unit and integration tests
- `backend/src/main`: Spring Boot application code
- `backend/src/test`: unit and integration tests

## Quality Gates
- Frontend tests enforce 100% thresholds for configured coverage metrics.
- Backend uses JaCoCo coverage checks in Maven `verify`.
