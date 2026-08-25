## Project overview

A project-management app (Jira/Asana-style: projects, tasks, teams, users, boards) split into two independent npm projects:

- `client/` — Next.js 16 (App Router) + React 19 + TypeScript frontend
- `server/` — Express 5 + TypeScript + Prisma/PostgreSQL API

There is no root-level package.json or workspace config — each side is developed and run independently from within its own directory.

## Commands

### client/

```bash
npm install
npm run dev      # next dev, http://localhost:3000
npm run build    # next build
npm run start    # next start
npm run lint     # eslint
npx prettier --write .   # format (auto-sorts Tailwind classes via prettier-plugin-tailwindcss)
```

No test suite is configured for the client.

### server/

```bash
npm install
npm run dev      # tsc build + tsc -w + nodemon ts-node src/index.ts (concurrently)
npm run build    # rimraf dist && tsc
npm run seed     # ts-node prisma/seed.ts — clears and reloads fixtures from prisma/seedData/*.json

npx prisma generate                # regenerate client into server/generated/prisma
npx prisma migrate dev --name X    # create/apply a migration
npx prisma migrate reset -f        # drop and recreate the dev DB, then re-seed manually
```

Prefer running the server through PM2 rather than `npm run dev` directly, using the included config:

```bash
pm2 start ecosystem.config.js
npx pm2 logs
npx pm2 restart project-management
```

No test suite is configured for the server (`npm test` is a stub).

## Architecture

### Server (`server/src`)

Standard Express layering: `routes/*Routes.ts` → `controllers/*Controller.ts` → Prisma. Each resource (`project`, `task`, `search`, `user`, `team`) has one route file and one controller file, wired up in [server/src/index.ts](server/src/index.ts). There is no service or repository layer — controllers call the Prisma client directly.

**Prisma client import path is non-standard**: the schema uses a custom `output` (`server/prisma/schema.prisma` → `../generated/prisma`), so application code must import from `server/generated/prisma`, not from `@prisma/client`. This is a generated directory, not source — don't hand-edit it.

**Data model** ([server/prisma/schema.prisma](server/prisma/schema.prisma)): `User`, `Team`, `Project`, `ProjectTeam` (join table), `Task`, `TaskAssignment`, `Attachment`, `Comment`. A `Task` has both a single `authorUserId`/`assignedUserId` (direct FK, one assignee) and a many-to-many `TaskAssignment` join table — check which one a given feature should use before assuming.

Seeding order matters: fixtures in `server/prisma/seedData/*.json` must be inserted in FK dependency order (`team`, `project`, `projectTeam`, `user`, `task`, `attachment`, `comment`, `taskAssignment`) and deleted in the reverse order, or Postgres `RESTRICT` constraints/`Foreign key constraint violated` errors result. See [server/README.md](server/README.md) for the full set of Prisma/seeding gotchas (sequence desync after explicit-ID inserts, `ts-node`/`typescript` version pinning, etc.) before debugging these from scratch.

Server listens on `process.env.PORT` (default 3000) bound to `0.0.0.0`.

### Client (`client/src`)

Next.js App Router under [client/src/app](client/src/app). Route groups: `projects/[id]` (project detail with Board/List/Table/Timeline sub-views), `priority/{urgent,high,medium,low,backlog}` (each a thin wrapper around `priority/reusablePriorityPage`), plus `home`, `search`, `settings`, `teams`, `users`, `timeline`.

**State** is Redux Toolkit, set up in [client/src/app/redux.tsx](client/src/app/redux.tsx):
- `global` slice ([client/src/state/index.ts](client/src/state/index.ts)) holds only UI state (`isSidebarCollapsed`, `isDarkMode`) and is the only slice persisted (via `redux-persist`, `localStorage` on the client / no-op storage on the server to avoid SSR errors).
- All server data access goes through one RTK Query API ([client/src/state/api.ts](client/src/state/api.ts)), `createApi` with `fetchBaseQuery({baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL})`. Add new endpoints here rather than calling `axios`/`fetch` ad hoc from components. Tag types: `Projects`, `Tasks`, `Search`, `Users`, `Teams` — mutations invalidate the relevant tag(s); `updateTaskStatus` invalidates only the one changed task by id rather than the whole `Tasks` list, follow that pattern for other per-item updates.
- Use the typed `useAppDispatch`/`useAppSelector` hooks from `redux.tsx`, not the raw `react-redux` ones.
- `StoreProvider` (mounted in `dashboardWrapper.tsx`, itself rendered from `layout.tsx`) creates the store once via `useRef` and wraps children in `Provider` + `PersistGate`.

**Dark mode** is driven by the `dark` class toggled on `<html>` in `dashboardWrapper.tsx` based on `isDarkMode`. Tailwind v4 configures dark mode via a CSS `@custom-variant dark (&:where(.dark, .dark *))` in [client/src/app/globals.css](client/src/app/globals.css), not `tailwind.config.js` — there is no `tailwind.config.js` in this project. Custom design tokens (gradients, gray/blue palette, dark-mode colors) are also defined in that file's `@theme` block.

## Deployment

The server is deployed to a single EC2 instance under PM2 (see [aws_ec2_instruction_file.md](aws_ec2_instruction_file.md) and [rds_setup.md](rds_setup.md) for the full setup: nvm/Node install, RDS Postgres provisioning, `.env` with `PORT=80`, pm2 ecosystem config). There's no CI/CD pipeline — deployment is manual via SSH/EC2 Instance Connect.

`pm_ec2-secret-key.pem` in the repo root is the EC2 SSH key — it's gitignored but present locally; never print its contents or commit it.
