# Contributing to Learning

Thank you for contributing to Learning.

## Before You Start
- Read the [Code of Conduct](CODE_OF_CONDUCT.md).
- Check open issues and pull requests before starting new work.
- For larger changes, open an issue first to align on approach.

## Development Setup
1. Fork and clone the repository.
2. Create a feature branch from `main`.
3. Start the stack:
   - `docker compose up --build`
4. Run tests:
   - Frontend unit: `cd frontend && npm run test:unit`
   - Frontend integration: `cd frontend && npm run test:integration`
   - Backend verify: `docker run --rm -v "$PWD/backend":/app -w /app maven:3.9-eclipse-temurin-25 mvn -B verify`

## Branch and Commit Guidance
- Keep each pull request focused on one change.
- Use clear commit messages.
- Suggested format:
  - `feat: add xyz`
  - `fix: resolve abc`
  - `docs: update contribution guide`

## Pull Request Checklist
- [ ] Scope is focused and minimal.
- [ ] Tests added or updated.
- [ ] Local tests pass.
- [ ] Documentation updated when behavior changes.
- [ ] No generated artifacts committed (`node_modules`, coverage reports, build outputs).

## Testing Expectations
- Do not reduce test coverage.
- New logic should include both positive and negative path tests.
- If changing auth/security behavior, include integration tests.

## Review Process
- Maintainers review for correctness, test quality, and long-term maintainability.
- You may be asked to split or simplify large pull requests.
- Once approved and checks pass, a maintainer merges.

## Reporting Security Issues
Do not open public issues for vulnerabilities. Use [SECURITY.md](SECURITY.md).
