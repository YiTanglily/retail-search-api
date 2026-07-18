# Retail Semantic Search API

A backend API for retail product search — currently a REST API over PostgreSQL, being extended with semantic ("search by meaning") capabilities.

The goal: let shoppers search by intent, not exact keywords. Someone searching _"shoes for standing all day"_ should find a product titled _"lightweight cushioned sneakers"_, even though the words don't match.

## Status

Phase 0 complete — product data model and REST API connected to a cloud PostgreSQL database.

## Tech stack

- **Node.js** + **Express** — REST API
- **PostgreSQL** (hosted on Neon) — data storage
- **pg** — database client, using raw SQL (no ORM, by choice, to build database fundamentals)
- **dotenv** — environment variables for secrets

## API endpoints

| Method | Endpoint        | Description                |
| ------ | --------------- | -------------------------- |
| GET    | `/products`     | Get all products           |
| GET    | `/products/:id` | Get a single product by id |
| POST   | `/products`     | Add a new product          |

## Notes on implementation

- Queries with user input use **parameterized queries** (`$1`, `$2`) to prevent SQL injection.
- Database credentials are kept in `.env` and never committed — the code reads them via `process.env`.
- Connections are managed through a **pg connection pool** rather than opening a new connection per query.

## Running locally

```bash
npm install
```

Create a `.env` file in the project root:

```
DATABASE_URL="your-postgres-connection-string"
```

Then start the server:

```bash
node index.js
```

The API runs at `http://localhost:3000`.

## Roadmap

- [x] Phase 0 — product data model + REST API
- [ ] Phase 1 — semantic search with embeddings and pgvector
- [ ] Phase 2 — async embedding generation via a job queue (Redis / BullMQ)
- [ ] Phase 3 — caching and rate limiting
- [ ] Phase 4 — deployment
