# Como foi feito · guia para o avaliador

Este documento explica o projeto do zero: o que foi entregue, como roda, como cada fluxo funciona por dentro, como cada critério do enunciado foi atendido e onde está a prova (arquivo ou teste). Ele não repete o detalhe técnico, que está no [README](README.md) e no [ARCHITECTURE](ARCHITECTURE.md); aponta para onde olhar.

- **Aplicação publicada:** https://desafio-frontend-marketplace-de-nf-alpha.vercel.app
- **Repositório:** https://github.com/duardiin/Desafio-Frontend-Marketplace-de-NFTs
- **Credenciais fictícias:** `ana@kurio.dev` ou `bruno@kurio.dev`, senha `Kurio@123`

---

## 1. Em um minuto

**O que é:** o marketplace de NFTs do Figma "GreenMint" (marca Kurio), em React + TypeScript, com todas as telas do enunciado em desktop e mobile. API, autenticação, carteiras, pagamentos e eventos em tempo real são simulados com **MSW**, na camada de rede. O app não sabe que a API é simulada.

**Como rodar:**

```bash
npm ci
npx playwright install chromium
npm run dev          # http://localhost:5173, já com os mocks
npm run test:e2e     # 162 testes E2E (desktop 1440 e mobile 390)
```

Não precisa de `.env`: os valores padrão estão no código e espelham o `.env.example`.

**Estado da entrega:**

| Verificação | Resultado |
|---|---|
| Critérios eliminatórios | **Todos atendidos** (seção 5) |
| Testes E2E (Playwright, desktop e mobile) | **162 passando** |
| Regressão visual (`npm run test:visual`) | **16 baselines** passando |
| Acessibilidade (axe, WCAG 2.2 AA) | **0 violações** nas telas auditadas |
| Overflow horizontal (14 telas × 390, 768 e 1440 px, mais zoom de 200%) | **0** |
| Typecheck e lint (`--deny-warnings`) | limpos |
| Lighthouse desktop (Início e Detalhe) | Performance 98; Accessibility, Best Practices e SEO 100 |
| Lighthouse mobile | Performance **78 / 77** (abaixo da meta de 90, com causas na seção 8); as demais categorias em 100 |
| Execução a partir de um clone limpo do GitHub | passou (`npm ci`, typecheck, lint, build, E2E, visual) |

---

## 2. Roteiro de avaliação (~15 min)

Abra `/?reset=1` para partir dos dados iniciais. Vale fazer no computador e no celular.

1. **Início:** catálogo com busca, filtros, ordenação e paginação. Mude os filtros, dê refresh e use o "voltar" do navegador: o estado vem da URL. No celular, o layout segue o frame mobile do Figma (busca no topo, grade desencontrada e barra de atalhos).
2. **Detalhe:** troque a edição e a quantidade; a edição esgotada fica indisponível e a quantidade respeita o limite. "COMPRAR" (ou "Comprar NFT", no celular) leva ao carrinho.
3. **Carrinho:** quantidades, remoção, cupom `KURIO10` (10%) e `EXPIRADO`. Todos os valores vêm da cotação da API.
4. **Login:** "Entrar" abre o login sobre a tela atual (no celular, em tela cheia). Entre como Ana.
5. **Compra:** no pagamento, **Conectar carteira**, **Confirmar compra** (abre a revisão) e **Confirmar pagamento**. O pedido aparece "Aguardando confirmação" e, em ~2,5 s, confirmado, com o recibo.
6. **Falhas:** repita a compra com `?cenario=pagamento-recusado`, `?cenario=pedido-timeout` ou `?cenario=preco-alterado` (lista completa no README).
7. **Tempo real:** com um NFT aberto, rode no console `__kurioMock.updateNft('nft-001', { priceEth: '2.50' })`. O preço muda sem recarregar, e o evento chega pelo `socket.io-client`.
8. **Conta:** edite o perfil (dados, avatar e senha) e as carteiras; dê refresh e veja que persistem. Saia e entre como Bruno: nada da Ana aparece.

---

## 3. Arquitetura em uma imagem

```
┌──────────────────────────── Navegador ────────────────────────────┐
│                                                                    │
│  Telas (src/features/*)  ──►  TanStack Router (rotas, URL, guards) │
│        │                                                           │
│        ▼                                                           │
│  TanStack Query (cache por recurso e por usuário)                  │
│        │                              ▲                            │
│        ▼                              │ eventos aplicados no cache │
│  Axios (cliente único)          socket.io-client (1 por sessão)    │
│        │  REST                        │  WebSocket                 │
│ ───────┼──────────────────────────────┼─────── camada de rede ──── │
│        ▼                              ▼                            │
│  MSW handlers (src/mocks/handlers)   MSW ws.link + socket.io-binding│
│        │                              ▲                            │
│        ▼                              │                            │
│  "Servidor" simulado: regras (src/mocks/domain) e banco            │
│  (src/mocks/db, localStorage)  ── toda mudança gera o evento ──┘   │
└────────────────────────────────────────────────────────────────────┘
```

