# Decisões do bloco P7 (tempo real com Socket.IO)

Registro do que foi feito de forma diferente do esperado ou do padrão das ferramentas, com o motivo de cada escolha.

---

## 1. Transporte

### 1.1 Socket.IO real no cliente, servidor simulado no MSW
**O que foi feito:**
- **Cliente:** o app usa o `socket.io-client`.
- **Servidor simulado:** fica em `src/mocks/realtime.ts`. É um handler `ws.link` do MSW com o `@mswjs/socket.io-binding`, que codifica e decodifica o protocolo Socket.IO/Engine.IO.
- **Proibição do enunciado respeitada:** nenhum evento é simulado com chamadas diretas a setters ou ao cache. Os testes mudam o "servidor" (banco simulado) ou a conexão, e o evento chega pelo socket.

### 1.2 Só WebSocket (sem long-polling)
**O que foi feito:** `transports: ['websocket']`.

**Por quê:** o MSW intercepta WebSocket. O long-polling do Engine.IO usaria requisições HTTP com um protocolo próprio, que nenhum handler entende, e iria para a rede.

### 1.3 Endereço próprio para o tempo real (`VITE_REALTIME_URL`)
**O que foi feito:** o socket conecta em `wss://realtime.kurio.local`, valor padrão configurável por ambiente, e o mock usa o mesmo endereço no `ws.link`.

**Por quê:** foram dois problemas encontrados na implementação.
1. O MSW remove o prefixo `/socket.io/` do caminho antes de comparar, para casar com `ws.link('wss://servidor')`, que é o uso documentado do binding. Um padrão com `/socket.io/` nunca casava.
2. Usar a origem do próprio site capturaria também o WebSocket do hot reload do Vite, em desenvolvimento.

Um host próprio resolve os dois problemas. O endereço não é acessado: o MSW atende antes da rede.

### 1.4 `socket.io-client` carregado sob demanda
**O que foi feito:** o provider importa a biblioteca dinamicamente, dentro do `useEffect`.

**Por quê:** o `engine.io-client` guarda a referência ao `WebSocket` global **no momento em que o módulo é carregado**. Importado no bundle principal, ele carregava antes de o MSW substituir o `WebSocket`, e a conexão ia para a rede. Carregado depois do bootstrap, usa o `WebSocket` já interceptado. De quebra, a biblioteca sai do bundle inicial.

### 1.5 Heartbeat simulado e timeout de conexão curto
**O que foi feito:**
- O servidor simulado envia o ping do Engine.IO a cada 20 s.
- O cliente usa `timeout: 3000` para a tentativa de conexão.

**Por quê:**
- **Ping:** o binding simula o handshake com `pingInterval` de 25 s, mas não envia pings. Sem eles, o cliente derruba a conexão a cada ~30 s.
- **Timeout:** quando o servidor recusa a conexão antes de abrir (cenário de queda), o `socket.io-client` só tenta de novo depois do timeout de conexão, que é de 20 s por padrão. Com 3 s, a reconexão depois de uma queda fica em segundos.

---

## 2. Eventos

### 2.1 Formato
`{ id, type, resource: { type, id }, version, occurredAt, data }`, mais `userId` no `order.updated`.
- **`id` estável:** `<recurso>:<id>:v<versão>`. Uma duplicata tem o mesmo id.
- **`nft.updated`:** carrega preço, preço anterior, edições com disponibilidade, `soldOut` e versão.
- **`order.updated`:** carrega o pedido completo, o mesmo do REST.

### 2.2 Os eventos nascem das mudanças do banco simulado
**O que foi feito:** o servidor de eventos escuta o mesmo `onDbChange` que as rotas REST usam ao gravar. Uma mudança de preço feita pelo controle de teste, a confirmação de um pedido ou a baixa de estoque geram o evento correspondente.

**Por quê:** o enunciado diz que mudanças nos dados simulados devem aparecer tanto no REST quanto nos eventos. Uma fonte única garante isso.

### 2.3 Duplicatas e eventos antigos
**O que foi feito:**
- **Duplicatas:** um conjunto de ids já processados (limitado a 500) descarta repetições, sem reaplicar efeitos nem repetir avisos.
- **Eventos antigos:** cada evento só é aplicado se a versão for **maior que a do dado em cache**, comparando item a item no detalhe, em cada lista do catálogo, nos favoritos e no carrinho.

