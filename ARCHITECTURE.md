# Arquitetura

Documento vivo. Registra decisões, limitações e desvios do Figma conforme o projeto avança.
Contratos REST/eventos, sessão, carrinho, cache e reconciliação REST × Socket.IO serão detalhados nos blocos correspondentes.

## Stack e versões principais

| Responsabilidade | Tecnologia |
|---|---|
| Build | Vite 8 |
| UI | React 19 + TypeScript 6 |
| Roteamento | TanStack Router |
| Estado remoto | TanStack Query |
| HTTP | Axios (cliente único) |
| Tempo real | socket.io-client |
| Estilo | Tailwind CSS v4 + shadcn/ui (base Radix) |
| Mocks | MSW 2 + @mswjs/socket.io-binding |
| Formulários | react-hook-form + zod |
| Valores ETH | decimal.js (strings decimais) |
| E2E | Playwright (Chromium, desktop 1440 px e mobile 390 px) |
| Auditoria | Lighthouse |

## Estrutura de pastas

```
src/
  api/contracts/   # tipos dos contratos REST e eventos (fonte única)
  config/env.ts    # leitura e validação das variáveis VITE_*
  features/<nome>/ # código por feature (telas, hooks, componentes)
  components/ui/   # componentes shadcn/ui adaptados ao tema
  lib/             # utilitários genéricos
  mocks/           # handlers MSW, fixtures, cenários (ÚNICO lugar com dados fictícios)
tests/e2e/         # testes Playwright
lighthouse/        # configuração e relatórios da auditoria (versionados)
```

## Decisões

- **MSW fixado em 2.x** (`^2.15.0`). O MSW 3 já existe, mas `@mswjs/socket.io-binding@0.2.0` declara peer `msw@^2.10.2`. Priorizamos o transporte Socket.IO compatível exigido pelo enunciado.
- **oxlint em vez de ESLint.** Veio no template atual do Vite, é muito mais rápido e cobre as regras de React Hooks e TypeScript. `npm run lint` falha com warnings (`--deny-warnings`). `no-explicit-any` é erro. A regra `only-export-components` fica desligada só em `src/components/ui/**` (código gerado pelo shadcn, que exporta variantes).
- **shadcn/ui com base Radix.** Os primitivos Radix já tratam foco em diálogos e drawers, navegação por teclado e ARIA, que são requisitos de acessibilidade. O utilitário `cn` vem do pacote oficial `cn` (mantido pelo shadcn), substituindo `clsx` + `tailwind-merge`.
- **Defaults de ambiente no código** (`src/config/env.ts`, validado com zod). Os defaults espelham o `.env.example` (`VITE_ENABLE_MOCKS=true`, `VITE_API_URL=/api`, `VITE_MOCK_SCENARIO=default`), para que um checkout limpo sem `.env` rode com mocks, como exige o enunciado. Na Vercel as mesmas variáveis estão definidas explicitamente.
- **TypeScript em projetos separados:** `tsconfig.app.json` (app, DOM), `tsconfig.node.json` (`vite.config.ts`) e `tsconfig.e2e.json` (Playwright, DOM + Node, porque `page.evaluate` roda no navegador). `npm run typecheck` = `tsc -b` em todos.
- **Quebras de linha LF** via `.gitattributes`, já que o desenvolvimento é em Windows e o build é em Linux (Vercel), além de baselines estáveis.
- **SPA na Vercel:** `vercel.json` reescreve todas as rotas para `index.html` (acesso direto e refresh). `public/mockServiceWorker.js` é publicado junto com o build.

## Limitações conhecidas (até agora)

- `npm run lighthouse` ainda não audita: o runner é implementado no bloco P9 e, por enquanto, sai com código 1 e uma mensagem explícita (não simula sucesso).
- Playwright usa o servidor de desenvolvimento. Regressão visual, relógio controlado e cenários por teste entram no P9.
