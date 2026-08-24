# Database

This folder is reserved for database-related assets such as migrations, seed data, and Supabase SQL scripts. The Nest server connects to Supabase PostgreSQL through `DATABASE_URL` in `server/.env`.

## Schema

The initial migration lives in `server/src/database/migrations/`. It creates:

- `profiles` - public application profile keyed by the corresponding Supabase Auth user UUID.
- `posts` - one JSONB-backed journal entry per profile and calendar date.
- `comments` - nested comments through an optional parent comment.
- `comment_votes` - one upvote or downvote per user/comment pair.

Supabase Auth owns email addresses, password hashes, verification state, password resets, and OAuth identities; they are deliberately not duplicated in the public schema.

Run migrations from `server/` with `npm run migration:run`. Check their state with `npm run migration:show`.

Do not commit credentials. Copy `server/.env.example` to `server/.env` and replace the placeholder connection string with the value from your Supabase project.
