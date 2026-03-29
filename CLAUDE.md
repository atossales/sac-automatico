# SAC Automático — CLAUDE.md

> Arquivo de instruções do projeto para Claude Code.
> Leia TUDO antes de escrever qualquer linha de código.

---

## 🌐 Idioma e comunicação

- **Responda sempre em português brasileiro (pt-BR)**
- Explicações, comentários inline, mensagens de erro ao usuário: pt-BR
- Nomes de variáveis, funções, arquivos, classes: inglês
- Commits: inglês, seguindo Conventional Commits
- Documentação técnica interna (este arquivo, README): pt-BR

---

## 📌 O que é este projeto

**SAC Automático** é um sistema privado de atendimento ao cliente via Instagram DM, 100% automatizado com IA humanizada.

### Contexto de negócio
- **Cliente único:** 1 empresa com 4–10 contas Instagram Business
- **Objetivo:** substituir o SAC humano por IA que responde como humano
- **Operadores:** apenas 2 pessoas (o gestor/desenvolvedor + o cliente em modo leitura)
- **Hospedagem:** EasyPanel no servidor próprio do gestor

### O que o sistema faz
1. Recebe DMs de todas as contas Instagram via webhook da Meta Graph API
2. Processa cada mensagem com fila (BullMQ + Redis) para não perder nada
3. Gera resposta humanizada via Claude API (Sonnet) com contexto da conversa
4. Aplica delay aleatório (simula digitação humana) antes de enviar
5. Envia a resposta via Meta Graph API
6. Rastreia cliques em links enviados pela IA nos DMs
7. Exibe métricas no painel do cliente (leitura apenas)

### O que o sistema NÃO faz
- Não é um produto SaaS público
- Não tem billing/Stripe
- Não tem registro de usuários
- Não precisa de App Review da Meta (Development Mode permanente)

---

## 🏗️ Arquitetura do sistema

```
sac-automatico/
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── modules/
│   │   │   ├── instagram/    # OAuth2, webhook, Graph API
│   │   │   ├── ai/           # Claude API, prompt engine
│   │   │   ├── queue/        # BullMQ workers
│   │   │   ├── tracker/      # Link tracking + redirect
│   │   │   ├── automation/   # Gatilhos e fluxos
│   │   │   └── analytics/    # Métricas e relatórios
│   │   ├── config/           # Variáveis de ambiente
│   │   ├── jobs/             # Cron jobs (renovação de token)
│   │   └── app.ts
│   ├── prisma/               # Schema do banco
│   └── package.json
│
├── frontend/                 # Next.js 14 + TypeScript
│   ├── app/
│   │   ├── (admin)/          # Painel do gestor
│   │   ├── (client)/         # Painel do cliente (read-only)
│   │   └── auth/             # OAuth2 callback
│   └── package.json
│
├── docker-compose.yml        # PostgreSQL + Redis + App
├── .env.example
└── CLAUDE.md                 # Este arquivo
```

---

## 🔧 Stack tecnológico

| Camada | Tecnologia | Versão mínima |
|--------|-----------|--------------|
| Runtime | Node.js | 20+ |
| Backend | Express + TypeScript | 5.x |
| Frontend | Next.js + TypeScript | 14.x |
| ORM | Prisma | 5.x |
| Banco | PostgreSQL | 15+ |
| Cache/Fila | Redis + BullMQ | 7.x |
| IA | Google Gemini Flash | gemini-2.0-flash |
| Instagram | Meta Graph API | v19 |
| Deploy backend | Docker + EasyPanel | — |
| Deploy frontend | Netlify (via MCP) | — |
| Automações | n8n (self-hosted, via MCP) | — |
| Auth | OAuth2 (Meta) + JWT | — |

---

## 📦 Módulos do sistema (desenvolvimento por fases)

### Fase 1 — Instagram Connect (fundação)
**M1:** OAuth2 com Meta, armazenamento seguro de tokens, registro de webhooks, renovação automática a cada 55 dias.

### Fase 2 — AI Engine (core)
**M2:** Fila de processamento, system prompt por conta, injeção de histórico, delay humanizado, detecção de intenção, escalada graciosa.

### Fase 3 — Link Tracker + Automações
**M3:** URLs rastreadas, registro de cliques, redirect transparente.
**M4:** Gatilhos (boas-vindas, resposta a story, palavra-chave).

### Fase 4 — Painéis
**M5:** Dashboard do cliente (read-only): métricas, cliques, conversas.
**M6:** Painel admin (gestor): configuração, personas, playground, monitor de fila.

