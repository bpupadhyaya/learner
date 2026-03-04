# Implemented Features Checklist

This checklist captures the delivered foundation capabilities so new contributors can quickly verify what is already available.

## 1. Auth and Security (JWT + Refresh + Role-Based Access)
- [x] Login endpoint with JWT access token issuance
- [x] Refresh endpoint for rotating access/refresh tokens
- [x] Logout endpoint that invalidates session refresh token usage
- [x] Seeded admin user with BCrypt-hashed password (`admin/admin123`)
- [x] Protected profile endpoint (`GET /api/auth/me`)
- [x] Authorization via `Bearer` token on protected endpoints
- [x] Role data carried in auth/session responses

## 2. Product Features (Dashboard Modules + Navigation + Profile)
- [x] Login screen and authenticated landing/dashboard flow
- [x] Dashboard navigation tabs (`Dashboard`, `Modules`, `Profile`)
- [x] Modules view with ML/DL/RL/AGI-oriented feature cards
- [x] Profile view showing authenticated user details
- [x] Logout action from dashboard

## 3. ML/AI Foundation (Model Registry + Training Jobs + Experiment Stubs)
- [x] Model registry APIs (`GET/POST /api/ml/models`)
- [x] Training job APIs (`GET/POST /api/ml/training-jobs`)
- [x] Experiment stub APIs (`GET/POST /api/ml/experiments`)
- [x] Validation and duplicate handling for key API paths
- [x] Protected ML APIs requiring authentication

## 4. Dev Quality (CI/CD + Strict Separate Coverage Gates)
- [x] Frontend unit test gate with strict 100% thresholds
- [x] Frontend integration test gate with strict 100% thresholds
- [x] Backend unit coverage gate (separate JaCoCo checks)
- [x] Backend integration coverage gate (separate JaCoCo checks)
- [x] CI workflow with independent unit/integration jobs per tier
- [x] Container build validation in CI
- [x] CD workflow to publish frontend/backend images to GHCR

## 5. UX/UI (Design System + Accessibility + Responsive Polish)
- [x] Design tokens for color/spacing/typography/radius/shadow
- [x] Reusable UI primitives (`btn`, `input-field`, nav variants)
- [x] Accessibility enhancements (skip link, landmarks, alerts, focus states)
- [x] Mobile responsive behavior for navigation/cards/layout
- [x] Preserved existing size/location behavior while improving visual system

## Validation References
- Frontend tests and coverage: `frontend/package.json` scripts `test:unit`, `test:integration`
- Backend tests and coverage: `backend/pom.xml` with separate unit/integration gates
- CI/CD workflows: `.github/workflows/ci.yml`, `.github/workflows/cd.yml`
