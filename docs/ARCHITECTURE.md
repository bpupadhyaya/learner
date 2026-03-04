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
- JWT-based authentication with access and refresh tokens.
- Seeded admin account (`admin`).
- Password stored as BCrypt hash.
- Protected endpoints validated through `JwtAuthenticationFilter`.

## Code Structure
- `frontend/src`: UI and API client
- `frontend/tests`: unit and integration tests
- `backend/src/main`: Spring Boot application code
- `backend/src/test`: unit and integration tests

## Quality Gates
- Frontend unit and integration tests enforce separate 100% coverage thresholds.
- Backend unit and integration tests each have independent JaCoCo 100% gates.
- CI executes separate unit/integration jobs before container build validation.
