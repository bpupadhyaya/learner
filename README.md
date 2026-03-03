# Learning

Learning is an open-source full-stack foundation for AI-oriented products and research workflows, including ML, DL, RL, AGI, and broader intelligence systems.

The project is intentionally structured as a clean base so contributors can extend features safely with strong tests and clear engineering standards.

## Current Features
- React + TypeScript + Vite frontend
- Java 21 + Spring Boot backend
- PostgreSQL persistence
- Docker Compose local deployment
- Login flow with seeded admin user
- Logout flow on landing/dashboard page
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

Backend (Dockerized Maven):
```bash
docker run --rm -v "$PWD/backend":/app -w /app maven:3.9-eclipse-temurin-21 mvn -B verify
```

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
