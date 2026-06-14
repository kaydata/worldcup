# Project: KayMetrics — World Cup Dashboard

## What This Is
An interactive public dashboard displaying World Cup football statistics.
Part of the KayMetrics portfolio (kaymetrics.com).
This is the World Cup dashboard — one of several dashboards that will live under the KayMetrics umbrella.

## Stack
- React + Vite
- Recharts for all charts and visualisations
- React Router for navigation
- CSS Modules for styling
- Data from football-data.org free API

## Folder Structure
src/
├── components/    ← small, reusable UI elements (buttons, cards, loaders)
├── pages/         ← one file per dashboard view
├── services/      ← all API calls live here, nowhere else
├── hooks/         ← custom React hooks
├── data/          ← static JSON fallbacks if API is unavailable
└── styles/        ← global CSS and variables

## Design Rules
- Primary colour: [#1446a0]
- Accent colour: [#ffcf00]
- Font: Inter via Google Fonts
- Dark mode by default
- Cards: rounded corners (8px), subtle shadow, consistent padding
- Mobile responsive — design mobile first, scale up
- No inline styles under any circumstances
- All spacing and colours via CSS variables defined in styles/variables.css

## Goals
- Public-facing portfolio piece — must look polished at all times
- Mobile responsive
- Fast load times — no unnecessary dependencies
- Visually clean, data-first layout

## Interactivity (World Cup Dashboard)
- Filter by group to see group standings update
- Toggle between goals scored and goals conceded
- Click on a team card to expand and see their match results
- All interactions should feel instant — no full page reloads

## Rules for Claude
- Use functional components and hooks only — no class components
- Keep components small and single-purpose
- All API calls must live in /services — never call APIs inside components directly
- Always comment complex logic
- Free APIs only unless explicitly told otherwise
- Never hardcode colours or spacing — use CSS variables
- Every data fetch must have a loading state and an error fallback
- If the API is unavailable, fall back to static data in /data folder
- Do not install new dependencies without flagging it first

## API Notes
- Data source: football-data.org free tier
- API key stored in .env file as VITE_FOOTBALL_API_KEY
- Never expose the API key in component files
- Rate limit awareness: cache responses where possible, do not fetch on every render

## Current Status
- [ ] Home page scaffolded
- [ ] World Cup dashboard — in progress
- [ ] Deployed to Vercel