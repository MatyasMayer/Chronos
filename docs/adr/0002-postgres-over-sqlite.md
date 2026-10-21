# Chronos stores its data in Postgres, not SQLite

Chronos is a single-user, self-hosted app, which on its own points to SQLite: one file, no extra process, trivial backups, and FTS5 handles Czech diacritics as well as Postgres does. We chose Postgres anyway, because Chronos is also a learning and CV project and Postgres is the industry-default database. It also gives us `timestamptz`, `jsonb`, `pg_trgm` and concurrent writers for the background jobs (feed polling, link fetching, text extraction, push scheduling).

## Consequences

- Self-hosting is a Docker Compose file with two services (`app` and `postgres`) rather than one container with a data file; backups are a scheduled `pg_dump`.
- Search uses Postgres full-text search with the `simple` config + `unaccent`, indexed per PDF page or slide (each `tsvector` stays under 1 MB), plus `pg_trgm` for typo-tolerant titles. There is no Czech stemmer.
- Runtime-locked SQLite hosts such as Cloudflare D1 are no longer deploy targets.
