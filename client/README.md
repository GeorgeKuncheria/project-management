This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Install dependencies

Run `npm install` to pull in everything already listed in [package.json](package.json). No extra packages are required beyond what's declared there:

**Runtime dependencies**

- `next`, `react`, `react-dom` — core framework
- `@reduxjs/toolkit`, `react-redux`, `redux-persist` — global state + API layer
- `axios` — HTTP client
- `@mui/material`, `@mui/x-data-grid`, `@emotion/react`, `@emotion/styled` — UI components (MUI needs the Emotion packages as peer deps)
- `recharts` — charts
- `gantt-task-react` — Gantt chart view
- `react-dnd`, `react-dnd-html5-backend` — drag and drop
- `lucide-react` — icons
- `date-fns` — date utilities
- `numeral` — number formatting
- `dotenv` — env var loading

**Dev dependencies**

- `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/numeral`, `@types/uuid` — TypeScript + type defs
- `tailwindcss`, `@tailwindcss/postcss`, `tailwind-merge` — styling
- `eslint`, `eslint-config-next` — linting
- `prettier`, `prettier-plugin-tailwindcss` — formatting (auto-sorts Tailwind classes)

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 2. Formatting (Prettier)

A [.prettierrc](.prettierrc) is set up at the project root:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

The `prettier-plugin-tailwindcss` plugin automatically sorts Tailwind utility classes into a consistent order on save/format. Run formatting manually with:

```bash
npx prettier --write .
```

## Redux & State ([src/app](src/app), [src/state](src/state))

State is managed with Redux Toolkit and wired up in [src/app/redux.tsx](src/app/redux.tsx):

- **Store setup** — `makeStore()` combines the `global` slice reducer ([src/state/index.ts](src/state/index.ts)) with the RTK Query `api` reducer ([src/state/api.ts](src/state/api.ts)) via `combineReducers`.
- **Persistence** — `redux-persist` wraps the root reducer so the `global` slice survives page reloads (persisted to `localStorage` in the browser, and a no-op storage on the server to avoid SSR errors). Only `global` is in the persistence `whitelist`; API cache data is not persisted.
- **`global` slice** ([src/state/index.ts](src/state/index.ts)) — holds simple UI state: `isSidebarCollapsed` and `isDarkMode`, each with a setter action (`setIsSidebarCollapsed`, `setIsDarkMode`). [dashboardWrapper.tsx](src/app/dashboardWrapper.tsx) reads `isDarkMode` and toggles the `dark` class on `<html>` accordingly.
- **API layer** ([src/state/api.ts](src/state/api.ts)) — an RTK Query `createApi` instance using `fetchBaseQuery` pointed at `process.env.NEXT_PUBLIC_API_BASE_URL`. Endpoints are added here as the app grows (currently empty — `endpoints: (build) => ({})`).
- **Typed hooks** — `useAppDispatch` and `useAppSelector` are typed wrappers around the standard `react-redux` hooks, exported from `redux.tsx` so components get full `RootState`/`AppDispatch` typing instead of the untyped defaults.
- **`StoreProvider`** — a client component that creates the store once per app instance (`useRef`), calls `setupListeners` (enables RTK Query's refetch-on-focus/reconnect behavior), and wraps children in both the Redux `Provider` and `PersistGate`. It's mounted in [dashboardWrapper.tsx](src/app/dashboardWrapper.tsx), which itself renders inside [layout.tsx](src/app/layout.tsx).

## `globals.css` changes ([src/app/globals.css](src/app/globals.css))

- Added a global `box-sizing: border-box` reset on all elements.
- `html`, `body`, `#root`, `.app` are forced to `height: 100%; width: 100%` with a small base font size (`text-sm`), white background, and a `dark:bg-black` variant.
- Defined `@custom-variant dark (&:where(.dark, .dark *))` — replaces the old Tailwind v3 `darkMode: "class"` config option, since Tailwind v4 configures dark mode via CSS instead of `tailwind.config.js`. This is what lets `dark:` classes work off the `.dark` class toggled in `dashboardWrapper.tsx`.
- Extended the `@theme` block with custom design tokens used across the app:
  - `--background-image-gradient-radial` / `-conic` — gradient utilities
  - A grayscale and blue palette (`--color-gray-100...800`, `--color-blue-200...500`)
  - Dark-mode-specific colors: `--color-dark-bg`, `--color-dark-secondary`, `--color-dark-tertiary`, `--color-blue-primary`, `--color-stroke-dark`


