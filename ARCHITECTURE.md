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

### Tema, layout e infraestrutura (P1)
Detalhe completo e motivos em [`docs/04-DECISOES-P1.md`](docs/04-DECISOES-P1.md).

- **Tema escuro único** com tokens do Figma em `src/index.css`. Tokens sem equivalente no shadcn têm nomes próprios (`ink`, `surface-card`, `surface-dark`, `highlight`, `subtle`, `border-soft`), e o `<html>` tem `class="dark"` fixa. `--destructive` (#FF7A6B) não existe no Figma: foi escolhido por contraste ≥ 6,9:1.
- **Tipografia:** Roboto Mono servida localmente (`@fontsource-variable/roboto-mono`). Escala do Figma em classes `text-display`, `text-heading-*`, `text-body-*` e `text-caption-*`. Alturas de linha menores que a fonte foram elevadas, para não sobrepor linhas quando o texto quebra ou há zoom.
- **`cn` configurado** (`src/lib/utils.ts`) com a escala tipográfica. Sem isso, `text-body-16` era descartado ao ser combinado com uma cor de texto. Componentes novos do shadcn precisam trocar `import { cn } from "cn"` por `@/lib/utils`.
- **TanStack Router file-based** com code-splitting automático. `src/routeTree.gen.ts` é versionado e ignorado pelo lint. Item ativo do header e divisória vêm da `staticData` de cada rota.
- **TanStack Query:** retry só para erros transitórios e mutations sem retry automático. O `queryClient` vai no contexto do router.
- **Axios:** cliente único em `src/api/http-client.ts`. Erros são normalizados em `ApiError` com `kind` (validation, session, permission, not-found, conflict, transient, unknown).
- **Skeleton** com shimmer (não pulse). É `aria-hidden` e não tem dimensões padrão. Com `prefers-reduced-motion`, fica estático. Há também uma regra global de movimento reduzido.
- **Fora do escopo** (Criadores, Aprenda, links editoriais do footer, redes sociais, newsletter): visual do Figma mantido, mas marcados como "em breve" (`aria-disabled`), sem aparentar sucesso.

## Desvios do Figma

- **Header mobile:** frame não extraído. Abaixo de 1024 px, a navegação vai para um drawer (Radix Dialog) aberto por um botão de menu (ícone Lucide). A nav completa só aparece a partir de 1024 px, porque em 768 não cabe com folga.
- **Divisória do header:** 1 px a 50% de opacidade em vez de 0,3 px, para renderização estável.
- **Footer em 390/768:** mesma ordem e cores, com fluxo empilhado. Contato fictício exibido como texto, sem `mailto:`/`tel:`.
- **Skip link** "Pular para o conteúdo" adicionado (não está no Figma).

## Limitações conhecidas (até agora)

- `npm run lighthouse` ainda não audita: o runner é implementado no bloco P9 e, por enquanto, sai com código 1 e uma mensagem explícita (não simula sucesso).
- Playwright usa o servidor de desenvolvimento. Regressão visual, relógio controlado e cenários por teste entram no P9.
- Busca, carrinho e "Entrar" do header estão "em breve" até P3/P4/P5 criarem as rotas: com o roteamento tipado, um link para rota inexistente não compila.
- Bundle inicial de ~516 KB (161 KB gzip) num chunk só. A otimização fica para o P9.
- O teste E2E do skeleton com movimento reduzido entra no P4, junto com o catálogo. No P1 o CSS foi validado no navegador.
