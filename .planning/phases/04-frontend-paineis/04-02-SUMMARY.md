---
phase: 04-frontend-paineis
plan: "02"
subsystem: frontend-client
tags: [frontend, client-dashboard, M5, recharts, pagination]
dependency_graph:
  requires: ["04-01"]
  provides: ["client-dashboard-M5"]
  affects: ["frontend/app/(client)/dashboard"]
tech_stack:
  added: []
  patterns: ["Client Component with useState/useEffect", "recharts AreaChart", "semantic table with pagination", "aggregated metrics from multi-account data"]
key_files:
  created:
    - frontend/components/AccountFilter.tsx
    - frontend/components/ClickChart.tsx
    - frontend/components/ConversationTable.tsx
  modified:
    - frontend/app/(client)/dashboard/page.tsx
decisions:
  - "AccountFilter uses button group (not native select) per UI-SPEC for better touch UX"
  - "ConversationTable manages pagination state internally, resets page on accountId change"
  - "Dashboard deselects account on re-click (toggle behavior) for better UX"
  - "Token placeholder is empty string with TODO comment — auth is out-of-scope for this phase"
metrics:
  duration: "2m 19s"
  completed: "2026-03-28T02:53:04Z"
  tasks_completed: 2
  files_changed: 4
---

# Phase 4 Plan 02: Client Dashboard (M5) Summary

Client dashboard (M5) fully implemented with account filter, aggregated metric cards, click time series chart with 7/30-day toggle, and paginated conversation table. All four UI states (loading, empty, error, populated) implemented in every component.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create AccountFilter, ClickChart, ConversationTable | 16d9318 | frontend/components/AccountFilter.tsx, ClickChart.tsx, ConversationTable.tsx |
| 2 | Mount client dashboard page | b307ae3 | frontend/app/(client)/dashboard/page.tsx |

## What Was Built

### AccountFilter (`frontend/components/AccountFilter.tsx`)
- Button group with `aria-pressed` accessibility attribute
- 44px minimum height for mobile touch targets
- Selected state: `var(--color-primary)` background; unselected: transparent with border
- Focus visible outline using `var(--color-primary)`

### ClickChart (`frontend/components/ClickChart.tsx`)
- recharts `AreaChart` inside `ResponsiveContainer` (width 100%, height 240px)
- Toggle between "Ultimos 7 dias" and "Ultimos 30 dias"
- Data fetched via `analyticsApi.getClickTimeSeries`
- All four states: loading (Skeleton 240px), error (red message), empty (text message), populated (chart)
- `aria-label="Grafico de cliques por dia"` on container div

### ConversationTable (`frontend/components/ConversationTable.tsx`)
- Semantic `<table>` with `<thead>`, `scope="col"` on all `<th>` elements
- Columns: Participante, Mensagens, Ultima atividade
- Pagination: 20 items/page, "Anterior"/"Proxima" buttons, page counter
- `@username` or "Desconhecido" for null username
- Date formatted with `Intl.DateTimeFormat('pt-BR')` as DD/MM/YYYY HH:mm
- Page resets to 1 when `accountId` changes
- Loading: 5 Skeleton rows; Empty: EmptyState component; Error: message + retry button with `role="alert"`

### Dashboard Page (`frontend/app/(client)/dashboard/page.tsx`)
- Client Component (`'use client'`) — manages account selection and fetch state
- Fetches all accounts via `analyticsApi.getAllSummary('')` on mount
- Aggregates metrics when no account selected; shows per-account metrics when one is selected
- 4 MetricCards: Conversas Atendidas, Mensagens Respondidas, Cliques em Links, Contas Ativas
- Grid: `repeat(auto-fill, minmax(240px, 1fr))` gap `24px` per UI-SPEC
- Error state with `role="alert"`, `var(--color-error)` at 15% opacity background, retry button
- 401 error redirects to `/auth/login`
- EmptyState when no account selected (instead of ClickChart/ConversationTable)
- `export const metadata` removed (not allowed in Client Components)

## Deviations from Plan

### Auto-fixed Issues

None. Plan executed exactly as written with one minor UX enhancement:

**[Enhancement] Account filter toggle behavior**
- Found during: Task 2
- Issue: Plan did not specify behavior when clicking an already-selected account
- Fix: Added toggle behavior — clicking selected account deselects it (sets to null), showing aggregated metrics
- Files modified: frontend/app/(client)/dashboard/page.tsx
- No separate commit — included in Task 2 commit

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `token = ''` | frontend/app/(client)/dashboard/page.tsx | 17 | JWT auth is out-of-scope for Phase 4 — comment `// TODO: obter token de autenticacao` added. Future phase will wire real auth token. |

The empty token stub is intentional per plan specification: "Por enquanto, usar string vazia '' como token (auth sera implementada depois)." The dashboard UI is fully functional; data will load once auth token is provided.

## Self-Check

### Created Files
- [x] frontend/components/AccountFilter.tsx — FOUND
- [x] frontend/components/ClickChart.tsx — FOUND
- [x] frontend/components/ConversationTable.tsx — FOUND
- [x] frontend/app/(client)/dashboard/page.tsx — MODIFIED (FOUND)

### Commits
- [x] 16d9318 — feat(04-02): create AccountFilter, ClickChart, and ConversationTable components
- [x] b307ae3 — feat(04-02): implement complete client dashboard page (M5)

### TypeScript
- [x] `npx tsc --noEmit` — Exit code 0, zero errors

## Self-Check: PASSED
