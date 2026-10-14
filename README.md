# Kurio · Marketplace de NFTs

Desafio frontend: marketplace de NFTs em React + TypeScript seguindo o Figma "GreenMint". APIs, autenticação, carteiras e pagamentos são **simulados com MSW**, na camada de rede. Não há blockchain, extensão de carteira ou gateway reais.

- Repositório: https://github.com/duardiin/Desafio-Frontend-Marketplace-de-NFTs
- Deploy: https://desafio-frontend-marketplace-de-nf-alpha.vercel.app
- Arquitetura e decisões: [ARCHITECTURE.md](ARCHITECTURE.md)
- Contratos REST: [docs/contratos-api.md](docs/contratos-api.md)

## Setup

Requisitos: Node 20.19+ (desenvolvido com Node 24) e npm.

```bash
npm ci
npx playwright install chromium   # só para os testes E2E
npm run dev                       # http://localhost:5173, com mocks
```

Um checkout limpo roda sem `.env`: os valores padrão ficam em `src/config/env.ts` e espelham o `.env.example`.

## Variáveis de ambiente

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Ativa o MSW. Fica `true` também no build publicado. |
| `VITE_API_URL` | `/api` | Base das chamadas REST do cliente Axios. |
| `VITE_MOCK_SCENARIO` | `default` | Cenário inicial dos mocks (ver abaixo). |
| `VITE_HTTP_TIMEOUT_MS` | `10000` | Timeout das chamadas REST. Os testes E2E usam 3000. |
| `VITE_REALTIME_URL` | `wss://realtime.kurio.local` | Servidor Socket.IO. Com mocks, o MSW o intercepta antes da rede. |

## Credenciais fictícias

| Usuário | E-mail | Senha |
|---|---|---|
| Ana Ribeiro | `ana@kurio.dev` | `Kurio@123` |
| Bruno Carvalho | `bruno@kurio.dev` | `Kurio@123` |

Os dois têm favoritos, carrinho e carteiras diferentes, para demonstrar o isolamento entre contas. O "servidor" simulado guarda só o salt e o hash SHA-256 da senha.

## Cenários e reset dos mocks

O estado da API simulada fica no `localStorage` do navegador e sobrevive ao refresh.

- **Trocar de cenário:** abra qualquer URL com `?cenario=<nome>`, por exemplo `/?cenario=lento`. O cenário vale para a aba até ser trocado. O parâmetro sai da URL depois de aplicado.
- **Reset:** `?reset=1` restaura integralmente os dados iniciais e encerra as sessões. Dá para combinar os dois: `/?cenario=default&reset=1`.
- **Console:** `window.__kurioMock` expõe `getScenario()`, `setScenario(nome)`, `reset()`, `updateNft(id, { priceEth, available })` e `expireSessions()`.

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