Três princípios guiaram tudo:

1. **A camada de mocks se comporta como um backend de verdade.** Ela tem banco persistente, regras de negócio, códigos de erro, idempotência e eventos. Nenhum componente, hook ou o cliente Axios contém dado fictício: com outra API, bastaria trocar a URL.
2. **Os contratos são a fonte única.** Os tipos em `src/api/contracts` são usados pelo app *e* pelos handlers do MSW, então uma mudança de contrato quebra os dois lados na compilação. A documentação está em [docs/contratos-api.md](docs/contratos-api.md).
3. **A API é a referência de todo valor.** Preço, desconto, taxa e total vêm da cotação da API, como strings decimais; o cliente só formata com `decimal.js`. Disponibilidade e status do pedido também vêm da API ou dos eventos.

---

## 4. Como cada fluxo funciona por dentro

### 4.1 Sessão e isolamento entre usuários
- **Token:** o login devolve um token opaco, guardado no `localStorage` e enviado pelo interceptor do Axios (`src/api/http-client.ts`). A senha nunca é guardada no app; no "servidor", só o salt e o hash SHA-256.
- **Rotas privadas:** ficam sob o layout `_auth` (`src/routes/_auth.tsx`), que revalida a sessão a cada navegação.
- **Expiração:** detectada em três pontos (navegação, 401 em qualquer chamada e um timer). O app avisa e leva ao login, voltando à mesma tela; o rascunho do pagamento é preservado.
- **Isolamento:** todo dado privado fica no cache sob `['private', userId, …]`. Logout, troca de usuário e mudança de sessão em outra aba cancelam as requisições e apagam esse cache. O socket é recriado por sessão.
- **Provas:** `tests/e2e/auth.spec.ts` (expiração nos três pontos, troca de usuário), `cart.spec.ts` e `favorites.spec.ts` ("cada usuário vê só o próprio…").

### 4.2 Catálogo com estado na URL
- **Estado na URL:** busca, filtros, aba, ordenação e página são search params do TanStack Router, validados e legíveis (`/?q=golden&colecao=musica,arte-3d&pagina=2`). Mudar um filtro volta à página 1.
- **Cache por parâmetros:** a chave do TanStack Query inclui todos os parâmetros. Uma resposta atrasada de uma busca antiga cai na própria entrada do cache e nunca sobrescreve a tela atual; o `signal` cancela a requisição obsoleta.
- **Provas:** `catalog.spec.ts` (filtros combinados, histórico, cenário `fora-de-ordem`, vazio, erro com "Tentar novamente", skeleton no cenário `lento`).

### 4.3 Carrinho e cotação
- **Visitante e conta:** o carrinho é um recurso da API. O visitante recebe um id (`X-Guest-Id`); ao entrar, o carrinho dele é mesclado ao da conta.
- **Cotação:** é a referência do checkout e tem um id derivado do conteúdo (preços, quantidades, cupom e taxa). Se qualquer coisa muda, o id muda.
- **Provas:** `cart.spec.ts` (quantidades e limite por edição, cupom válido, expirado e inválido com valores exatos, persistência após refresh e login, preço alterado e esgotado).

### 4.4 Compra: idempotência e confirmação só pela simulação
1. **Conexão:** a pessoa conecta a carteira (conexão simulada, que pode ser recusada ou cair).
2. **Revisão:** "Confirmar compra" abre a revisão, que **revalida a cotação**. Se preço, disponibilidade, cupom ou taxa mudaram, a revisão mostra o que mudou e exige nova confirmação.
3. **Envio:** "Confirmar pagamento" envia o pedido com uma **chave de idempotência** gravada junto com o corpo. Clique repetido, "Tentar de novo" depois de timeout e refresh reenviam a mesma tentativa. O servidor devolve o mesmo pedido, e uma chave reaproveitada com outro conteúdo dá conflito.
4. **Confirmação:** o pedido nasce **pendente**, e a simulação o confirma ou recusa em ~2,5 s. O modal de confirmação só aparece com o status **confirmado** vindo da API ou do evento. Em caso de recusa, o carrinho fica intacto; na confirmação, saem só os itens comprados. O recibo é um snapshot do pedido.
- **Provas:** `checkout.spec.ts` (compra completa até o recibo, recusa, clique repetido gera um pedido, timeout recupera o mesmo pedido, preço alterado exige nova confirmação, carteira recusada ou desconectada, refresh com pedido pendente, sessão expirada no meio) e `mocks.spec.ts` (idempotência direto na API).

