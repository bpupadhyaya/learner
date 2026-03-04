# Testing Strategy

## Goals
- Prevent regressions with fast feedback.
- Validate behavior at unit and integration levels.
- Keep quality visible and enforceable through coverage thresholds.

## Frontend
- Unit tests: component and API client behavior.
- Integration tests: full login/logout interaction paths.
- Commands (strict separate gates):
  - `cd frontend && npm run test:unit`
  - `cd frontend && npm run test:integration`

## Backend
- Unit tests: service/controller/config and model behavior.
- Integration tests: Spring context + API contract validation.
- Commands (strict separate gates):
  - `docker run --rm -v "$PWD":/workspace -w /workspace/backend maven:3.9-eclipse-temurin-25 mvn -B -Dskip.integration.tests=true test`
  - `docker run --rm -v "$PWD":/workspace -w /workspace/backend maven:3.9-eclipse-temurin-25 mvn -B -Dskip.unit.tests=true verify`

## Coverage Expectations
- Frontend unit and integration commands each enforce 100% for lines, branches, statements, and functions.
- Backend unit gate enforces 100% for instruction, branch, line, complexity, method, and class coverage.
- Backend integration gate independently enforces 100% for instruction, branch, line, complexity, method, and class coverage on integration scope.
- CI runs unit/integration gates as separate jobs for frontend and backend.
