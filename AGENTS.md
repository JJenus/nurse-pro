# AGENTS.md

Frontend workspace root: `nurse-pro` (React 18 + TypeScript + Vite 5 + Tailwind 3). The backend is a separate repo at `../nurse-pro-api`.

## Commands

```bash
npm install
npm run dev      # Vite on :5173
npm run lint     # ESLint flat config
npm run build    # vite build only — does NOT typecheck
npx tsc -p tsconfig.app.json   # actual typecheck
```

- The root `tsconfig.json` is references-only (`"files": []`), so `npx tsc --noEmit` (as the README suggests) checks nothing.
- No test runner or test files exist; do not assume `npm test`.

## Architecture

- There is no router. `src/App.tsx` switches on a `currentPage` string; adding a page means updating `getPageTitle`, `renderCurrentPage`, and the nav list in `components/Layout/Sidebar.tsx`. Deep links do not change the page.
- API responses are wrapped as `{ data, message, success }`. `src/utils/api.ts` returns that envelope; Zustand stores read `response.data`.
- Store URLs are relative because the axios `baseURL` already ends in `/api` (e.g. `apiClient.get("/schedules")`).
- Server state and API calls belong in `src/stores/*` (Zustand), not directly in components; stores also push success/error toasts via `notificationStore`.
- Schedule export is the exception to the JSON envelope: it uses `getBlobWithHeaders` and triggers a browser download.
- Types are centralized in `src/types/index.ts`. Backend enum values match the frontend string unions (`"Junior"`, `"Day"`, etc.).
- The backend does not implement every route the stores call (`GET /schedules/{id}`, `/schedules/{id}/conflicts`, `/schedules/shifts`, `/schedules/swap-requests` GET). Verify against `../nurse-pro-api/.../controller` before wiring a new call.
- Security is effectively open on the backend, so no login flow is required; the token interceptor only attaches a token if one exists in `localStorage`.

## Config quirks

- Vite loads `.env` for `npm run dev` and `.env.production` for `npm run build` (both committed). `VITE_API_URL` overrides the AlwaysData fallback in `api.ts`.
- `vite.config.ts` excludes `lucide-react` from dependency optimization; keep that unless fixing a specific dev-server issue.
- `vercel.json` rewrites every route to `/`; deployment is on Vercel.
- No Prettier config or formatting script exists despite the README mentioning Prettier.
