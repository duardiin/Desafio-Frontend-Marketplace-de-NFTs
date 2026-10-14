# Kurio · Marketplace de NFTs

Desafio frontend: marketplace de NFTs em React + TypeScript seguindo o Figma "GreenMint". APIs, autenticação, carteiras, pagamentos e eventos em tempo real são **simulados com MSW**, na camada de rede. Não há blockchain, extensão de carteira ou gateway reais.

- **Deploy:** https://desafio-frontend-marketplace-de-nf-alpha.vercel.app
- **Repositório:** https://github.com/duardiin/Desafio-Frontend-Marketplace-de-NFTs
- **Arquitetura e decisões:** [ARCHITECTURE.md](ARCHITECTURE.md). Contratos REST e eventos: [docs/contratos-api.md](docs/contratos-api.md). Decisões por etapa: `docs/04` a `docs/11`.
- **Lighthouse:** [lighthouse/RESULTADOS.md](lighthouse/RESULTADOS.md) e [lighthouse/ANALISE.md](lighthouse/ANALISE.md).

## O que tem

| Área | Telas e fluxos |
|---|---|
| **Descoberta** | Início com hero, catálogo com busca, filtros, abas, ordenação e paginação na URL, destaque, promoções e blog. Detalhe do NFT com edições, galeria com zoom, avaliações e "Mais desta coleção". Início mobile com o layout próprio do Figma (busca no topo, grade desencontrada e tab bar). |
| **Compra** | Carrinho de visitante e de conta (com mescla ao entrar), cupom e cotação da API. Pagamento com conexão de carteira simulada, revisão com revalidação, pedido idempotente, confirmação e recibo. |
| **Conta** | Login e cadastro no balão do Figma, aberto sobre a tela atual (com rotas próprias para acesso direto), favoritos, perfil (dados, nome ENS, avatar e troca de senha) e carteiras (principal e secundária). |
| **Tempo real** | Preço, disponibilidade e status do pedido ao vivo pelo `socket.io-client`, ignorando duplicatas e eventos antigos e reconciliando com o REST depois de reconectar. |

**Stack:** React 19, TypeScript, Vite, TanStack Router e Query, Axios, Socket.IO client, Tailwind CSS v4, shadcn/ui (Radix), MSW 2 com `@mswjs/socket.io-binding`, react-hook-form, zod, decimal.js, Playwright e Lighthouse.

## Setup

Requisitos: Node 20.19+ (desenvolvido com Node 24) e npm.

```bash
npm ci
npx playwright install chromium   # testes E2E, visuais e Lighthouse
npm run dev                       # http://localhost:5173, com mocks
```

Um checkout limpo roda sem `.env`: os valores padrão ficam em `src/config/env.ts` e espelham o `.env.example`.

Nas versões recentes do npm, o `npm ci` avisa que o `postinstall` do MSW não rodou. Pode ignorar: esse script só copia o `mockServiceWorker.js`, que já está versionado em `public/`.

## Comandos

```bash
npm run dev                 # desenvolvimento com mocks
npm run build               # typecheck + build de produção
npm run preview             # serve o build (mocks ativos)
npm run typecheck           # tsc -b (app, configuração e testes)
npm run lint                # oxlint, falha com warnings
npm run test:e2e            # Playwright: E2E funcionais, desktop (1440) e mobile (390)
npm run test:e2e:ui         # o mesmo, no modo interativo
npm run test:visual         # regressão visual (baselines em tests/visual/__screenshots__)
npm run test:visual:update  # regera as baselines
npm run lighthouse          # build + preview + Lighthouse (resultados em lighthouse/)
```

## Variáveis de ambiente

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Ativa o MSW. Fica `true` também no build publicado. |
| `VITE_API_URL` | `/api` | Base das chamadas REST do cliente Axios. |
| `VITE_MOCK_SCENARIO` | `default` | Cenário inicial dos mocks (ver abaixo). |
| `VITE_HTTP_TIMEOUT_MS` | `10000` | Timeout das chamadas REST. Os testes E2E usam 3000. |
| `VITE_REALTIME_URL` | `wss://realtime.kurio.local` | Servidor Socket.IO. Com mocks, o MSW o intercepta antes da rede. |

