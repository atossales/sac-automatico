# SAC Automático — PROJECT.md

## Visão
Sistema privado de atendimento ao cliente via Instagram DM, 100% automatizado com IA humanizada. Substitui o SAC humano por IA que responde como humano.

## Contexto de Negócio
- **Cliente único:** 1 empresa com 4–10 contas Instagram Business
- **Operadores:** 2 pessoas (gestor/desenvolvedor + cliente em modo leitura)
- **Hospedagem:** EasyPanel no servidor próprio do gestor
- **Deploy frontend:** Netlify

## Princípios Não-Negociáveis
- Sistema privado — não é SaaS público
- Sem billing/Stripe, sem registro de usuários
- App Meta em Development Mode permanente
- Dark theme obrigatório (definido em globals.css)
- Stack: Next.js 14 + TypeScript, Server Components por padrão

## Stack Frontend
- Next.js 14 + TypeScript
- Dark theme com CSS variables já definido
- Sem biblioteca de UI ainda definida
- Cliente HTTP tipado em `frontend/lib/api.ts`
- Deploy: Netlify

## Dois Painéis
1. **Painel do Gestor (M6):** Acesso total — configuração, monitoramento, playground
2. **Painel do Cliente (M5):** Read-only — métricas e relatórios apenas