---

## 🤖 Workflow de desenvolvimento (baseado em AIOX + oh-my-claudecode)

Este projeto usa um fluxo de desenvolvimento ágil orientado a agentes:

### Fluxo padrão
```
Requisito → PRD (planejamento) → Story (história) → Implementação → QA → Commit
```

### Agentes disponíveis (oh-my-claudecode)
- **planner** — planejamento, estimativas, decomposição de tarefas
- **architect** — decisões técnicas, estrutura de código, revisão de design
- **dev** — implementação, refatoração, debugging
- **critic** — revisão de código, qualidade, segurança

### Como usar no Claude Code
```
# Planejamento
/oh-my-claudecode:plan "implementar webhook do Instagram"

# Execução autônoma (conclui sem intervenção manual)
/oh-my-claudecode:ralph "implementar renovação automática de tokens"

# Revisão de código
/oh-my-claudecode:review

# Debug com evidências
/oh-my-claudecode:deep-analyze
```

### Fluxo de story (AIOX)
Ao iniciar uma nova funcionalidade maior:
1. Criar story em `docs/stories/STORY-XX-nome.md`
2. Incluir: contexto, critérios de aceitação, arquitetura esperada
3. Implementar guiado pela story
4. QA valida os critérios antes do commit

---

## 📐 Regras de código

