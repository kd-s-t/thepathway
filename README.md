# The Pathway

A simple Next.js app: a path from **1 to 999**. Numbers move the path to that spot.

## Run

```bash
npm run dev
```

Open [http://localhost:3025](http://localhost:3025).

Locally, records live in `data/records.json`. On Vercel, set `DATABASE_URL` from a Marketplace Postgres database (Neon). Records are stored in the `pathway_records` table and survive deploys.

## Add records

Use **Add record** in the UI (1-999). Locally you can also edit `data/records.json`:

```json
{
  "records": [456, 699]
}
```

The path rotates to the latest number. **Map history** shows the connected trail. **Prev** / **Next** steps through earlier records.
