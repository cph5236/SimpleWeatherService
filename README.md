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

All scripts are run from inside `SWS-App/`.

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

## Mobile (Android) — Local Testing

The app is packaged for Android via [Capacitor](https://capacitorjs.com/). All commands run from `SWS_App/`.

### Prerequisites

- Node.js 22+
- [Android Studio](https://developer.android.com/studio) (installs the Android SDK and ADB)
- ADB on your PATH — add to `~/.bashrc` or `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

- USB Debugging enabled on your device: **Settings → About Phone → tap Build Number 7× → Developer Options → USB Debugging**

### Build and run on a connected device

```bash
cd SWS_App
npm install
npm run build:mobile
npx cap sync android
npx cap run android

-- Wireless ADB --
adb pair <ip>:<pairing-port>
# Enter the 6-digit code shown on screen

```

Capacitor will list connected devices and emulators. Select yours, or target directly:

```bash
npx cap run android --target <device-id>
# device-id comes from: adb devices
```

### Build a debug APK for sideloading

If you want an APK file to install manually (e.g. via `adb install` or file transfer):

```bash
cd SWS_App/android
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
adb install app/build/outputs/apk/debug/app-debug.apk
```

> **Note:** The CI pipeline produces a signed release AAB (Android App Bundle), which is the Play Store format. AABs cannot be sideloaded directly — use a debug APK for device testing.

### Open in Android Studio

```bash
npx cap open android
```

---

## CI/CD Pipelines

Three GitHub Actions workflows run automatically on push to `main`.

### CI (`.github/workflows/ci.yml`)

Runs on every push and pull request targeting `main`.

| Step | Command |
|---|---|
| Lint | `npm run lint:fix` + verifies no files changed |
| Typecheck | `npm run typecheck` |
| Test | `npm run test -- --run` (Vitest, no watch) |

All steps run inside `SWS_App/` with Node 22.

### Deploy to GitHub Pages (`.github/workflows/deploy.yml`)

Runs on push to `main`. Builds the web app and deploys it to GitHub Pages.

| Step | What it does |
|---|---|
| `npm run build` | Vite production build → `SWS_App/dist/` |
| Upload + deploy | Pushes `dist/` to the `github-pages` environment |

### Mobile Builds (`.github/workflows/mobile.yml`)

Runs on push to `main` and can be triggered manually via **workflow_dispatch**.

Produces signed release artifacts for both platforms:

**Android** (runs on `ubuntu-latest`):
- Builds the web app with `VITE_BUILD_TARGET=mobile`
- Syncs to Capacitor (`npx cap sync android`)
- Signs and builds a release AAB using a keystore stored in repository secrets
- Uploads `app-release.aab` as a build artifact

**iOS** (runs on `macos-latest`):
- Syncs to Capacitor (`npx cap sync ios`)
- Imports a signing certificate and provisioning profile from repository secrets
- Builds and exports a release IPA via `xcodebuild`
- Uploads `App.ipa` as a build artifact

**Required secrets** for mobile builds:

| Secret | Used by |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Android signing |
| `ANDROID_KEYSTORE_PASSWORD` | Android signing |
| `ANDROID_KEY_ALIAS` | Android signing |
| `ANDROID_KEY_PASSWORD` | Android signing |
| `IOS_CERTIFICATE_P12_BASE64` | iOS code signing |
| `IOS_CERTIFICATE_PASSWORD` | iOS code signing |
| `IOS_PROVISIONING_PROFILE_BASE64` | iOS provisioning |

---

## Non-Goals

social sharing, native mobile wrappers, ads, or upsell patterns. See [CLAUDE.md](CLAUDE.md) for the full project philosophy.
