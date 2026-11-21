# The Pathway

A simple Next.js app: a path from **1 to 999**. Numbers in `data/records.json` move the path to that spot.

## Run

```bash
npm run dev
```

Open [http://localhost:3025](http://localhost:3025).

## Add records

Use **Add record** in the UI (1-999), or edit `data/records.json`:

```json
{
  "records": [456, 699]
}
```

The path rotates to the latest number. **Map history** shows the connected trail. **Prev** / **Next** steps through earlier records.