**Por quê:** comparar com o dado em cache, e não só com o último evento visto, cobre o caso em que o REST já trouxe uma versão mais nova que a do evento atrasado. Assim, um evento antigo nunca regride o estado.

### 2.4 Carrinho: recarregar da API em vez de recalcular
**O que foi feito:** quando um `nft.updated` afeta um item do carrinho, o app recarrega o carrinho e a cotação da API, e avisa por `aria-live`. Se o preço mudou: "O preço de X mudou: A → B. O resumo do pedido foi atualizado." Se a edição esgotou ou ficou abaixo da quantidade, também avisa.

**Por quê:** os valores do resumo sempre vêm da cotação da API (decisão do P5). O evento serve de gatilho e de aviso, mas não para calcular o total no cliente.

---

## 3. Sessão e isolamento

### 3.1 Um socket por sessão
**O que foi feito:** o socket depende do token da sessão. Login, logout ou troca de usuário encerram o socket anterior, removendo todos os listeners, e abrem um novo. Ao conectar, o cliente envia `session:join { token }`, e o servidor associa a conexão ao usuário (ou ao visitante, se não houver token válido).

**Por quê:** "eventos de uma sessão anterior não podem atualizar dados de outro usuário" e "listeners devem ser liberados ao encerrar seu ciclo de vida". Um E2E confere, pelas conexões ativas do servidor simulado, que depois do logout a Ana não fica inscrita e que o Bruno recebe uma conexão nova.

### 3.2 Duas barreiras para eventos de pedido
- **No servidor:** `order.updated` vai só para as conexões do dono do pedido.
- **No cliente:** um evento cujo `userId` não seja o usuário atual é descartado.

**Por quê:** o binding não tem rooms, então o filtro é feito à mão no servidor simulado. A checagem no cliente protege contra um evento que chegue no meio de uma troca de sessão.

---

## 4. Reconexão e reconciliação

**O que foi feito:**
- **Ao cair:** aviso "Conexão em tempo real perdida. Tentando reconectar…".
- **Ao reconectar:** aviso "restabelecida" e as consultas ativas de NFTs, carrinho e dados privados (pedidos, cotação) são invalidadas, o que as recarrega do REST.
- **Página do pedido:** a consulta a cada 1,5 s do P6 virou uma rede de segurança a cada 15 s. O caminho principal é o evento.

**Por quê:** eventos emitidos durante a queda se perdem. Reconciliar com o REST ao voltar é o que o enunciado pede, e é o que o cenário 2 testa: o pedido é confirmado com o app offline e aparece confirmado depois da reconexão, sem nova compra.

---

## 5. Correção de UX encontrada pelos testes

**Problema:** no cenário de timeout do pedido, o pedido era criado e confirmado no servidor, os eventos chegavam e o carrinho esvaziava. A página de pagamento trocava para "Não há itens para pagar" e desmontava a revisão junto com o botão "Tentar de novo". A pessoa ficaria sem saber o resultado da compra.

**Correção:** enquanto existir uma tentativa de compra salva (sem resposta conclusiva), a tela de pagamento continua montada, mesmo com o carrinho vazio. "Tentar de novo" recupera o pedido existente.

---

## 6. Controles de teste (`window.__kurioMock.realtime`)

| Controle | Efeito (sempre pelo socket) |
|---|---|
| `replayLast()` | Reenvia o último evento com o mesmo id (duplicata) |
| `emitStale(nftId, priceEth)` | Envia `nft.updated` com versão anterior à atual |
| `goOffline(ms)` | Derruba as conexões e recusa reconexões por `ms` |
| `connections()` | Lista as conexões ativas e o usuário de cada uma |

Junto com `updateNft(...)`, que muda o "servidor" e gera um `nft.updated` real, cobrem todos os cenários de tempo real do enunciado.

---

## 7. Limitações do ambiente simulado

- **Recursos do binding:** sem rooms e namespaces (filtro por usuário feito à mão) e sem long-polling. O handshake é simulado pelo binding e o heartbeat pelo servidor simulado.
- **Estado por aba:** o "servidor" roda na aba. Duas abas têm servidores de eventos independentes, embora compartilhem o banco no `localStorage`. Um evento gerado numa aba não chega à outra; a sincronização entre abas vem do evento `storage` (sessão) e da reconciliação.
- **Testes só em desktop:** os testes de tempo real rodam só no projeto desktop, porque a lógica não depende do viewport.
