# Learning

Learning is an open-source full-stack foundation for AI-oriented products and research workflows, including ML, DL, RL, AGI, and broader intelligence systems.

The project is intentionally structured as a clean base so contributors can extend features safely with strong tests and clear engineering standards.

## Current Features
- React + TypeScript + Vite frontend
- Java 25 + Spring Boot backend
- PostgreSQL persistence
- Docker Compose local deployment
- JWT-based login flow with seeded admin user
- Access token + refresh token support
- Authenticated profile endpoint (`/api/auth/me`)
- Logout flow on landing/dashboard page
- In-app navigation for `Dashboard`, `Modules`, and `Profile` sections
- Product-ready module view for ML/DL/RL/AGI feature expansion
- ML/AI foundation APIs:
  - Model registry
  - Training job submission stubs
  - Experiment stubs
- Unit + integration test structure for frontend and backend

## Quick Start
```bash
docker compose up --build
```

Open:
- Frontend: `http://localhost:5175`
- Backend: `http://localhost:8080`
- Backend health check: `http://localhost:8080/api/system/health`

Initial credentials:
- Username: `admin`
- Password: `admin123`

Note: Passwords are stored as BCrypt hashes.

Auth endpoints:
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me` (requires `Authorization: Bearer <accessToken>`)

ML foundation endpoints (require `Authorization: Bearer <accessToken>`):
- `GET /api/ml/models`
- `POST /api/ml/models`
- `GET /api/ml/training-jobs`
- `POST /api/ml/training-jobs`
- `GET /api/ml/experiments`
- `POST /api/ml/experiments`

## Project Structure
- `frontend/`: React app, API client, tests
- `backend/`: Spring Boot API, auth/domain logic, tests
- `docs/`: architecture, development, roadmap, release process
- `.github/`: issue templates, pull request template, code owners

## Local Testing
Frontend:
```bash
cd frontend
npm install
npm run test:unit
npm run test:integration
```

Backend unit gate (Dockerized Maven):
```bash
docker run --rm -v "$PWD":/workspace -w /workspace/backend maven:3.9-eclipse-temurin-25 mvn -B -Dskip.integration.tests=true test
```

Backend integration gate (Dockerized Maven):
```bash
docker run --rm -v "$PWD":/workspace -w /workspace/backend maven:3.9-eclipse-temurin-25 mvn -B -Dskip.unit.tests=true verify
```

## CI/CD
- CI workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
  - Frontend unit coverage gate
  - Frontend integration coverage gate
  - Backend unit coverage gate
  - Backend integration coverage gate
  - Container build validation
- CD workflow: [`.github/workflows/cd.yml`](.github/workflows/cd.yml)
  - Builds and publishes backend/frontend images to GHCR on `main`

## Open Source Docs
- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Governance](GOVERNANCE.md)
- [Maintainers](MAINTAINERS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Testing Strategy](docs/TESTING.md)
- [Implemented Features Checklist](docs/IMPLEMENTED_FEATURES_CHECKLIST.md)
- [Roadmap](docs/ROADMAP.md)
- [Release Process](docs/RELEASE.md)
- [Changelog](CHANGELOG.md)

## How to Contribute
1. Open or pick an issue.
2. Create a focused branch from `main`.
3. Add tests with your change.
4. Open a pull request using the template.

## License
This project is licensed under the MIT License. See [LICENSE](LICENSE).
