# Hostel360

A mini ERP for a small hostel. It covers rooms, guests and stays, finance (income, expenses including utility bills, profit), and maintenance.

| Part | Stack |
|------|-------|
| Backend | Java 21, Spring Boot 3, Spring Data JPA, Flyway, Spring Security (JWT) |
| Database | PostgreSQL 16 |
| Frontend | React 19, TypeScript, Vite, Mantine, TanStack Query |
| API client | Generated from the backend's OpenAPI spec with orval |

## Run everything with Docker

```bash
cp .env.example .env   # then change the passwords
docker compose up --build
```

Once it starts, open http://localhost:8081 and sign in with the credentials from `.env` (by default `admin` / `admin`).

Downloaded libraries are cached between builds, so rebuilds are quick. To save more time:
- rebuild only the side that changed: `docker compose up --build backend` (or `frontend`);
- when no code changed, skip the build: `docker compose up`.

## Develop locally

```bash
docker compose up -d db                  # database only
cd backend && mvn spring-boot:run        # API on :8080, docs at /swagger-ui.html
cd frontend && npm install && npm run dev  # UI on :5173, proxies /api to :8080
```

Tests use Testcontainers, so Docker has to be running: `cd backend && mvn verify`.

## Project layout

```
backend/src/main/java/com/hostel360/
  common/     shared base entity, errors, currency
  config/     security and OpenAPI
  auth/       login and JWT
  settings/   hostel name and EUR → RSD rate
  room/       rooms module (controller, dto, entity, repository)
  guest/      guests (name, country, note)
  stay/       bookings: rules in StayService (capacity, no double booking, check-in/out)
backend/src/main/resources/db/migration/   Flyway SQL migrations

frontend/src/
  api/        http.ts (axios + auth) and generated.ts (do not edit)
  app/        layout, router, theme, navigation
  shared/     reusable UI and helpers
  features/   one folder per module
```

## Adding a module

1. Backend: create a new package with the entity, a DTO with `Request` and `Response` records, the repository and the controller, plus a Flyway migration `V<n>__<name>.sql`.
2. Regenerate the client while the backend is running: `cd frontend && npm run api:spec && npm run api`.
3. Frontend: add `features/<module>/`, register the route in `app/router.tsx`, and set `ready: true` in `app/nav.ts`.

## Conventions

- Amounts are stored in EUR, the base currency. Records entered in RSD also store the exchange rate that applied when they were saved.
- Rooms have a number, name, floor (1 or 2), capacity (1 or 2), a long-term flag, and a status: available, needs cleaning, or taken. Check-in sets a room to taken and check-out to needs cleaning; it can also be changed by hand.
- Every API error is returned as `application/problem+json`.
- A stay covers the dates [checkIn, checkOut): the departure day is free for the next guest. Long-term stays use whole months (checkIn = 1st of the first month, checkOut = 1st of the month after the last) and may have no checkOut (indefinite).
- Booking.com commission is not stored on stays; Finance will calculate it.
