# mental-gym
Mindful living in the time of AI Slop

## Project structure

- `client/` — React + Vite + TypeScript frontend, with Chakra UI and React Query.
- `server/` — NestJS API, using TypeORM to connect to Supabase PostgreSQL.
- `database/` — future migrations, seed data, and Supabase SQL scripts.

## Run locally

1. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` to your Supabase PostgreSQL connection string.
2. In one terminal run `cd server && npm run start:dev`.
3. In another terminal run `cd client && npm run dev`.

The client runs on `http://localhost:5173`; requests to `/api` are proxied to the Nest server at `http://localhost:3000`.
