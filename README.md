# Simple Weather Service

A no-bloat weather web app. Current conditions, hourly outlook, and a 10-day forecast — nothing else. No ads, no radar maps, no social features.

Built with React 19, TypeScript, Vite, and Bootstrap 5. Weather data comes from [Open-Meteo](https://open-meteo.com/) — free, no API key required.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
cd my-app
npm install
```

### Run locally

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) with hot module reload enabled.

---

## Available Scripts

All scripts are run from inside `my-app/`.

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | Build for production (output to `dist/`) |
| `npm run preview` | Serve the production build locally on port 5173 |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm test` | Run all tests with Vitest |
| `npm run lint` | Lint with ESLint |
| `npm run lint:fix` | Lint and auto-fix fixable issues |
| `npm run format` | Format source files with Prettier |

---

## Running Tests

Tests are written with [Vitest](https://vitest.dev/) and run in a jsdom environment.

```bash
cd my-app
npm test
```

To run tests in watch mode:

```bash
npm test -- --watch
```

### Test coverage

Tests live in `src/__tests__/` and cover:

| File | What it tests |
|---|---|
| `useUnits.test.ts` | Unit preference toggle and persistence |
| `useSavedLocations.test.ts` | Save/remove location logic |
| `weatherHelpers.test.ts` | Weather data formatting helpers |
| `geocode.test.ts` | Geocoding API service |
| `weather.test.ts` | Open-Meteo weather API service |

---

## Project Structure

```
my-app/
  src/
    components/       # Reusable UI components (SearchBar, UnitToggle, etc.)
    pages/            # Route-level views (HomePage)
    hooks/            # Custom React hooks (useWeather, useUnits, useSavedLocations)
    services/         # API clients for Open-Meteo geocoding and weather endpoints
    types/            # Shared TypeScript types
    __tests__/        # Unit tests
    App.tsx           # Root component with router setup
    main.tsx          # Entry point
```

---

## Tech Stack

- **React 19** — with React Compiler enabled (no manual memoization needed)
- **TypeScript** — strict typing throughout
- **Vite** — build tool and dev server
- **Bootstrap 5** — layout and utility classes, mobile-first
- **react-router-dom** — client-side routing
- **Open-Meteo** — free weather API, no key required
- **Vitest** — unit testing
- **ESLint + Prettier** — enforced via pre-commit hook

---

## Code Quality

A pre-commit git hook runs automatically before each commit:

1. `npm run lint:fix` — fixes linting issues
2. `npm run typecheck` — ensures no TypeScript errors

No Husky or additional tooling required — the hook lives at `.git/hooks/pre-commit`.

---

## Features

- Search for any city by name
- Current conditions: temperature, feels like, wind speed, humidity, weather condition
- 24-hour hourly forecast
- 10-day daily forecast
- Metric / imperial unit toggle
- Save and quickly switch between favourite locations
- GPS-based location (via browser geolocation API)

---

## Non-Goals

This app intentionally does not include radar maps, severe weather alerts, social sharing, native mobile wrappers, ads, or upsell patterns. See [CLAUDE.md](CLAUDE.md) for the full project philosophy.
