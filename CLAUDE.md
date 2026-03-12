# Simple Weather Service — CLAUDE.md

## Project Overview

**Simple Weather Service** is a no-bloat weather app. The goal is to give users the weather — just the weather — without ads, upsells, radar maps, social features, or any of the noise found in popular weather apps.

This is a **web-first application** targeting both desktop and mobile browsers, with PWA installability as a future goal. It prioritizes clarity, speed, and a clean UI over feature breadth.

---

## Tech Stack

### Frontend

- **React 19** with React Compiler enabled
- **TypeScript**
- **Vite** (build tool & dev server)
- **Bootstrap 5** for layout and utility classes
- **react-router-dom** for navigation

### Weather API

- **Open-Meteo** — free, no API key required
- Base URL: `https://api.open-meteo.com/v1/`
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`

---

## Project Structure

The React app lives inside `my-app/`:

```
my-app/
  src/
    components/     → reusable UI components
    pages/          → route-level views
    hooks/          → custom React hooks
    services/       → API calls (Open-Meteo)
    styles/         → global styles
    App.tsx         → root component
    main.tsx        → entry point
```

---

## Dev Setup

```bash
cd my-app
npm install
npm run dev
```

The dev server runs via Vite with hot module reload.

---

## Feature Scope

Keep it simple. The app does these things:

- Display current weather conditions (temp, feels like, wind, humidity, condition)
- Show a short-term forecast (hourly or daily)
- Location lookup by city name or GPS coordinates
- Unit toggle (metric / imperial)

That's it. Do not add features beyond this scope without explicit direction.

---

## Coding Standards

### React

- Functional components only
- Use hooks for state and side effects
- Let React Compiler handle memoization — do not manually memoize unless profiling proves a need

### TypeScript

- Explicit types for public interfaces and function signatures
- No `any`
- Use `interface` for component props

### State Management

- React state and hooks only
- Do not introduce Zustand, Redux, or any global state library unless complexity clearly demands it

---

## Styling Guidelines

- Bootstrap utility classes first — avoid custom CSS unless unavoidable
- Mobile-first responsive design
- Consistent spacing via Bootstrap spacing utilities
- Keep the UI minimal: weather data, clear hierarchy, nothing extra

---

## Agent Instructions

When modifying this project:

1. Keep the UI minimal. If a feature doesn't serve the core weather use case, don't add it.
2. No ads, banners, rating prompts, social sharing, or upsell patterns — ever.
3. Preserve the Vite + React 19 + TypeScript architecture.
4. Do not introduce heavy dependencies without clear justification.
5. Prefer incremental, focused changes.
6. Assume portfolio-quality code standards.

---

## Non-Goals

- Radar or satellite maps
- Severe weather alerts (unless explicitly added later)
- Social or sharing features
- Native mobile frameworks (Flutter, React Native, MAUI)
- Server-side rendering frameworks
- Paid API tiers or API key management complexity
- Anything that resembles a traditional bloated weather app

---

## PWA Direction (Planned)

The app is intended to become installable as a Progressive Web App:

- Offline capability (cache last fetched weather)
- Mobile home screen install support
- App-like experience without a native shell

---

## Future Expansion

Possible additions (do not implement speculatively):

- Saved locations / favorites
- Push notifications for weather alerts
- Backend proxy if Open-Meteo rate limits become a concern
- Deployment via Vercel or Netlify

---

## Summary

Simple Weather Service is a React 19 + TypeScript + Vite web app that shows the weather and nothing else. Open-Meteo provides weather data for free with no API key. Bootstrap 5 handles layout. The app is designed to be fast, clean, and installable as a PWA.