- **Cupons:** `KURIO10` dá 10% de desconto; `EXPIRADO` está vencido; qualquer outro código é inválido.
- **Edições:** `nft-001` (Emerald Ape #042) tem as quatro edições do Figma, com a 1/1 esgotada. `nft-044` (Onyx Relic #001) tem todas as edições esgotadas. `nft-045` (Amber Pilot #777) tem uma única unidade.
- **Cadastro com e-mail já usado** (`ana@kurio.dev`) responde 409 `EMAIL_TAKEN`.

## Como reproduzir os fluxos do carrinho

- **Visitante:** escolha uma edição no detalhe e clique em COMPRAR. O carrinho sobrevive ao refresh.
- **Itens do visitante preservados:** com itens no carrinho, entre como Ana. Os itens se juntam ao carrinho dela.
- **Cupom:** `KURIO10` (10%), `EXPIRADO` e qualquer outro código para inválido.
- **Preço alterado e esgotado:** com a Ana logada, rode `window.__kurioMock.updateNft('nft-002', { priceEth: '1.79' })` ou `{ available: 0 }` e recarregue o carrinho.

## Como reproduzir a compra e as falhas

1. Entre como Ana e abra `/pagamento` (ou use "Finalizar compra" no carrinho).
2. Clique em **Conectar carteira**, depois em **Confirmar compra** (abre a revisão) e em **Confirmar pagamento**.
3. O pedido aparece em `/pedidos/<id>` como "Aguardando confirmação" e, em ~2,5 s, como confirmado, com o recibo.

As falhas usam os cenários da tabela acima:

| Fluxo | Cenário | O que observar |
|---|---|---|
| Pagamento recusado | `?cenario=pagamento-recusado` | Motivo da recusa; o carrinho fica intacto |
| Timeout com recuperação | `?cenario=pedido-timeout` | "Não recebemos a confirmação"; **Tentar de novo** recupera o mesmo pedido |
| Preço alterado na confirmação | `?cenario=preco-alterado` | A revisão mostra o que mudou e pede **Confirmar novos valores** |
| Edição esgotada na confirmação | `?cenario=edicao-esgotada` | Erro com link para revisar o carrinho |
| Carteira recusada | `?cenario=carteira-recusada` | Erro na conexão |
| Carteira desconectada | `?cenario=carteira-desconectada` | A revisão fecha; reconectar e confirmar conclui sem duplicar |

Para o clique repetido, dê um duplo clique em **Confirmar pagamento**: só um pedido é criado. Recarregar a página do pedido enquanto ele está pendente retoma o acompanhamento.

## Como reproduzir o tempo real

Os eventos passam pelo `socket.io-client`. Com mocks, o servidor Socket.IO é simulado pelo MSW. No console:

- **Preço ou disponibilidade:** com um NFT aberto (ou no carrinho), rode `__kurioMock.updateNft('nft-002', { priceEth: '1.79' })` ou `{ available: 0, editionId: '1-1' }`. A tela atualiza sem recarregar e, se o item estiver no carrinho, aparece um aviso.
- **Cotação desatualizada no checkout:** com a revisão do pagamento aberta, mude o preço de um item do carrinho e clique em **Confirmar pagamento**. A revisão mostra o que mudou e exige nova confirmação.
- **Duplicata e evento antigo:** `__kurioMock.realtime.replayLast()` não repete o efeito, e `__kurioMock.realtime.emitStale('nft-001', '0.10')` não altera o preço.
- **Queda com pedido pendente:** logo depois de confirmar o pagamento, rode `__kurioMock.realtime.goOffline(4000)`. Ao reconectar, o pedido aparece confirmado, sem nova compra.
- **Conexões ativas:** `__kurioMock.realtime.connections()`.

## Estado do catálogo na URL

Busca, filtros, aba, ordenação e paginação ficam na URL e sobrevivem a refresh e ao histórico. Exemplo:

`/?q=golden&colecao=musica,arte-3d&rede=polygon&precoMin=0.5&precoMax=3&aba=em-alta&ordem=preco-asc&pagina=2`

No detalhe, a edição escolhida também fica na URL: `/nft/nft-001?edicao=1-50`.

## Imagens

As artes do Figma (`design/nfts-original/*.png`, ~2 MB cada) são convertidas em WebP de 256, 512 e 900 px por `node scripts/optimize-images.mjs`, usando o Chromium do Playwright. As versões ficam em `public/nfts/` e são versionadas.

## Comandos

```bash
npm run dev          # desenvolvimento com mocks
npm run build        # typecheck + build de produção
npm run preview      # serve o build
npm run typecheck    # tsc -b (app, config e testes)
npm run lint         # oxlint, falha com warnings
npm run test:e2e     # Playwright (desktop 1440 e mobile 390)
npm run lighthouse   # auditoria (implementada no bloco final)
```

## Como reproduzir os fluxos de sessão

- **Rota protegida:** abra `/perfil` sem sessão. O app vai para o login e, depois de entrar, volta para `/perfil`.
- **Expiração durante o uso:** entre, abra `/perfil` e rode `window.__kurioMock.expireSessions()` no console. Na próxima navegação para uma rota privada (ou no refresh), o app avisa e pede login, voltando à mesma tela.
- **Expiração com a tela aberta:** use `/?cenario=sessao-expirada`. As sessões novas duram 30 s e o app reage sozinho ao vencer.
- **Troca de usuário:** entre como Ana, saia e entre como Bruno. Nenhum dado da Ana aparece. Com duas abas abertas, entrar ou sair numa aba atualiza a outra.

O relatório HTML do Playwright fica em `playwright-report/`, e os traces das falhas em `test-results/`.
