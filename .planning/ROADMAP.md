# SAC Automatico — ROADMAP.md

## Milestone 1: MVP Funcional

### Phase 1: Instagram Connect (M1) ✅
**Goal:** OAuth2 com Meta, armazenamento seguro de tokens, webhooks, renovacao automatica.
- OAuth2 flow completo com Meta Graph API
- Armazenamento criptografado de tokens (AES-256)
- Registro e validacao de webhooks (HMAC)
- Job de renovacao automatica a cada 55 dias

### Phase 2: AI Engine (M2) ✅
**Goal:** Fila de processamento, respostas humanizadas via Gemini Flash, delay simulado.
- Fila BullMQ com workers
- System prompt por conta
- Injecao de historico (ultimas 20 mensagens)
- Delay aleatorio 3–12s
- Deteccao de intencao e escalada graciosa

### Phase 3: Link Tracker + Automacoes (M3/M4) ✅
**Goal:** URLs rastreadas, registro de cliques, gatilhos automaticos.
- URLs rastreadas com redirect transparente
- Registro de cliques por link
- Gatilhos: boas-vindas, resposta a story, palavra-chave

### Phase 4: Frontend — Paineis M5 e M6
**Goal:** Interfaces web completas para cliente (read-only) e gestor (admin) com dark theme, componentes custom e integracao com API backend.
**Plans:** 5 plans
**Requirements:** [FE-01, FE-02, FE-03, FE-04, FE-05, FE-06]

Plans:
- [ ] 04-01-PLAN.md — Setup: instalar deps, componentes compartilhados, estender api.ts
- [ ] 04-02-PLAN.md — M5: Dashboard do cliente (metricas, grafico, conversas)
- [ ] 04-03-PLAN.md — M6: Layout admin com sidebar + dashboard com QueueMonitor
- [ ] 04-04-PLAN.md — M6: Contas Instagram + Personas
- [ ] 04-05-PLAN.md — M6: Playground de prompts + Logs de processamento

**M5 — Painel do Cliente (read-only):**
- Dashboard com metricas globais (conversas, mensagens, cliques)
- Grafico de cliques por dia (serie temporal)
- Lista de conversas recentes com paginacao
- Selecao de conta Instagram para filtrar dados

**M6 — Painel do Gestor:**
- Dashboard com status do sistema e filas BullMQ
- Monitor de fila em tempo real (jobs pendentes, processando, falhos)
- Configuracao de contas Instagram (adicionar, editar, remover)
- Configuracao de personas por conta (system prompt, temperatura, delay)
- Playground de prompts (testar resposta da IA sem enviar DM)
- Logs de processamento com filtros

**Acceptance Criteria:**
- [ ] FE-01: Cliente acessa painel e ve metricas sem nenhuma configuracao manual
- [ ] FE-02: Gestor consegue adicionar nova conta Instagram e configurar persona em menos de 5 minutos
- [ ] FE-03: Monitor de fila mostra estado real dos jobs BullMQ
- [ ] FE-04: Playground retorna resposta da IA em menos de 10s
- [ ] FE-05: Todas as paginas respondem em mobile (320px+)
- [ ] FE-06: Zero erros TypeScript, zero erros de lint
