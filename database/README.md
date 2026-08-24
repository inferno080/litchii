# Database

This folder is reserved for database-related assets such as migrations, seed data, and Supabase SQL scripts. The Nest server connects to Supabase PostgreSQL through `DATABASE_URL` in `server/.env`.

Do not commit credentials. Copy `server/.env.example` to `server/.env` and replace the placeholder connection string with the value from your Supabase project.