Um valor inválido interrompe o app no início, com a variável e o formato esperado na mensagem.

## Credenciais fictícias

| Usuário | E-mail | Senha |
|---|---|---|
| Ana Ribeiro | `ana@kurio.dev` | `Kurio@123` |
| Bruno Carvalho | `bruno@kurio.dev` | `Kurio@123` |

- **Dados distintos:** os dois têm favoritos, carrinho e carteiras diferentes, para demonstrar o isolamento entre contas.
- **Senhas:** o "servidor" simulado guarda só o salt e o hash SHA-256 da senha.

## Cenários e reset dos mocks

O estado da API simulada fica no `localStorage` do navegador e sobrevive ao refresh.

- **Trocar de cenário:** abra qualquer URL com `?cenario=<nome>`, por exemplo `/?cenario=lento`. O cenário vale para a aba até ser trocado, e o parâmetro sai da URL depois de aplicado.
- **Reset:** `?reset=1` restaura os dados iniciais e encerra as sessões. Dá para combinar os dois: `/?cenario=default&reset=1`.
- **Console:** `window.__kurioMock` expõe:
  - `getScenario()`, `setScenario(nome)` e `reset()`;
  - `updateNft(id, { priceEth, available, editionId })`, que muda o "servidor" e gera o evento em tempo real;
  - `expireSessions()`;
  - `realtime.replayLast()`, `realtime.emitStale(id, preço)`, `realtime.goOffline(ms)` e `realtime.connections()`.

| Cenário | Comportamento |
|---|---|
| `default` | Sucesso, latência fixa de 150 ms |
| `vazio` | Catálogo sem resultados |
| `lento` | Todas as respostas com 2,5 s |
| `latencia-variavel` | Latência entre 200 ms e 2 s (sequência determinística) |
| `fora-de-ordem` | Buscas do catálogo alternam 1,8 s e 0,2 s, e as respostas chegam fora de ordem |
| `offline` | Falha de conexão em todas as chamadas |
| `erro-500` | Catálogo e detalhe respondem 500 |
| `falha-temporaria` | A 1ª chamada de cada recurso responde 503; as seguintes funcionam |
| `timeout` | Catálogo e detalhe nunca respondem (estoura o timeout do cliente) |
| `sessao-expirada` | Sessões novas expiram em 30 s |
| `favorito-falha` | Incluir e remover favoritos respondem 500 |
| `pagamento-recusado` | Pagamentos são recusados pela simulação |
| `pedido-timeout` | O pedido é gravado, mas a 1ª resposta estoura o timeout; reenviar com a mesma chave recupera o pedido |
| `preco-alterado` | O preço de um item sobe ao enviar o pedido (409 `QUOTE_OUTDATED`) |
| `edicao-esgotada` | Um item esgota ao enviar o pedido (409 `EDITION_SOLD_OUT`) |
| `carteira-recusada` | A carteira recusa a conexão |
| `carteira-desconectada` | A conexão com a carteira cai no primeiro envio do pedido; reconectar resolve |

Os casos de negócio vêm dos dados e funcionam em qualquer cenário:

