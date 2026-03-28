---
phase: 4
slug: frontend-paineis
status: draft
shadcn_initialized: false
preset: none
created: 2026-03-27
---

# Phase 4 — UI Design Contract

> Contrato visual e de interação para os painéis M5 (Cliente) e M6 (Gestor).
> Gerado por gsd-ui-researcher. Verificado por gsd-ui-checker.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — CSS variables puras em globals.css |
| Preset | not applicable |
| Component library | none (componentes custom em React/TSX) |
| Icon library | lucide-react (instalar: `npm install lucide-react`) |
| Font | system-ui stack já declarada no body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif |

Fonte: globals.css existente — `font-family` já declarado em `body`.

---

## Spacing Scale

Todos os valores são múltiplos de 4. Mapeiam diretamente para inline styles ou classes CSS com `gap`, `padding`, `margin`.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Gap entre ícone e label, separadores inline |
| sm | 8px | Padding de badge, gap entre itens de lista compactos |
| md | 16px | Padding horizontal de nav, gap padrão entre elementos |
| lg | 24px | Padding de cards (`padding: 24px`), gap entre cards no grid |
| xl | 32px | Padding vertical de seções (`marginBottom: 32px`) — já usado nos dashboards |
| 2xl | 48px | Espaçamento entre blocos maiores de página |
| 3xl | 64px | Reservado para separação de seções de configuração pesada |

Exceções:
- Nav height: 56px (já definido nos layouts existentes — manter)
- Touch targets mínimos: 44px de altura para botões interativos (mobile)
- Border-left de StatusCard: 4px (decorativo, não espacial)

Fonte: layouts existentes (`padding: 0 24px`, `height: 56px`, `padding: 32px 24px`). Gap do grid de métricas corrigido de 20px para `lg` (24px) — 20px não é múltiplo válido da escala.

---

## Typography

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Label | 12px (0.75rem) | 400 regular | 1.4 | Títulos de métrica, labels de campo, badges |
| Body | 14px (0.875rem) | 400 regular | 1.6 | Texto descritivo, células de tabela, copy de suporte |
| Heading | 18px (1.1rem) | 700 bold | 1.3 | Títulos de seção, cabeçalhos de card |
| Display | 28px (1.75rem) | 700 bold | 1.2 | Título principal de página (h1) e valores grandes de métrica |

Notas de consolidação:
- Valores numéricos grandes de métricas (ex: contagem total) usam Display (28px, weight 700) — mesmos atributos, sem necessidade de escala extra 32px.
- Peso 600 (semibold) removido — todos os papéis de destaque usam 700 (bold).
- Apenas 2 pesos declarados: 400 e 700.

Fonte: dashboards existentes (`fontSize: '1.75rem', fontWeight: 700` para h1; `fontSize: '1.1rem', fontWeight: 600` normalizado para 700; `fontSize: '0.8rem'` para labels de card; `fontSize: '2rem', fontWeight: 700` consolidado em Display).

---

## Color

Todos os tokens já existem em `globals.css` como CSS variables. Nenhum valor novo deve ser introduzido — usar exclusivamente os tokens abaixo.

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Dominant (60%) | `--color-bg` | `#0f172a` | Background de página, fundo de toda a área de conteúdo |
| Secondary (30%) | `--color-surface` | `#1e293b` | Cards, nav, sidebar, painéis, modais, tabelas |
| Border | `--color-border` | `#334155` | Bordas de cards, linhas de tabela, separadores, inputs |
| Text principal | `--color-text` | `#f1f5f9` | Todo texto legível, headings, valores de métrica |
| Text muted | `--color-text-muted` | `#94a3b8` | Labels de apoio, descrições, placeholders, copy secundário |
| Accent (10%) | `--color-primary` | `#6366f1` | CTA primário ("Conectar conta", "Salvar persona", "Testar prompt"), badge do gestor, left-border dos StatusCards de sistema, links ativos na nav |
| Accent hover | `--color-primary-hover` | `#4f46e5` | Estado hover do CTA primário apenas |
| Success | `--color-success` | `#22c55e` | Badge de status "ativo", indicador de job concluído, taxa de sucesso, token válido |
| Warning | `--color-warning` | `#f59e0b` | Jobs pendentes na fila, token próximo do vencimento (< 5 dias), alertas não-críticos |
| Error/Destructive | `--color-error` | `#ef4444` | Jobs com falha, token expirado, botão "Remover conta" (único CTA destrutivo), mensagens de erro |

Accent (`--color-primary`) reservado exclusivamente para:
1. Botão CTA primário de cada tela (um por tela)
2. Badge role "Gestor" na nav do admin
3. Left-border de StatusCards de fila/sistema no M6
4. Link ativo no menu de navegação lateral do M6

Accent NÃO deve ser usado em: texto corrido, ícones decorativos, bordas de cards padrão, estados de loading.

Cor do badge do cliente: `#0ea5e9` (sky-500) — já definida no layout existente. Manter para distinguir visualmente os dois painéis.

Fonte: globals.css + layouts existentes.

---

## Layout e Navegação

