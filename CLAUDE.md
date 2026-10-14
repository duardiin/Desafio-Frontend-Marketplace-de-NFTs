# Projeto: NFT Marketplace (desafio frontend)

## Leia primeiro (nesta ordem)
1. `docs/00-ENUNCIADO.md`: enunciado original do desafio (fonte da verdade).
2. `docs/02-PLANO-2-DIAS.md`: plano por blocos e registro de progresso.
3. `docs/design-tokens.md`: tokens extraídos do Figma (se existir).

Prazo: 2 dias. Prioridade: entregar um núcleo funcional, coerente e SEM critérios eliminatórios. O que ficar de fora deve ser registrado em `ARCHITECTURE.md`.

## Objetivo
Marketplace de NFTs em React + TypeScript seguindo o Figma. APIs, auth, carteiras e pagamentos são SIMULADOS com MSW. Sem blockchain, extensão de carteira ou gateway reais.

## Stack obrigatória (todas devem ser usadas de verdade)
React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO (`socket.io-client`), Tailwind CSS, shadcn/ui, MSW, Playwright, Lighthouse.
Complementares liberados: Vite, react-hook-form, zod, decimal.js, `@mswjs/socket.io-binding`.

## Regras inegociáveis (eliminatórias no enunciado)
- Todas as chamadas REST passam pelo cliente Axios. Nenhuma resposta fictícia em componentes, hooks ou no cliente Axios: mocks vivem só na camada MSW.
- Estado remoto com TanStack Query. Rotas e search params com TanStack Router. Busca, filtros, ordenação e paginação ficam na URL.
- Valores em ETH são strings decimais; usar aritmética decimal (decimal.js). Quantidades são inteiras. A cotação da API é a referência do checkout.
- Pedidos usam chave de idempotência. Nunca criar pedido duplicado.
- Tempo real SEMPRE via `socket.io-client`. Proibido chamar setters ou o cache diretamente para simular eventos.
- Eventos têm id estável, recurso e versão. Ignorar duplicados e antigos. Reconciliar com REST após reconectar.
- Logout e troca de usuário limpam cache privado e subscriptions. Nunca expor dados entre usuários.
- Nunca armazenar senha em claro. Credenciais são fictícias.
- Compra só é confirmada quando a simulação responde "confirmado".
- Testes E2E (Playwright) executáveis são obrigatórios.

## UI e acessibilidade
- Seguir o Figma. Estados não desenhados seguem o mesmo padrão visual.
- Testar em 390, 768 e 1440 px. Sem overflow horizontal.
- Skeletons com shimmer, sem deslocar o layout, respeitando `prefers-reduced-motion`.
- Teclado, foco visível, labels, erros associados, `alt` em imagens, feedback acessível (`aria-live`) para mutations e eventos em tempo real.

## Comandos
- `npm run dev`         # desenvolvimento com mocks
- `npm run build`
- `npm run preview`
- `npm run typecheck`
- `npm run lint`
- `npm run test:e2e`    # Playwright
- `npm run lighthouse`

## Convenções
- Estrutura por feature: `src/features/<nome>`; contratos tipados em `src/api/contracts`; mocks em `src/mocks`.
- Sem `any` solto. Componentes pequenos. Nomes claros.
- Commits pequenos, formato `tipo(escopo): descrição`.
- Não commitar `.env`, tokens ou credenciais. Não ignorar baselines do Playwright nem relatórios do Lighthouse (são entregáveis).

## Fluxo de trabalho
- Em tarefas grandes, propor um plano curto ANTES de codar e esperar meu OK.
- Cada módulo vem com seus testes E2E.
- Ao terminar uma tarefa: rodar `typecheck`, `lint` e os testes do módulo; marcar o item em `docs/02-PLANO-2-DIAS.md` (seção Registro de progresso); sugerir o commit.
- Registrar decisões e limitações em `ARCHITECTURE.md` conforme forem tomadas.
- NÃO chamar o MCP do Figma sem eu pedir (há limite de chamadas por mês). Reaproveitar `docs/design-tokens.md`.
- Não usar `--dangerously-skip-permissions`. Pedir confirmação antes de instalar dependências fora da lista acima.

## Definição de pronto
Typecheck e lint passando, testes do módulo passando, funciona em desktop e mobile, estados de loading/erro/vazio tratados, sem regressão visual não intencional.
