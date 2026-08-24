# Server Setup

Steps to set up this server from scratch.

## 1. Initialize Node

```bash
npm init -y
```

## 2. Install dependencies

Dependencies:

```bash
npm install @prisma/client
```

Dev dependencies:

```bash
npm install -D typescript ts-node @types/node prisma dotenv
```

> `ts-node@10.9.2` is built against TypeScript's older compiler API and breaks with `typescript@7.x` (`TypeError: Cannot read properties of undefined (reading 'fileExists')`). Pin `typescript` to a 5.x release, e.g. `npm install -D typescript@^5.9.0`.

## 3. Add tsconfig.json

```bash
npx tsc --init
```

## 4. Modify tsconfig.json

Update the generated file with:

- `rootDir`: `.`
- `outDir`: `./dist`
- `module`: `nodenext`
- `target`: `esnext`
- `types`: `["node"]`
- `strict`: `true`
- `skipLibCheck`: `true`
- `moduleDetection`: `force`

Add an `include` array so TypeScript checking covers non-`.ts` files too:

```json
"include": ["src/**/*", "src/data/**/*.json", "prisma/**/*"]
```

## 5. Initialize Prisma

```bash
npx prisma init
```

This creates `prisma/schema.prisma` and a `.env` file. Set `DATABASE_URL` in `.env` to your PostgreSQL connection string.

In the `generator client` block, use `provider = "prisma-client-js"` (not the newer `"prisma-client"` provider) — the latter emits ESM-only output and fails at runtime (`ReferenceError: exports is not defined in ES module scope`) in a CommonJS/`ts-node` project like this one. With a custom `output` path (e.g. `output = "../generated/prisma"`), import the client from that same path in application code, not from `@prisma/client`:

```ts
import { PrismaClient } from "../generated/prisma";
```

## 6. Create and run seed.ts

Create `prisma/seed.ts` to clear existing data and load fixtures from `prisma/seedData/*.json` in dependency order (`team`, `project`, `projectTeam`, `user`, `task`, `attachment`, `comment`, `taskAssignment`) using `PrismaClient`.

Deletion must happen in the **reverse** of that order (children before parents), otherwise a `RESTRICT` foreign key blocks deleting a still-referenced row (e.g. `update or delete on table "Team" violates RESTRICT setting of foreign key constraint`):

```ts
await deleteAllData([...orderedFileNames].reverse());
```

Register the seed command as an npm script in `package.json`:

```json
"scripts": {
  "seed": "ts-node prisma/seed.ts"
}
```

Run it:

```bash
npm run seed
```

> Field names in the seed JSON must match the schema exactly (e.g. `Team.productOwnerUserId`, `Task.dueDate`) — a mismatch throws `PrismaClientValidationError: Unknown argument`.
>
> Since `deleteAllData` clears rows but doesn't reset autoincrement sequences, IDs drift upward after repeated seed runs, which can desync from hardcoded foreign keys in the fixtures (e.g. `authorUserId: 1`) and cause `Foreign key constraint violated` errors. If that happens, reset the database instead of just re-seeding:
>
> ```bash
> npx prisma migrate reset -f
> npm run seed
> ```

## 7. Add models to schema.prisma

Define the models in `prisma/schema.prisma`:

- `User`
- `Team`
- `Project`
- `ProjectTeam`
- `Task`
- `TaskAssignment`
- `Attachment`
- `Comment`

Then generate the client and push/migrate the schema:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 8. Fixing "Unique constraint failed on the fields: (`id`)" on insert

If `prisma.<model>.create()` fails with a unique constraint error on `id` even though the table looks empty of that ID, it's a Postgres sequence desync: the seed fixtures insert rows with **explicit** `id` values (e.g. `id: 1` through `id: 10`), but explicit inserts don't advance Postgres's auto-increment sequence for that column. The sequence is still sitting at `1`, so the next `create()` without an explicit `id` tries to insert `id: 1` again and collides with the existing row.

Fix by syncing the sequence to the actual max `id` in the table:

```sql
SELECT setval(pg_get_serial_sequence('"Project"', 'id'), coalesce(max(id)+1, 1), false) FROM "Project";
```

Run the equivalent for any other model hit by the same issue, substituting the table name (e.g. `"Task"`, `"User"`).

## 9. ecosystem.config.js

[`ecosystem.config.js`](./ecosystem.config.js) is a [PM2](https://pm2.keymetrics.io/) process manager config. It defines one app, `project-management`, which PM2 runs via `npm run dev` with `NODE_ENV=development`.

Start it with PM2 instead of running `npm run dev` directly:

```bash
npx pm2 start ecosystem.config.js
```

Useful PM2 commands once it's running:

```bash
npx pm2 list        # show running processes
npx pm2 logs        # tail logs
npx pm2 restart project-management
npx pm2 stop project-management
```