### M5 — Painel do Cliente (read-only)
- Layout: top nav (56px) + área de conteúdo centralizada (max-width 1280px)
- Nav: brand "SAC Automático" + badge "Relatórios" (cor `#0ea5e9`)
- Sem sidebar — navegação é mínima (apenas dashboard)
- Seletor de conta Instagram: `<select>` ou grupo de botões filtro logo abaixo do h1, antes dos cards
- Grid de métricas: `repeat(auto-fill, minmax(240px, 1fr))`, gap `lg` (24px)
- Gráfico de série temporal: bloco de largura total, altura 240px, abaixo dos cards de métrica
- Lista de conversas: tabela com paginação simples (Anterior / Próxima), 20 itens por página
- Primary focal point: h1 + metric cards grid

### M6 — Painel do Gestor (admin completo)
- Layout: sidebar esquerda (240px fixo em desktop) + top nav (56px) + área de conteúdo
- Sidebar com seções de navegação:
  1. Dashboard (visão geral do sistema)
  2. Contas (lista, adicionar, editar)
  3. Personas (configuração por conta)
  4. Playground (testar prompt)
  5. Logs (processamento)
- Em mobile (< 768px): sidebar colapsa em menu hamburguer na nav
- Max-width da área de conteúdo: 1280px
- Monitor de fila: polling a cada 10s via `useEffect` + `setInterval` (Client Component)
- Playground: textarea de entrada + botão "Testar" + área de resposta abaixo
- Primary focal point: h1 + system status row

---

## Componentes Necessários

Todos são componentes custom sem biblioteca externa, exceto lucide-react para ícones.

| Componente | Descrição | Tipo Next.js |
|-----------|-----------|--------------|
| `MetricCard` | Card de métrica com título, valor grande, descrição | Server Component |
| `StatusCard` | Card de status do sistema com left-border colorida | Server Component |
| `ClickChart` | Gráfico de série temporal de cliques (recharts) | Client Component |
| `ConversationTable` | Tabela paginada de conversas recentes | Server Component + Client paginação |
| `QueueMonitor` | Monitor de filas BullMQ com polling | Client Component |
| `AccountList` | Lista de contas Instagram com status de token | Server Component |
| `PersonaForm` | Formulário de configuração de persona | Client Component |
| `PromptPlayground` | Textarea + submit + área de resposta da IA | Client Component |
| `LogTable` | Tabela de logs com filtros | Client Component |
| `SidebarNav` | Navegação lateral do M6 | Client Component (estado ativo) |
| `AccountFilter` | Seletor de conta para filtrar dados no M5 | Client Component |

Biblioteca de gráficos: `recharts` (instalar: `npm install recharts @types/recharts` — compatível com React 18, leve, sem dependências pesadas).

---

## Estados de Interface

Cada componente de dados deve implementar explicitamente os quatro estados abaixo.

| Estado | Comportamento |
|--------|--------------|
| Loading | Skeleton retângulo com animação `opacity` pulsante (CSS animation, sem lib externa). Cor: `--color-border` com opacity 0.5. |
| Empty | Ícone centralizado + heading + copy de próximo passo (ver seção Copywriting). |
| Error | Banner vermelho com `--color-error` + mensagem + botão "Tentar novamente". |
| Populated | Conteúdo real renderizado. |

---

## Copywriting Contract

### M5 — Painel do Cliente

| Elemento | Copy |
|---------|------|
| Page title (h1) | Seus Relatórios |
| Page subtitle | Acompanhe o desempenho do atendimento automático |
| CTA primário | Filtrar por conta |
| Métrica 1 label | Conversas Atendidas |
| Métrica 2 label | Mensagens Respondidas |
| Métrica 3 label | Cliques em Links |
| Métrica 4 label | Contas Ativas |
| Gráfico título | Cliques por dia |
| Gráfico toggle 7 dias | Últimos 7 dias |
| Gráfico toggle 30 dias | Últimos 30 dias |
| Tabela título | Conversas recentes |
| Tabela coluna 1 | Participante |
| Tabela coluna 2 | Mensagens |
| Tabela coluna 3 | Última atividade |
| Paginação anterior | Anterior |
| Paginação próxima | Próxima |
| Empty state — sem conversas (heading) | Nenhuma conversa ainda |
| Empty state — sem conversas (body) | As conversas do Instagram aparecerão aqui assim que o sistema receber a primeira mensagem. |
| Empty state — sem conta selecionada | Selecione uma conta acima para ver os dados |
| Error state | Não foi possível carregar os dados. Verifique a conexão e tente novamente. |

### M6 — Painel do Gestor

