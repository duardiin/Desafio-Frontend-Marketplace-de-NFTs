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

### Contratos e mocks (P2)
Os contratos estão em [`docs/contratos-api.md`](docs/contratos-api.md), os cenários no [README](README.md#cenários-e-reset-dos-mocks) e o detalhe das decisões em [`docs/05-DECISOES-P2.md`](docs/05-DECISOES-P2.md).

- **Contratos como tipos TypeScript** em `src/api/contracts`, compartilhados entre o cliente e os handlers do MSW. Assim, uma mudança no contrato quebra os dois lados na compilação. Não valido as respostas com zod em runtime: a origem é o próprio MSW, tipado pelos mesmos contratos. O zod fica para formulários e env.
- **"Servidor" simulado em `src/mocks`**, organizado como um backend:
  - `db/` guarda o estado, persistido no `localStorage` com `schemaVersion`;
  - `fixtures/` traz os dados iniciais;
  - `domain/` tem as regras de cotação, carrinho e liquidação;
  - `handlers/` traz um arquivo por recurso.
  
  Nenhum dado fictício existe fora dessa pasta.
- **Cotação com id derivado do conteúdo** (hash dos preços, quantidades, cupom e taxa). O pedido envia o `quoteId`. Se algo mudou, o servidor responde 409 `QUOTE_OUTDATED`. Isso implementa "a cotação da API é a referência do checkout" sem guardar cotações no servidor.
- **Idempotência por `Idempotency-Key` + hash do corpo**: mesma chave e mesmo corpo recuperam o pedido; corpo diferente é conflito. O mapa fica persistido, então a regra vale também depois de um refresh.
- **Liquidação do pagamento por prazo (`settleAt`)**, e não só por timer. O timer resolve no tempo esperado, e qualquer consulta ao pedido também resolve os vencidos. Com isso, um pedido pendente não fica preso se a página recarregar no meio.
- **Cenários globais só para condições de rede e falhas**. Os casos de negócio (cupons, NFT esgotado, e-mail já cadastrado) vêm dos dados e funcionam em qualquer cenário. O cenário fica no `sessionStorage` (por aba). Assim, cada teste do Playwright parte de um contexto limpo, com dados iniciais e cenário próprio.
- **Controles da simulação em `window.__kurioMock`**, só com mocks ativos. Servem para os testes dispararem mudanças "do servidor" (preço, disponibilidade, expiração), que se refletem no REST e, no bloco de tempo real, nos eventos. A UI nunca usa esses controles.
- **Senhas:** o servidor simulado guarda só o salt e o SHA-256 (`crypto.subtle`). As fixtures trazem o hash pré-calculado. Um teste E2E confere que a senha de um cadastro não aparece no estado persistido.
- **Bootstrap:** o worker do MSW sobe antes do primeiro render, em chunk carregado sob demanda. Sem isso, as primeiras requisições escapariam do mock.

### Sessão e rotas protegidas (P3)
Detalhe completo em [`docs/06-DECISOES-P3.md`](docs/06-DECISOES-P3.md).

- **Política de sessão:**
  - O token é opaco, tem validade e fica no `localStorage`, porque o MSW não emite cookie `httpOnly`.
  - O interceptor do Axios envia o token. A senha nunca é persistida.
  - A sessão é a query `['session']` (`null` = visitante).
- **Expiração** é detectada em três pontos:
  - guard das rotas privadas, que revalida na API a cada navegação;
  - 401 em qualquer chamada autenticada;
  - timer no `expiresAt`.
  
  Nos três casos, o app encerra a sessão local, avisa e, se estiver numa rota privada, vai para `/login?redirect=<href atual>&motivo=expirada`.
- **Rotas privadas** ficam sob o layout `_auth`. O `redirect` só aceita caminhos internos (sem open redirect) e o login devolve à tela pedida, com os search params.
- **Isolamento:** dados privados usam `['private', userId, ...]`. Login, logout, expiração e troca de usuário em outra aba (evento `storage`) cancelam as requisições e removem todo o cache privado.
- **Login e Cadastro** são modais (Radix Dialog) sobre a Início, com rota própria para acesso direto.
- **Avisos acessíveis:** região `aria-live` própria, chamável fora do React. Evita adicionar o `sonner`, que está fora da lista de dependências.

### Catálogo, detalhe e favoritos (P4)
Detalhe completo em [`docs/07-DECISOES-P4.md`](docs/07-DECISOES-P4.md).

- **Edições por NFT** (1/1, 1/10, 1/50, aberta), cada uma com disponibilidade própria, como no Figma do detalhe. O carrinho passou a ter uma linha por NFT + edição. O contrato do P2 foi ajustado e o banco simulado foi para a versão 2.
- **Search params** em texto simples, legíveis (`?colecao=musica,arte-3d&pagina=2`), por meio de `parseSearch`/`stringifySearch` próprios no router. São validados e normalizados, os padrões ficam fora da URL e filtro novo remove `pagina`.
- **Estratégia de cache do catálogo:**
  - A chave `['nfts', 'list', params]` inclui todos os parâmetros, e o `signal` é repassado ao Axios. Respostas obsoletas ou fora de ordem caem na própria entrada de cache e não sobrescrevem a tela.
  - `keepPreviousData` mostra a lista anterior atenuada, com "Atualizando…".
  - O detalhe usa `['nfts', 'detail', id]`, carregado no `loader` da rota. O 404 vira `notFound()`.
- **Favoritos otimistas:** `onMutate` altera `['private', userId, 'favorites']`; o rollback em `onError` vem com aviso; `onSettled` invalida a lista.
- **Imagens:** WebP responsivo (256/512/900) gerado por script com o Chromium do Playwright, com `srcset`/`sizes`, proporção reservada, `lazy` e `fetchpriority="high"` só na imagem principal.

### Carrinho e cotação (P5)
Detalhe completo em [`docs/08-DECISOES-P5.md`](docs/08-DECISOES-P5.md).

- **Estado do carrinho:**
  - O carrinho é recurso da API.
  - O visitante tem um UUID (`kurio:guest-id`), enviado pelo Axios em `X-Guest-Id`, criado só na primeira inclusão.
  - Login e cadastro chamam `POST /cart/merge` e descartam o id do visitante.
  - O cache fica em `['private', userId, 'cart' | 'quote']` para a conta e em `['cart', 'guest', guestId]` para o visitante.
- **Cotação como única fonte de valores:** subtotal, desconto, taxa, total e total por linha vêm da API. O cliente só formata com decimal.js.
- **Mutations do carrinho** (quantidade, remoção, cupom) não são otimistas: gravam o carrinho devolvido pela API e invalidam a cotação.
- **Avisos** de preço alterado (`priceWhenAddedEth`) e de itens bloqueados (`quote.blockers`) aparecem na linha e no resumo.

### Pagamento, pedido e recibo (P6)
Detalhe completo em [`docs/09-DECISOES-P6.md`](docs/09-DECISOES-P6.md).

- **Fluxo:** formulário → conexão simulada da carteira (`POST /checkout/wallet-connection`) → revisão em diálogo → envio. A cotação é revalidada ao abrir a revisão e ao confirmar. Uma mudança mostra o que mudou e exige nova confirmação. `QUOTE_OUTDATED` da API cai no mesmo aviso.
- **Idempotência:**
  - `Idempotency-Key` por tentativa (corpo do pedido), salva com o corpo no `sessionStorage`.
  - Clique repetido e "Tentar de novo" depois de timeout reenviam a **mesma** tentativa, sem revalidar, porque a confirmação pode já ter alterado o carrinho.
  - Uma trava síncrona (`ref`) cobre o intervalo antes do `isPending`.
- **Estados do pedido:** `/pedidos/$id` consulta a cada 1,5 s enquanto o pedido está pendente; no P7 isso vira evento `order.updated` + reconciliação. A confirmação (modal) só aparece com `confirmed`. O recibo é o snapshot do pedido. A saída de pendente invalida carrinho, pedidos e catálogo e avisa por `aria-live`.
- **Rascunho do pagamento** no `sessionStorage` por usuário: sobrevive a refresh e à expiração da sessão.

### Tempo real (P7)
Detalhe completo em [`docs/10-DECISOES-P7.md`](docs/10-DECISOES-P7.md).

- **Transporte:**
  - O cliente usa `socket.io-client`, só com `websocket`, em `VITE_REALTIME_URL` (`wss://realtime.kurio.local`).
  - O servidor é simulado pelo MSW (`ws.link`) com `@mswjs/socket.io-binding`.
  - O cliente é importado sob demanda, porque o `engine.io-client` guarda a referência ao `WebSocket` ao carregar, e precisa pegar o `WebSocket` já interceptado.
  - Há heartbeat simulado e timeout de conexão de 3 s.
- **Eventos** `nft.updated` (para todos) e `order.updated` (só para o dono), gerados pelo mesmo `onDbChange` do banco simulado que alimenta o REST. Envelope com `id` estável (`<recurso>:<id>:v<versão>`), `resource` e `version`.
- **Reconciliação:**
  - **Duplicatas:** ignoradas pelo `id`.
  - **Eventos antigos:** só aplicados se a versão for maior que a do dado em cache, item a item.
  - **Carrinho afetado:** recarrega da API e avisa por `aria-live`.
  - **Após reconectar:** as consultas ativas são invalidadas e recarregadas do REST.
- **Isolamento:** um socket por sessão, recriado no login, logout e troca de usuário, com os listeners liberados. O servidor filtra `order.updated` pelo dono e o cliente confere o `userId` de novo.

### Perfil e carteiras (P8)
Detalhe completo em [`docs/11-DECISOES-P8.md`](docs/11-DECISOES-P8.md).

- **Área da conta:** a barra "Meu perfil" do Figma (`AccountLayout`) envolve Perfil, Carteiras e Favoritos ("Lista de interesse"). Os itens sem tela (Atividade, Ofertas, Arquivos baixados, Suporte) ficam "em breve".
- **Perfil:** um formulário e um "Salvar", como no Figma. Os dados vão por `PATCH /me/profile` só se mudaram, e a senha por `POST /me/password` só se foi preenchida. Os erros da API vão para o campo certo (`applyApiErrors` com aliases, ex.: `ensName` → `ensLabel`). A resposta atualiza o cache do perfil e o usuário da sessão (header), sem nova requisição.
- **Avatar:** o navegador recorta e reduz para 256 px em WebP antes do envio (limite de 300 KB da API). É salvo na hora, por endpoint próprio, com remoção por `DELETE /me/avatar`.
- **Carteiras:** cadastro e edição num diálogo, com as mesmas regras da API (redes EVM ou Solana, formato do endereço). O `PATCH` devolve a lista inteira, porque trocar o papel muda as duas carteiras. A lista usa a mesma chave de cache do Pagamento.

## Desvios do Figma

- **Header mobile:** frame não extraído. Abaixo de 1024 px, a navegação vai para um drawer (Radix Dialog) aberto por um botão de menu (ícone Lucide). A nav completa só aparece a partir de 1024 px, porque em 768 não cabe com folga.
- **Divisória do header:** 1 px a 50% de opacidade em vez de 0,3 px, para renderização estável.
- **Footer em 390/768:** mesma ordem e cores, com fluxo empilhado. Contato fictício exibido como texto, sem `mailto:`/`tel:`.
- **Skip link** "Pular para o conteúdo" adicionado (não está no Figma).
- **Header autenticado** (não extraído): o "Entrar" vira um botão com inicial e primeiro nome, que abre o menu da conta. Mantém o mesmo lugar e as mesmas medidas.
- **Busca:** o Figma só tem a lupa. O campo abre num diálogo e a busca vira `?q=`, com um chip removível acima da grade.
- **Filtros no mobile** num drawer "Filtros". Selecionado também com ✓ e negrito (no Figma, só cor).
- **Banner em destaque** com nome e preço sobre a imagem, porque o banner é clicável e precisa dizer o destino.
- **Detalhe:** os textos de "Contrato" e "Direitos autorais" estão trocados no Figma; o código os pareia corretamente. A galeria repete a arte principal, como no próprio frame (só há 4 artes). "Mais desta coleção" não pagina, porque mostra os 5 itens de uma vez.
- **Carrinho** (frame `11:1278` não extraído, por decisão de guardar a chamada para o Pagamento): segue o padrão do Detalhe, com a lista de itens e o resumo em cartão de 380 px. COMPRAR adiciona e abre o carrinho.
- **Pagamento** (`11:2862`): Código de indicação e Nome ENS são opcionais (no Figma, obrigatórios). O endereço vem da carteira escolhida (só leitura). "Usar outra carteira?" leva a `/carteiras`, e o rascunho do pagamento é restaurado na volta. O chip de provedores é um cabeçalho, e não uma opção. O resumo mostra a edição no lugar do ID do token. "Confirmar compra" abre a revisão, e o envio é em "Confirmar pagamento".
- **Confirmação** (`11:4385`, não extraída): modal sobre a página do pedido (`/pedidos/<id>`), e não sobre o Pagamento, para sobreviver a refresh.
- **Perfil** (`9:1238`): a barra lateral vira uma faixa rolável abaixo de 1024 px, porque não há frame mobile. O olho aberto do "mostrar senha" é um ícone Lucide, porque o Figma só tem o estado oculto. A dica de senha forte e as mensagens de erro foram acrescentadas. A bio, que existe na API, não aparece, porque não está no design.
- **Carteiras** (`9:1670`, não extraído; a chamada ficou reservada para um frame mobile): seguem os campos e cartões do Pagamento e do Perfil, com a mesma barra lateral.
- **Valores ETH com ponto** em todo lugar ("1.19 ETH"), como nos cards do Figma. O filtro de preço do Figma usa vírgula.
- **Avisos (toasts):** estado não desenhado. Seguem `surface-card`, raio 8 e borda por tom, com prefixo "Erro:" nos erros.

## Limitações conhecidas (até agora)

- `npm run lighthouse` ainda não audita: o runner é implementado no bloco P9 e, por enquanto, sai com código 1 e uma mensagem explícita (não simula sucesso).
- Playwright usa o servidor de desenvolvimento. Regressão visual, relógio controlado e cenários por teste entram no P9.
- Carteiras não podem ser excluídas (a API simulada só tem cadastro e edição; o enunciado pede principal e secundária).
- Bundle inicial de ~362 KB (114 KB gzip) no P8, depois do code-splitting por rota. O MSW soma outro chunk de ~420 KB (160 KB gzip), que precisa carregar antes do primeiro render. A otimização e a análise de impacto no Lighthouse ficam para o P9. O enunciado exige auditar com os mocks ativos.
- **Limitações do tempo real simulado:**
  - não há rooms nem namespaces (filtro por usuário feito à mão);
  - não há long-polling;
  - o servidor de eventos roda na aba, então eventos não atravessam abas.
- **Limitações do ambiente de mocks:**
  - O estado vive no `localStorage` de cada navegador, então duas abas compartilham os dados, mas dois navegadores não.
  - A liquidação dos pedidos usa o relógio do navegador.
  - O hash de senha é SHA-256 simples, sem PBKDF2/bcrypt, por ser uma simulação.
- O teste E2E do skeleton com movimento reduzido entra no P4, junto com o catálogo. No P1 o CSS foi validado no navegador.