### 4.5 Tempo real
- **Transporte:** o app usa o **`socket.io-client`** de verdade. O servidor Socket.IO é simulado pelo MSW com `@mswjs/socket.io-binding` (`src/mocks/realtime.ts`).
- **Origem dos eventos:** `nft.updated` e `order.updated` nascem da mesma mudança no banco simulado que o REST devolve. Os testes só mudam o "servidor"; nada é escrito direto no cache ou na tela.
- **Regras do cliente** (`src/features/realtime/`):
  - cada evento tem id estável, recurso e versão; duplicatas são ignoradas;
  - só se aplica uma versão **maior** que a do cache, item a item. A mesma regra vale para as respostas REST (`src/lib/versioned-cache.ts`): uma resposta antiga em voo não desfaz um evento mais novo;
  - a cada conexão do socket, as consultas ativas são recarregadas do REST, o que cobre eventos perdidos numa queda;
  - pedidos de outro usuário são descartados no servidor e de novo no cliente.
- **Provas:** `realtime.spec.ts`. Cobre os dois cenários do enunciado: preço muda no checkout e a cotação antiga é bloqueada; queda com pedido pendente e retomada sem nova compra. Também cobre duplicata, evento antigo, mudança antes da primeira conexão e isolamento entre sessões.

### 4.6 Conta
- **Perfil:** dados, nome ENS, avatar (reduzido no navegador antes do envio) e troca de senha, com os erros da API em cada campo.
- **Carteiras:** principal e secundária, com validação de endereço EVM/Solana e troca de papel.
- **Persistência:** tudo é gravado na API simulada e permanece depois do refresh.
- **Provas:** `profile.spec.ts` e `wallets.spec.ts`.

---

## 5. Critérios eliminatórios: como cada um foi atendido

| Critério | Como foi garantido | Onde verificar |
|---|---|---|
| Uso efetivo da stack obrigatória | Router (rotas, search params, guards), Query (todas as consultas e mutations), Axios (cliente único), Socket.IO (cliente real), Tailwind + shadcn (Radix), MSW (REST e Socket.IO), Playwright (E2E e visual), Lighthouse (script versionado) | `src/routes`, `src/api/http-client.ts`, `src/features/realtime`, `src/mocks`, `tests/`, `lighthouse/run.mjs` |
| Fluxos principais não apenas visuais | Compra, conta, carrinho e favoritos integrados à API simulada, de ponta a ponta | `checkout.spec.ts`, `profile.spec.ts`, `wallets.spec.ts` |
| Compra confirmada só com resposta da simulação | O modal depende do status `confirmed` vindo da API ou do evento; não há atalho no cliente | `src/features/orders`, teste "compra completa" |
| Sem exposição de dados entre usuários | Cache privado por usuário com purga, socket por sessão e filtro duplo de eventos de pedido | `auth.spec.ts`, `realtime.spec.ts` |
| Eventos não simulados direto na UI | Os eventos passam pelo `socket.io-client`; os testes só alteram o "servidor" | `src/mocks/realtime.ts`, `realtime.spec.ts` |
| Testes E2E executáveis | `npm run test:e2e` (162 testes), validado num clone limpo | `tests/e2e/` |

---

## 6. Como o trabalho foi conduzido

**Processo:**
- **Plano em blocos:** fundação, contratos e mocks, descoberta e carrinho, compra e tempo real, conta e entrega (`docs/02-PLANO-2-DIAS.md`, com registro de progresso).
- **Antes de cada bloco:** plano curto e aprovado.
- **Depois de cada bloco:** typecheck, lint e os testes do módulo; decisões documentadas; commits pequenos (`tipo(escopo): descrição`).

**Decisões registradas:**
- **Por etapa:** cada escolha que fugiu do óbvio está registrada com o motivo, de `docs/04-DECISOES-P1.md` a `docs/11-DECISOES-P8.md`.
- **Auditoria:** a conferência item a item contra o enunciado está em `docs/12-AUDITORIA-FINAL.md`.

**Figma:**
- **Frames extraídos:** Início (desktop e mobile), Detalhe, Pagamento e Perfil foram extraídos com o MCP do Figma; as medidas estão em `docs/design-tokens.md`.
- **Frames por print:** com o limite de chamadas do mês atingido, os frames mobile de Detalhe, Carrinho, Pagamento, Login e Cadastro foram implementados a partir de prints.
- **Telas sem frame visto:** seguem o padrão visual das extraídas.

