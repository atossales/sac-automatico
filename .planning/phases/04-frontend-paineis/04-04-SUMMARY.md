---
phase: 04-frontend-paineis
plan: "04"
subsystem: frontend-admin
tags: [accounts, personas, oauth, confirm-modal, instagram]
dependency_graph:
  requires: ["04-03"]
  provides: [AccountList, ConfirmModal, PersonaForm, accounts-page, personas-page]
  affects: [frontend/app/(admin)/accounts, frontend/app/(admin)/personas]
tech_stack:
  added: []
  patterns: [client-component-state, controlled-form, optimistic-list-update, modal-escape-key]
key_files:
  created:
    - frontend/components/ConfirmModal.tsx
    - frontend/components/AccountList.tsx
    - frontend/app/(admin)/accounts/page.tsx
    - frontend/components/PersonaForm.tsx
    - frontend/app/(admin)/personas/page.tsx
  modified: []
decisions:
  - lucide-react nao exporta icone Instagram nesta versao — substituido por AtSign (semanticamente adequado para username)
  - Erro TypeScript em LogTable.tsx (arquivo nao rastreado, criado por agente paralelo 04-05) fora do escopo deste plano
metrics:
  duration: "~3 minutos"
  completed: "2026-03-28"
  tasks: 2
  files: 5
---

# Phase 04 Plan 04: Contas Instagram e Personas Summary

**One-liner:** Telas de gestao de contas Instagram (listar/OAuth/remover) e configuracao de persona por conta (system prompt, delay sliders) com feedback via Banner.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | AccountList, ConfirmModal e pagina de contas | 815c536 | AccountList.tsx, ConfirmModal.tsx, accounts/page.tsx |
| 2 | PersonaForm e pagina de personas | 9a3f308 | PersonaForm.tsx, personas/page.tsx |

## What Was Built

### ConfirmModal (frontend/components/ConfirmModal.tsx)
- Client Component modal reutilizável com `role="dialog"` e `aria-modal="true"`
- Fecha ao clicar no backdrop ou pressionar Escape (useEffect com keydown listener)
- Suporte a variantes `danger` (vermelho) e `primary` (roxo) para o botão de confirmação
- Estado de loading: botões desabilitados com opacity 0.7
- Props: isOpen, title, message, confirmLabel, cancelLabel, confirmVariant, loading, onConfirm, onCancel

### AccountList (frontend/components/AccountList.tsx)
- Client Component que lista contas Instagram com 3 estados de token: active/expiring/expired
- Badges coloridos (success/warning/error) com cálculo de dias restantes para `expiring`
- CTA "Conectar conta Instagram" com ícone Plus — chama `accountsApi.getOAuthUrl` e redireciona janela atual
- Botão "Remover conta" por item — abre ConfirmModal antes de executar remoção
- Ao remover: remove da lista local (otimista), mostra Banner success
- Estados: loading (3 Skeletons), error (Banner), empty (EmptyState com AtSign icon), populated

### accounts/page.tsx (frontend/app/(admin)/accounts/page.tsx)
- Página simples que compõe o AccountList
- Header com título "Contas Instagram" e subtítulo descritivo
- Token vazio com TODO para auth futura

### PersonaForm (frontend/components/PersonaForm.tsx)
- Client Component com fetch inicial da persona existente (graceful 404)
- Textarea para system prompt com focus outline via onFocus/onBlur
- Dois range sliders (delay mínimo 1-10s, máximo 1-30s) com validação bidirecional: delayMin <= delayMax
- Botão "Salvar persona" / "Salvando..." com disabled durante request
- Feedback via Banner (sucesso ou erro)
- Labels com htmlFor associados a cada input (acessibilidade)

### personas/page.tsx (frontend/app/(admin)/personas/page.tsx)
- Carrega lista de contas via `accountsApi.list`
- Renderiza um PersonaForm por conta
- Estados: loading (2 Skeletons 400px), error (Banner), empty (EmptyState), populated

## Success Criteria Verification

- [x] Pagina /admin/accounts lista contas com status de token (ativo/expirando/expirado)
- [x] Botão "Conectar conta Instagram" inicia fluxo OAuth
- [x] Remoção de conta pede confirmação via modal
- [x] Pagina /admin/personas mostra um formulário por conta
- [x] Salvar persona mostra feedback de sucesso/erro via Banner
- [x] Delay sliders validam min <= max

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] lucide-react nao exporta icone Instagram**
- **Found during:** Task 1 — erro TypeScript ao importar `Instagram` de lucide-react
- **Issue:** A versão instalada de lucide-react não contém o ícone `Instagram`
- **Fix:** Substituído por `AtSign` — semanticamente adequado para representar contas @username do Instagram
- **Files modified:** frontend/components/AccountList.tsx
- **Commit:** 815c536

### Out-of-Scope Issues (deferred)

- `frontend/components/LogTable.tsx` (criado por agente paralelo 04-05) tem erro TypeScript com `exactOptionalPropertyTypes`. Não é causado por este plano. Arquivo não rastreado no git.

## Known Stubs

- `const token = ''` em `accounts/page.tsx` e `personas/page.tsx` — aguarda implementação de auth JWT (fase posterior). Previsto no plano: "Autenticacao JWT e out-of-scope desta fase".

## Self-Check: PASSED

- [x] frontend/components/ConfirmModal.tsx existe
- [x] frontend/components/AccountList.tsx existe
- [x] frontend/app/(admin)/accounts/page.tsx existe
- [x] frontend/components/PersonaForm.tsx existe
- [x] frontend/app/(admin)/personas/page.tsx existe
- [x] Commit 815c536 existe
- [x] Commit 9a3f308 existe
- [x] TypeScript sem erros nos arquivos deste plano