- **Cupons:** `KURIO10` dá 10% de desconto e `EXPIRADO` está vencido. Qualquer outro código é inválido.
- **Edições:**
  - `nft-001` (Emerald Ape #042) tem as quatro edições do Figma, com a 1/1 esgotada.
  - `nft-044` (Onyx Relic #001) tem todas as edições esgotadas.
  - `nft-045` (Amber Pilot #777) tem uma única unidade.
- **Conflitos:** cadastro ou perfil com um e-mail já usado (ex.: `ana@kurio.dev`) responde 409 `EMAIL_TAKEN`. Uma segunda carteira principal responde 409 `WALLET_LIMIT`.

## Testes

- **E2E funcionais** (`npm run test:e2e`, ~150 testes em desktop e mobile), em `tests/e2e/`:
  - layout, mocks, sessão, catálogo, detalhe e favoritos;
  - carrinho, pagamento, tempo real, perfil, carteiras e Início mobile;
  - **varredura de overflow** em 14 telas × 390/768/1440 px;
  - **acessibilidade com axe** (WCAG 2.2 AA, sem tolerar violações).

  Os testes de REST passam pelos handlers do MSW, e os de tempo real pelo cliente Socket.IO. Os controles `__kurioMock` só mudam o "servidor" e nunca escrevem no cache do app.
- **Regressão visual** (`npm run test:visual`):
  - Telas: Início, Detalhe, Carrinho e Pagamento em desktop e mobile, mais a primeira tela do Início mobile.
  - Dados estáveis: banco novo, relógio fixo, sem eventos, imagens e fontes carregadas.
  - **As baselines foram geradas no Windows.** Fonte e antialiasing mudam entre sistemas, por isso esse comando fica fora do `test:e2e`. Em macOS ou Linux, rode `npm run test:visual:update` uma vez para gerar as baselines locais e depois `npm run test:visual`.

### Como reproduzir e investigar uma falha

```bash
npx playwright test tests/e2e/checkout.spec.ts                  # um arquivo
npx playwright test -g "timeout" --project=desktop-chromium      # por nome e projeto
npx playwright show-report                                       # relatório HTML (playwright-report/)
npx playwright show-trace test-results/<pasta-do-teste>/trace.zip
```

- **Na falha:** ficam captura e trace em `test-results/`.
- **Servidor:** o Playwright sobe o `npm run dev` sozinho, ou reaproveita um já aberto na porta 5173.
- **Ver no navegador:** `npm run dev` com o cenário do teste na URL (ex.: `/?cenario=pedido-timeout`) mostra o mesmo comportamento.

## Como reproduzir os fluxos

### Sessão
- **Rota protegida:** abra `/perfil` sem sessão. O app vai para o login e, depois de entrar, volta para `/perfil`.
- **Expiração durante o uso:** entre, abra `/perfil` e rode `__kurioMock.expireSessions()`. Na próxima navegação privada (ou no refresh), o app avisa e pede login, voltando à mesma tela. O rascunho do pagamento é preservado.
- **Expiração com a tela aberta:** use `/?cenario=sessao-expirada`. As sessões novas duram 30 s, e o app reage sozinho ao vencer.
- **Troca de usuário:** entre como Ana, saia e entre como Bruno. Nenhum dado da Ana aparece. Com duas abas abertas, entrar ou sair numa delas atualiza a outra.

### Catálogo na URL
Busca, filtros, aba, ordenação e paginação sobrevivem a refresh e ao histórico. Exemplo:

`/?q=golden&colecao=musica,arte-3d&rede=polygon&precoMin=0.5&precoMax=3&aba=em-alta&ordem=preco-asc&pagina=2`

No detalhe, a edição escolhida também fica na URL: `/nft/nft-001?edicao=1-50`.

### Carrinho
- **Visitante:** escolha uma edição no detalhe e clique em COMPRAR. O carrinho sobrevive ao refresh.
- **Itens do visitante preservados:** com itens no carrinho, entre como Ana. Os itens se juntam ao carrinho dela.
- **Cupom:** `KURIO10` (10%), `EXPIRADO` e qualquer outro código para testar o inválido.
- **Preço alterado e esgotado:** com a Ana logada no carrinho, rode `__kurioMock.updateNft('nft-002', { priceEth: '1.79' })` ou `{ available: 0, editionId: '1-1' }`. O carrinho atualiza e avisa sem recarregar.

### Compra e falhas
1. Entre como Ana e abra `/pagamento` (ou use "Finalizar compra" no carrinho).
2. Clique em **Conectar carteira**, depois em **Confirmar compra** (abre a revisão) e em **Confirmar pagamento**.
3. O pedido aparece em `/pedidos/<id>` como "Aguardando confirmação" e, em ~2,5 s, como confirmado, com o recibo.

| Fluxo | Cenário | O que observar |
|---|---|---|
| Pagamento recusado | `?cenario=pagamento-recusado` | Motivo da recusa; o carrinho fica intacto |
| Timeout com recuperação | `?cenario=pedido-timeout` | "Não recebemos a confirmação"; **Tentar de novo** recupera o mesmo pedido |
| Preço alterado na confirmação | `?cenario=preco-alterado` | A revisão mostra o que mudou e pede **Confirmar novos valores** |
| Edição esgotada na confirmação | `?cenario=edicao-esgotada` | Erro com link para revisar o carrinho |
| Carteira recusada | `?cenario=carteira-recusada` | Erro na conexão |
| Carteira desconectada | `?cenario=carteira-desconectada` | A revisão fecha; reconectar e confirmar conclui sem duplicar |

Dois casos de idempotência:
- **Clique repetido:** um duplo clique em **Confirmar pagamento** cria um único pedido.
- **Refresh com pedido pendente:** recarregar a página do pedido enquanto ele está pendente retoma o acompanhamento.

### Tempo real
Os eventos passam pelo `socket.io-client`; com mocks, o servidor Socket.IO é simulado pelo MSW. No console:

- **Preço ou disponibilidade:** com um NFT aberto (ou no carrinho), rode `__kurioMock.updateNft('nft-002', { priceEth: '1.79' })` ou `{ available: 0, editionId: '1-1' }`. A tela atualiza sem recarregar. Se o item estiver no carrinho, aparece um aviso.
- **Cotação desatualizada no checkout:** com a revisão do pagamento aberta, mude o preço de um item do carrinho e clique em **Confirmar pagamento**. A revisão mostra o que mudou e exige nova confirmação.
- **Duplicata e evento antigo:** `__kurioMock.realtime.replayLast()` não repete o efeito, e `__kurioMock.realtime.emitStale('nft-001', '0.10')` não altera o preço.
- **Queda com pedido pendente:** logo depois de confirmar o pagamento, rode `__kurioMock.realtime.goOffline(4000)`. Ao reconectar, o pedido aparece confirmado, sem nova compra.
- **Conexões ativas:** `__kurioMock.realtime.connections()`. Depois do logout, a conexão anterior some.

### Conta
- **Perfil (`/perfil`):** edite os dados e salve; tudo persiste após o refresh.
  - Um e-mail já usado (`bruno@kurio.dev`) mostra o erro da API no campo.
  - O avatar aceita PNG, JPEG ou WebP: o navegador reduz a imagem antes do envio, e "Remover" apaga.
  - Troca de senha: a senha atual errada é recusada; depois da troca, a senha nova passa a valer no login.
- **Carteiras (`/carteiras`):**
  - Bruno tem só a principal: cadastre uma secundária. Solana não se mistura com redes EVM, e o endereço é validado.
  - Na Ana, **Tornar principal** troca os papéis das duas carteiras.
  - "Usar outra carteira?" no pagamento leva até aqui, e o rascunho do pagamento é restaurado na volta.

## Lighthouse

`npm run lighthouse` gera o build, sobe o `vite preview` com os mocks ativos (cenário padrão) e audita Início e Detalhe em mobile e desktop. São 3 medições por combinação, com a mediana por categoria e LCP, CLS e TBT. Usa o Chromium do Playwright.

- **Configuração:** `lighthouse/config.mjs`.
- **Saídas:** relatórios HTML e JSON em `lighthouse/reports/`; resumo, versões e ambiente em `lighthouse/RESULTADOS.md`.

**Resultado:**
- **Desktop:** ~98 em Performance e 100 nas demais categorias.
- **Mobile:** Accessibility, Best Practices e SEO em 100. **Performance ficou em ~79 (Início) e ~76 (Detalhe)**, abaixo da meta de 90. A causa principal é a camada de mocks (~180 KB gzip), que precisa subir antes da primeira requisição no 4G lento simulado. A análise completa e os experimentos estão em [lighthouse/ANALISE.md](lighthouse/ANALISE.md).

## Imagens

As artes do Figma (`design/nfts-original/*.png`, ~2 MB cada) são convertidas em WebP de 256, 512 e 900 px por `node scripts/optimize-images.mjs`, usando o Chromium do Playwright. As versões ficam em `public/nfts/` e são versionadas.