**Verificação além dos testes funcionais:**
- **Acessibilidade e layout:**
  - varredura automática de overflow em 14 telas e 3 larguras, que pega também o overflow escondido pelo zoom do celular, e um teste de zoom de 200% num monitor de 1280 px;
  - **axe** nos E2E, sem tolerar violações.
- **Regressão visual:** baselines versionadas, com relógio fixo e dados estáveis.
- **Lighthouse:** com mediana de 3 medições, versões e ambiente registrados.
- **Ambientes reais:**
  - teste em **celulares reais**, que pegou a tab bar desalinhada em telas de 360 px, já corrigida e coberta por teste;
  - testes **em produção**: compra completa, tempo real e login mobile;
  - execução a partir de um **clone limpo** do GitHub.

**Testes validados contra o bug:** todo teste de regressão novo foi conferido contra o código antigo (tem de falhar) e o novo (tem de passar). Isso já pegou um teste que passava por acaso: a checagem esperava o aviso sumir sozinho.

---

## 7. Onde está cada coisa

| Pasta ou arquivo | Conteúdo |
|---|---|
| `src/api/contracts/` | Contratos REST e de eventos (fonte única) |
| `src/api/http-client.ts` | Cliente Axios único, interceptores e normalização de erros (`ApiError`) |
| `src/routes/` | Rotas do TanStack Router (file-based) |
| `src/features/<nome>/` | Telas, hooks e componentes por funcionalidade |
| `src/mocks/` | "Servidor" simulado: handlers REST, Socket.IO, regras, banco, fixtures e cenários |
| `src/index.css` | Tema com os tokens do Figma |
| `tests/e2e/` | E2E funcionais, acessibilidade (axe) e overflow |
| `tests/visual/` | Regressão visual e baselines |
| `lighthouse/` | Configuração, runner, relatórios HTML/JSON, resultados e análise |
| `docs/` | Enunciado, plano, contratos, tokens do Figma, decisões, auditoria e review do dia |

---

## 8. Limitações conhecidas

Ficam registradas aqui para não serem descoberta do avaliador:

- **Lighthouse mobile em 78/77**, abaixo da meta de 90.
  - **Causa principal:** a camada de mocks (~180 KB, dos quais ~100 KB são a lista de domínios que o MSW usa para cookies) precisa subir antes da primeira requisição no 4G lento simulado.
  - **Por que não foi cortada:** isso não existiria numa implantação real. Cortar mexendo no MSW seria uma simplificação só para a pontuação, o que o enunciado veda.
  - **Detalhes:** desktop e as demais categorias cumprem as metas; os experimentos estão em `lighthouse/ANALISE.md`.
- **Frames não vistos** (Carrinho, Confirmação e Carteiras desktop; balão de cadastro desktop, que usa os textos do frame mobile): seguem o padrão das telas extraídas.
- **Baselines visuais geradas no Windows:** por isso `test:visual` fica fora do `test:e2e`. Em outro sistema, rode `npm run test:visual:update` antes.
- **Ambiente simulado:**
  - o banco vive no `localStorage` do navegador;
  - os eventos não atravessam abas;
  - o binding do Socket.IO não tem rooms (o filtro por usuário é feito à mão).
- **Fora do escopo do enunciado:** recuperação de senha, login social, páginas editoriais, atividade e coleção. Esses itens têm o visual do Figma, mas ficam marcados como "em breve", sem aparentar funcionar.

---

## 9. Documentos

| Documento | Para quê |
|---|---|
| [README.md](README.md) | Setup, comandos, variáveis, credenciais, cenários e reprodução de cada fluxo e falha |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Visão geral por tema (contratos, sessão, carrinho, cache, tempo real, UX), decisões, desvios do Figma e limitações |
| [docs/contratos-api.md](docs/contratos-api.md) | Rotas REST, códigos de erro e eventos |
| [docs/design-tokens.md](docs/design-tokens.md) | Medidas e tokens tirados do Figma, tela a tela |
| `docs/04` a `docs/11` | Decisões de cada etapa, com o motivo |
| [docs/12-AUDITORIA-FINAL.md](docs/12-AUDITORIA-FINAL.md) | Conferência item a item contra o enunciado |
| [docs/13-REVIEW-DIA-14-10.md](docs/13-REVIEW-DIA-14-10.md) | Review do primeiro dia: entregas, problemas encontrados e corrigidos |
| [lighthouse/RESULTADOS.md](lighthouse/RESULTADOS.md) e [ANALISE.md](lighthouse/ANALISE.md) | Medições e análise de performance |