### Geral
- **DRY** (Don't Repeat Yourself) — sem duplicação de lógica
- **YAGNI** (You Ain't Gonna Need It) — não implementar o que não está na story
- **TDD** quando possível — escreva o teste antes da implementação
- Funções com responsabilidade única, máximo 50 linhas
- Arquivos com responsabilidade única, máximo 300 linhas
- Sem `console.log` em produção — use o logger estruturado

### TypeScript
- `strict: true` sempre
- Sem `any` — use tipos explícitos ou `unknown`
- Interfaces para contratos externos (API, DB)
- Types para composições internas
- Enum para valores fixos (status, tipos)

### Backend (Node.js + Express)
- Validação de entrada com Zod em todas as rotas
- Middleware de erro centralizado
- Variáveis de ambiente validadas na inicialização (Zod)
- Secrets nunca no código — sempre em `.env`
- Rate limiting em rotas públicas (webhook, redirect)
- Validar assinatura HMAC de todos os webhooks recebidos da Meta

### Frontend (Next.js)
- Server Components por padrão
- Client Components apenas quando necessário (interatividade)
- Sem chamadas diretas à DB no frontend — sempre via API
- Loading states e error boundaries em todas as páginas

### Banco de dados
- Migrations via Prisma — nunca alterar schema manualmente
- Índices em campos usados em `WHERE` e `JOIN`
- Soft delete onde dados históricos importam
- Transações para operações multi-tabela

---

## 🔒 Segurança (crítico — dados de clientes)

- **Tokens do Instagram:** sempre criptografados em repouso (AES-256)
- **Webhook Meta:** validar `X-Hub-Signature-256` antes de processar
- **Variáveis de ambiente:** nunca commitar `.env` com valores reais
- **SQL Injection:** usar Prisma ORM — sem query string manual
- **CORS:** restrito ao domínio do painel
- **JWT:** expiração curta (15min) + refresh token rotativo
- **Logs:** nunca logar tokens, senhas, dados pessoais
- **Google AI API Key:** armazenar em `.env` como `GEMINI_API_KEY` — nunca hardcodar

---

## 🔄 n8n — Automações de suporte

O n8n (auto-hospedado no EasyPanel) é usado como **camada de orquestração** para automações complementares:

### Quando usar n8n (não o backend direto)
- Notificações por email/Slack quando IA não consegue responder
- Relatórios semanais automáticos para o cliente
- Sincronização com planilhas ou CRM externo
- Qualquer automação que precise de agendamento visual

### Integração com o backend
- Backend expõe endpoints internos que o n8n chama via HTTP
- n8n chama a API do backend, não acessa o banco diretamente
- Credenciais do n8n armazenadas no cofre do EasyPanel

### Ao criar workflows n8n via Claude Code
- Descreva o objetivo completo antes de qualquer implementação
- Inclua: trigger, fonte de dados, transformação, destino, frequência
- Valide o workflow no ambiente de teste antes de ativar

---

## 🧰 Skills de referência (baseadas nos repositórios)

### ClaudeForge — boas práticas de CLAUDE.md
Este arquivo foi estruturado seguindo as diretrizes do ClaudeForge:
- Seções claras com responsabilidades únicas
- Contexto de negócio antes de contexto técnico
- Regras executáveis, não genéricas

### claude-code-skill-factory — criação de skills customizadas
Ao identificar um padrão repetitivo no projeto, extraia como skill:
```
# Criar nova skill
docs/skills/nome-da-skill.md
```
Estrutura mínima de uma skill:
```markdown
# Nome da Skill
**Quando usar:** [contexto de ativação]
**O que faz:** [descrição objetiva]
**Passos:** [lista ordenada]
**Exemplo:** [caso real do projeto]
```

### aiox-core — agentes especializados por domínio
Ao iniciar uma tarefa complexa, ative o agente correto:
- Decisão arquitetural → architect
- Implementação → dev
- Problema de qualidade → critic
- Planejamento de sprint → planner

### oh-my-claudecode — orquestração multi-agente
Para tarefas que envolvem múltiplos domínios simultâneos:
```
/oh-my-claudecode:team 3 "implementar módulo de webhooks com testes"
```

---

## 📊 Supabase MCP (referência — se migrar de PostgreSQL local)

Se no futuro o banco for migrado para Supabase:
- Usar o MCP do Supabase para acesso direto via Claude Code
- Configurar em `~/.claude/mcp.json`
- Manter Row Level Security (RLS) em todas as tabelas
- Por enquanto: PostgreSQL local via Docker no EasyPanel

---

## 📝 Commits e versionamento

Seguir **Conventional Commits**:
```
feat: add instagram oauth2 flow
fix: token refresh not renewing before expiry
chore: update dependencies
docs: add webhook setup instructions
refactor: extract message queue to separate module
test: add unit tests for link tracker redirect
```

**Regras:**
- Um commit por funcionalidade concluída
- Testes passando antes de commitar
- Sem `--no-verify` para bypassar hooks
- Branch: `feat/nome-da-feature`, `fix/nome-do-bug`

---

## 🚫 Proibições absolutas

- Nunca usar `sudo npm install`
- Nunca commitar `.env` com valores reais
- Nunca logar tokens ou dados sensíveis
- Nunca processar webhook sem validar assinatura HMAC
- Nunca fazer query SQL manual (sempre Prisma)
- Nunca instalar dependências sem justificativa clara
- Nunca usar `any` no TypeScript
- Nunca subir código sem testes na lógica de negócio crítica (processamento de DM, renovação de token)

---

## ✅ Checklist antes de cada commit

- [ ] Testes passando (`npm test`)
- [ ] TypeScript sem erros (`npm run typecheck`)
- [ ] Lint sem warnings (`npm run lint`)
- [ ] Nenhum `console.log` esquecido
- [ ] Nenhum segredo hardcoded
- [ ] Funcionalidade testada manualmente no ambiente local
- [ ] Story atualizada com o que foi feito

---

## 🛠️ Comandos úteis do projeto

```bash
# Desenvolvimento
npm run dev              # Inicia backend + frontend
npm run dev:backend      # Apenas backend
npm run dev:frontend     # Apenas frontend

# Qualidade
npm test                 # Todos os testes
npm run typecheck        # Verificação TypeScript
npm run lint             # ESLint + Prettier

# Banco
npx prisma migrate dev   # Nova migration
npx prisma studio        # GUI do banco local
npx prisma generate      # Regenerar client após schema change

# Docker
docker-compose up -d     # Sobe PostgreSQL + Redis local
docker-compose down      # Para os containers

# Claude Code
claude                   # Inicia sessão na pasta do projeto
/oh-my-claudecode:omc-setup  # Configura plugins na primeira vez
```

---

## 📌 Contexto sempre relevante

- Instagram só aceita DMs de contas **Business ou Creator** vinculadas a uma **Página do Facebook**
- App Meta em **Development Mode** permanente — contas adicionadas manualmente como Testers
- Tokens do Instagram expiram em **60 dias** — renovar automaticamente a cada 55
- Janela de **24 horas** para responder DMs sem template aprovado
- Identificar mensagens enviadas pelo próprio sistema via `from.id === page_id` para evitar loops
- Delay de resposta: **mínimo 3s, máximo 12s** aleatório para simular humanidade
- Histórico de conversa: injetar últimas **20 mensagens** no contexto da IA

---

*Última atualização: gerado automaticamente para o projeto SAC Automático*
*Versão do CLAUDE.md: 1.0.0*
