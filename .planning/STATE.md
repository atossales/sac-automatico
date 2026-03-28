# STATE.md

## Current Phase
Phase 4 — Frontend (M5 + M6)

## Current Plan
Plan 4 of 5 (04-04 next)

## Progress
[################....] 4/5 plans complete in phase 4

## Status
- Phases 1–3: Backend bootstrapado com estrutura completa
- Phase 4: Em execução — plans 04-01, 04-02 e 04-03 concluídos

## Frontend Atual
- `frontend/app/globals.css` — dark theme com CSS variables + @keyframes skeleton-pulse
- `frontend/lib/api.ts` — cliente HTTP tipado com 7 namespaces (analytics, health, queue, accounts, personas, playground, logs)
- `frontend/components/MetricCard.tsx` — card de métrica reutilizável (M5 e M6)
- `frontend/components/StatusCard.tsx` — card de status com left-border colorida (M6)
- `frontend/components/Skeleton.tsx` — skeleton loading animado
- `frontend/components/Banner.tsx` — banner de sucesso/erro temporário (Client Component)
- `frontend/components/EmptyState.tsx` — estado vazio com ícone e texto
- `frontend/components/AccountFilter.tsx` — seletor de conta Instagram (M5, Client Component)
- `frontend/components/ClickChart.tsx` — gráfico de série temporal com recharts (M5, Client Component)
- `frontend/components/ConversationTable.tsx` — tabela paginada de conversas (M5, Client Component)
- `frontend/components/SidebarNav.tsx` — navegação lateral M6 com 5 itens e estado mobile (Client Component)
- `frontend/components/QueueMonitor.tsx` — monitor de fila BullMQ com polling 10s (Client Component)
- `frontend/app/(admin)/layout.tsx` — layout admin com sidebar 240px + top nav
- `frontend/app/(admin)/dashboard/page.tsx` — dashboard M6 com 4 StatusCards + QueueMonitor
- `frontend/app/(client)/dashboard/page.tsx` — painel do cliente M5 completo (Client Component)
- `frontend/app/auth/callback/` — placeholder OAuth callback

## Decisões Tomadas
- Dark theme: obrigatório, já definido
- TypeScript strict: obrigatório
- Server Components por padrão no Next.js
- API client: `lib/api.ts` já tipado com todos os endpoints M5+M6
- Named exports (não default) para todos os componentes compartilhados
- Banner é o único Client Component — outros são Server Components
- CSS variables exclusivamente nos components — sem hex hardcoded
- Sem biblioteca de UI — componentes custom com CSS variables
- lucide-react para ícones, recharts para gráficos
- Sidebar state gerenciado internamente pelo SidebarNav (sem prop drilling)
- Admin layout é Client Component pois SidebarNav usa useState

## Notas de Sessão
- 2026-03-27: Iniciando planejamento UI fase 4
- 2026-03-27: Plan 04-01 concluído — fundação de componentes e api.ts completa
- 2026-03-28: Plan 04-02 concluído — painel do cliente M5 completo com AccountFilter, ClickChart, ConversationTable e dashboard page
- 2026-03-28: Plan 04-03 concluído — layout admin com SidebarNav + dashboard M6 com QueueMonitor