| Elemento | Copy |
|---------|------|
| Page title (h1) | Painel do Gestor |
| Page subtitle | Visão geral do sistema SAC Automático |
| Nav item 1 | Dashboard |
| Nav item 2 | Contas |
| Nav item 3 | Personas |
| Nav item 4 | Playground |
| Nav item 5 | Logs |
| CTA adicionar conta | Conectar conta Instagram |
| CTA salvar persona | Salvar persona |
| CTA testar prompt | Testar resposta |
| CTA remover conta (destrutivo) | Remover conta |
| Confirmação de remoção de conta | Tem certeza que deseja remover esta conta? Esta ação desconecta a conta Instagram e apaga a persona configurada. Esta ação não pode ser desfeita. |
| Botão de confirmação final | Sim, remover |
| Botão de cancelamento | Cancelar |
| Fila — estado "operacional" | Sistema operacional |
| Fila — estado "jobs com falha" | {N} job(s) com falha |
| Fila — estado "sem conexão" | Não foi possível ler o estado da fila. Verifique se o Redis está em execução. |
| Monitor — label jobs pendentes | Aguardando |
| Monitor — label jobs ativos | Processando |
| Monitor — label jobs com falha | Com falha |
| Monitor — label jobs concluídos | Concluídos |
| Playground — label entrada | Mensagem de teste |
| Playground — placeholder entrada | Digite uma mensagem como se fosse um cliente... |
| Playground — label saída | Resposta simulada da IA |
| Playground — estado processando | Gerando resposta... |
| Playground — aviso | Esta é uma simulação. Nenhum DM real será enviado. |
| Logs — filtro conta | Filtrar por conta |
| Logs — filtro status | Filtrar por status |
| Logs — filtro data | Período |
| Empty state — sem contas (heading) | Nenhuma conta conectada |
| Empty state — sem contas (body) | Clique em "Conectar conta Instagram" para adicionar a primeira conta Business. |
| Empty state — sem logs (heading) | Nenhum log encontrado para os filtros selecionados |
| Empty state — sem logs (body) | Ajuste os filtros acima ou selecione um período maior. |
| Error state genérico | Não foi possível carregar os dados. Tente novamente. |
| Token válido | Token ativo |
| Token próximo do vencimento | Expira em {N} dias |
| Token expirado | Token expirado |

---

## Interações e Feedback

| Interação | Feedback |
|-----------|---------|
| Clique em "Conectar conta Instagram" | Redireciona para OAuth Meta (janela atual, não popup) |
| OAuth concluído com sucesso | Banner verde ("Conta conectada com sucesso") por 4s, desaparece sem ação |
| OAuth com falha | Banner vermelho ("Falha ao conectar conta: {motivo}") — persiste até fechar |
| Salvar persona | Botão fica disabled + texto "Salvando..." durante request; banner verde ao sucesso; banner vermelho com mensagem ao erro |
| Testar prompt | Botão "Testar resposta" disabled + spinner; área de resposta mostra "Gerando resposta..." com cursor pulsante; resposta substitui o placeholder |
| Remover conta | Modal de confirmação (não alert nativo); ao confirmar, botão "Sim, remover" fica disabled durante request |
| Polling fila (M6) | Indicador de última atualização ("Atualizado há Xs") no canto do QueueMonitor; sem flash visual a cada poll |
| Erro 401 (sessão expirada) | Redirecionar para `/auth/login` automaticamente |
| Erro 500 | Exibir estado de erro no componente afetado — não bloquear o resto da página |

---

## Acessibilidade

- Todos os botões e links com `aria-label` quando o texto visível não for suficiente (ex: botões com ícone apenas)
- Formulários com `<label htmlFor>` associado ao input correspondente
- Mensagens de erro em `role="alert"` para serem lidas por screen readers
- Contraste mínimo: texto `--color-text` (#f1f5f9) sobre `--color-surface` (#1e293b) = ratio 12.9:1 (passa AAA)
- Contraste mínimo muted: `--color-text-muted` (#94a3b8) sobre `--color-surface` (#1e293b) = ratio 4.8:1 (passa AA)
- Focus visible: outline `2px solid var(--color-primary)` com `outline-offset: 2px` em todos os elementos focáveis
- Tabelas com `<thead>`, `scope="col"` nos `<th>`
- Gráfico recharts: `aria-label` descritivo na div container

---

## Responsividade

| Breakpoint | Comportamento |
|-----------|--------------|
| 320px–767px (mobile) | Grid de métricas: 1 coluna. Sidebar M6: oculta, acessível via menu hamburguer. Padding lateral reduzido para 16px. Tabelas: scroll horizontal. |
| 768px–1023px (tablet) | Grid de métricas: 2 colunas. Sidebar M6: pode colapsar para ícones apenas (72px). |
| 1024px+ (desktop) | Grid de métricas: 4 colunas. Sidebar M6: expandida (240px). |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — shadcn não inicializado |
| npm (lucide-react) | ícones SVG, sem blocos de UI | not required — pacote oficial com source aberto |
| npm (recharts) | LineChart, AreaChart | not required — pacote oficial com source aberto |

Nenhum registry de terceiros via shadcn. Sem blocos que requerem vetting de segurança.

---

## Checklist de Pré-Implementação

- [ ] Instalar `lucide-react`: `npm install lucide-react`
- [ ] Instalar `recharts`: `npm install recharts`
- [ ] Confirmar que `components.json` (shadcn) continua ausente — não inicializar
- [ ] Todos os novos componentes devem importar cores exclusivamente via CSS variables, nunca valores hex hardcoded
- [ ] Client Components marcados com `'use client'` somente quando usam estado, refs ou eventos do browser
- [ ] Nenhum `console.log` no código entregue

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
