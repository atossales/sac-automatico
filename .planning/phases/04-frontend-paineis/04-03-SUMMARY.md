---
phase: "04-frontend-paineis"
plan: "03"
subsystem: "frontend-admin"
tags: ["sidebar", "navigation", "queue-monitor", "dashboard", "admin", "M6"]
dependency_graph:
  requires: ["04-01"]
  provides: ["sidebar-nav", "queue-monitor", "admin-dashboard"]
  affects: ["frontend/app/(admin)/layout.tsx", "frontend/app/(admin)/dashboard/page.tsx"]
tech_stack:
  added: ["lucide-react icons (Camera, LayoutDashboard, UserCircle, MessageSquare, FileText, Menu, X)"]
  patterns: ["polling with setInterval + cleanup", "sticky sidebar layout", "mobile overlay sidebar"]
key_files:
  created:
    - "frontend/components/SidebarNav.tsx"
    - "frontend/components/QueueMonitor.tsx"
  modified:
    - "frontend/app/(admin)/layout.tsx"
    - "frontend/app/(admin)/dashboard/page.tsx"
decisions:
  - "Sidebar state (isOpen) managed internally by SidebarNav — no prop drilling to layout"
  - "Instagram icon unavailable in lucide-react v1.7 — Camera used as substitute"
  - "Admin layout converted to Client Component to support SidebarNav with useState"
  - "metadata export moved out of layout.tsx (Client Components cannot export metadata)"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-03-28"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Phase 4 Plan 03: Admin Layout com Sidebar e Dashboard do Gestor

Sidebar navegável com 5 itens e estado ativo via usePathname, layout admin refatorado com flex body, e dashboard do gestor com 4 StatusCards + QueueMonitor com polling de 10s.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | SidebarNav + refatorar admin layout | 1d0359b |
| 2 | QueueMonitor + dashboard admin | 52e24fe |

## What Was Built

### SidebarNav (`frontend/components/SidebarNav.tsx`)
- Client Component com 5 itens de navegação (Dashboard, Contas, Personas, Playground, Logs)
- Estado ativo via `usePathname()` com tint `rgba(99, 102, 241, 0.15)` para item ativo
- Desktop: sidebar fixa esquerda, 240px, sticky top 56px
- Mobile: oculta por padrão, hamburguer (Menu icon) posicionado fixed top-left, overlay com backdrop
- Botão X para fechar sidebar no mobile, clicar em link fecha o menu

### Admin Layout (`frontend/app/(admin)/layout.tsx`)
- Convertido para Client Component para suportar SidebarNav com estado
- Estrutura: top nav (56px sticky) + `admin-body` (flex row) com `SidebarNav` + `admin-main`
- Badge "Gestor" com `fontWeight: 700` conforme UI-SPEC
- Mobile: padding-top 72px no admin-main para evitar sobreposição com botão hamburguer

### QueueMonitor (`frontend/components/QueueMonitor.tsx`)
- Client Component com polling via `setInterval` de 10000ms
- Fetch paralelo de `queueApi.getStats()` e `queueApi.getJobs({ pageSize: 10 })`
- Indicador "Atualizado há Xs" com segundo timer de 1000ms
- Grid de 4 stats (waiting/active/failed/completed) com cores semânticas
- Tabela de jobs com badge de status, ID truncado em 8 chars, failedReason expandido
- Estados: loading (Skeleton), error (mensagem + retry), populated
- Responsivo: stats grid 4 colunas desktop → 2 colunas mobile, tabela com scroll horizontal

### Dashboard Page (`frontend/app/(admin)/dashboard/page.tsx`)
- Client Component com fetch inicial de `healthApi.check()` e `queueApi.getStats()`
- 4 StatusCards: Status do Sistema, Jobs Aguardando, Jobs com Falha, Taxa de Sucesso
- `successRate` calculado: `Math.round(completed / (completed + failed) * 100)`
- Loading com 4 Skeleton cards
- QueueMonitor renderizado em full width abaixo dos StatusCards

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `Instagram` icon not exported by lucide-react v1.7**
- **Found during:** Task 1
- **Issue:** `lucide-react` v1.7.0 does not export an `Instagram` icon — TypeScript error `Module '"lucide-react"' has no exported member 'Instagram'`
- **Fix:** Replaced `Instagram` icon with `Camera` for the "Contas" navigation item
- **Files modified:** `frontend/components/SidebarNav.tsx`
- **Commit:** 1d0359b

**2. [Rule 1 - Bug] `Skeleton` component does not accept `style` prop**
- **Found during:** Task 2
- **Issue:** Loading skeleton rows in QueueMonitor passed `style={{ marginBottom: '8px' }}` to `<Skeleton>` but the interface only has `width`, `height`, `borderRadius`
- **Fix:** Wrapped each `<Skeleton>` row in a `<div style={{ marginBottom: '8px' }}>` wrapper
- **Files modified:** `frontend/components/QueueMonitor.tsx`
- **Commit:** 52e24fe

**3. [Out of scope] `npm run lint` fails due to pre-existing `next.config.ts`**
- This is a pre-existing issue unrelated to this plan's changes
- `next lint` fails because the project uses `next.config.ts` but this version of Next.js only supports `.js` or `.mjs`
- Deferred: logged to deferred-items.md

## Known Stubs

- `const token = ''` in `frontend/app/(admin)/dashboard/page.tsx` (line 20) — JWT authentication is out of scope for this phase per plan spec. Will be wired in auth phase.
- `QueueMonitor` receives `token=""` — same reason as above.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| frontend/components/SidebarNav.tsx | FOUND |
| frontend/components/QueueMonitor.tsx | FOUND |
| frontend/app/(admin)/layout.tsx | FOUND |
| frontend/app/(admin)/dashboard/page.tsx | FOUND |
| commit 1d0359b (Task 1) | FOUND |
| commit 52e24fe (Task 2) | FOUND |
