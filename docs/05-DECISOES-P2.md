# Decisões do bloco P2 (contratos e MSW)

Registro do que foi feito de forma diferente do esperado ou do padrão das ferramentas, com o motivo de cada escolha.
O resumo está em `ARCHITECTURE.md`; os endpoints, em `docs/contratos-api.md`.

---

## 1. Contratos

### 1.1 Tipos TypeScript, sem validação das respostas em runtime
**O que foi feito:** os contratos são `interface`/`type` em `src/api/contracts`, importados tanto pelo cliente quanto pelos handlers do MSW. As respostas não passam por um `schema.parse()` com zod.

**Por quê:** o único servidor é o MSW, que é tipado pelos mesmos contratos. Se um campo mudar, o TypeScript acusa o erro nos dois lados durante o typecheck. Validar em runtime duplicaria cada contrato num schema zod e só pegaria erros que a compilação já pega. O zod continua nos formulários e no `env.ts`, onde a entrada vem de fora.

### 1.2 Códigos de erro estáveis além do status HTTP
**O que foi feito:** cada erro tem um `code` (`QUOTE_OUTDATED`, `EMAIL_TAKEN`…), além do status.

**Por quê:** o status sozinho é ambíguo. Um 409 pode ser e-mail duplicado, item esgotado, cotação velha ou idempotência violada, e cada um pede uma reação diferente na UI. O `kind` (derivado do status) decide a estratégia geral, como repetir, pedir login ou mostrar erro no campo. O `code` decide a mensagem e a ação específica.

### 1.3 Login errado responde 422, não 401
**Por quê:** o cliente trata qualquer 401 como "sessão expirada": limpa o cache privado e manda para o login. Uma senha errada não é sessão expirada; é erro de validação do formulário. Com 422, o erro aparece no próprio formulário de login.

### 1.4 Coleções e redes como slugs, com rótulos separados
**O que foi feito:** a API usa `arte-digital`, `musica`… e os contratos exportam `COLLECTION_LABELS` com "Arte digital", "Música".

**Por quê:** os valores vão para a URL (filtros no search params). Slugs sem acento nem espaço deixam URLs legíveis e estáveis. Os rótulos em pt-BR ficam só na UI.

---

## 2. Regras de negócio no servidor simulado

### 2.1 Cotação com id derivado do conteúdo
**O que foi feito:** o `id` da cotação é um hash de linhas, preços, cupom e taxa. O pedido envia esse `id`. O servidor recalcula a cotação e, se o `id` não bater, responde 409 `QUOTE_OUTDATED`.

**Por quê:** o enunciado pede que "a cotação da API seja a referência" e que "mudanças exijam nova confirmação". O hash resolve as duas exigências sem o servidor guardar cotações nem controlar expiração: qualquer mudança de preço, disponibilidade ou cupom gera outro id. É um mecanismo determinístico e testável.

### 2.2 Idempotência com hash do corpo
**O que foi feito:** o servidor guarda `Idempotency-Key → { usuário, hash do corpo, pedido }`.

**Por quê:** é o comportamento exato pedido no enunciado. A mesma tentativa recupera o mesmo pedido, inclusive depois de um timeout. Reaproveitar a chave com dados diferentes gera conflito, e não um segundo pedido. O mapa é persistido, então a regra também vale depois de um refresh.

### 2.3 Pagamento resolvido por prazo (`settleAt`), não só por timer
**O que foi feito:** o pedido nasce `pending` com um prazo de ~2,5 s. Um `setTimeout` resolve no tempo esperado, e qualquer consulta ao pedido também resolve os pedidos vencidos.

**Por quê:** os mocks rodam na própria aba. Se o usuário recarregar a página com o pedido pendente, o timer morre junto. Sem o prazo gravado, o pedido ficaria pendente para sempre. O cenário "queda de conexão com pedido pendente" do enunciado depende disso.

### 2.4 Confirmação revalida o estoque
**O que foi feito:** na liquidação, o servidor confere de novo se ainda há edições. Se não houver, recusa o pedido com motivo.

**Por quê:** entre a criação e a confirmação, outra compra ou um evento pode esgotar o item. Confirmar sem conferir deixaria a disponibilidade negativa.

### 2.5 Após confirmação, sai do carrinho só o que foi comprado
**Por quê:** é requisito literal do enunciado. Se o carrinho mudar enquanto o pedido está pendente, os itens novos ficam no carrinho.

### 2.6 Taxa de rede fixa por linha (0,0021 ETH)
**Por quê:** o Figma mostra uma taxa, mas não define a regra. Um valor fixo por linha é simples, determinístico e torna os totais verificáveis nos testes.

### 2.7 Carrinho de visitante por `X-Guest-Id`
**O que foi feito:** o visitante tem um carrinho no servidor, identificado por um UUID gerado no navegador. No login, `POST /cart/merge` soma esses itens ao carrinho da conta, respeitando os limites.

**Por quê:** o enunciado pede manter o carrinho após refresh e preservar os itens do visitante ao autenticar. Com o carrinho no servidor, a cotação e as regras de disponibilidade são as mesmas para visitante e usuário, sem duplicar lógica no cliente.

### 2.8 Token inválido não cai para o carrinho de visitante
**Por quê:** se o token expirou, responder com o carrinho de visitante esconderia a expiração e mostraria outro carrinho. O correto é 401, para a UI pedir login de novo.

---

## 3. Cenários

### 3.1 Cenários globais só para rede e falhas; casos de negócio pelos dados
**O que foi feito:** latência, timeout, offline, 5xx, sessão curta e pagamento recusado são escolhidos por `?cenario=`. Cupom inválido ou expirado, NFT esgotado e e-mail já cadastrado vêm dos dados e funcionam sempre.

**Por quê:** os casos de negócio precisam funcionar na mesma sessão. Por exemplo, testar cupom inválido e depois o válido, sem trocar de cenário. Já as condições de rede afetam tudo e por isso precisam ser escolhidas.

### 3.2 Cenários de compra disparam uma vez
**O que foi feito:** `preco-alterado`, `edicao-esgotada` e `pedido-timeout` agem só na primeira tentativa.

**Por quê:** reproduzem exatamente a história do enunciado. O preço muda, o usuário revisa e confirma de novo, e a segunda tentativa passa. Se agissem em toda tentativa, a compra nunca concluiria e não daria para testar a recuperação.

### 3.3 Cenário salvo no `sessionStorage`, dados no `localStorage`
**Por quê:**
- **Dados no `localStorage`:** precisam sobreviver ao refresh.
- **Cenário no `sessionStorage`:** é escolha da aba de demonstração e não deve vazar para outras abas.
- **Testes:** o Playwright cria um contexto limpo por teste. Cada teste parte dos dados iniciais e define o próprio cenário antes de abrir a página.

### 3.4 Sequências determinísticas em vez de `Math.random`
**O que foi feito:** a latência variável e a geração das fixtures usam um PRNG com semente fixa. O cenário fora de ordem alterna 1,8 s e 0,2 s.

**Por quê:** o enunciado pede cenários "reproduzíveis". Com aleatoriedade real, um teste de respostas fora de ordem poderia passar ou falhar por sorte.

### 3.5 Controles em `window.__kurioMock`
**O que foi feito:** com mocks ativos, o console e os testes conseguem trocar o cenário, resetar, mudar preço ou disponibilidade e expirar sessões.

**Por quê:** os cenários de tempo real (preço muda com o item no carrinho) precisam de um gatilho "do lado do servidor". Esses controles alteram o banco simulado, e a mudança chega ao app pelo REST e, no P7, pelo Socket.IO, como exige o enunciado. A UI nunca chama esses controles; só testes e demonstração.

---

## 4. Segurança e dados fictícios

### 4.1 Hash de senha com SHA-256 + salt
**Por quê:** a regra é nunca guardar a senha em claro. O `crypto.subtle` existe em todo navegador moderno sem dependência extra. Um servidor real usaria um algoritmo lento (bcrypt, Argon2); está registrado como limitação, porque aqui é simulação. As fixtures trazem o hash pré-calculado, e o repositório não tem nenhuma senha em claro além da documentada no README.

### 4.2 Endereços de carteira e hashes de transação sintéticos
**O que foi feito:** endereços com formato válido, mas inventados. O hash de transação é derivado do id do pedido. O link de exploração aponta para uma rota interna (`/transacoes/<hash>`).

**Por quê:** o enunciado pede referências e links simulados. Um link para um explorador real (Etherscan) levaria a uma página de "transação inexistente", o que é enganoso.

---

## 5. Infraestrutura

### 5.1 MSW sobe antes do primeiro render
**Por quê:** se o React renderizasse antes do service worker estar ativo, as primeiras requisições iriam para a rede real e falhariam. O custo é carregar o chunk do MSW (~420 KB, 160 KB gzip) antes de mostrar a página. Vai ser medido no P9.

### 5.2 Timeout configurável (`VITE_HTTP_TIMEOUT_MS`)
**Por quê:** o padrão de 10 s é razoável para o usuário, mas deixaria os testes de timeout lentos. Os testes usam 3 s. É configuração de ambiente, não lógica alternativa no cliente.

### 5.3 Testes da camada de mocks via `fetch` dentro da página
**Por quê:** o MSW roda no navegador, então chamadas feitas pelo Node (`page.request`) não passariam por ele. O `fetch` dentro da página passa pelo mesmo service worker que o Axios. Esses testes verificam contratos e regras. Os testes pela interface vêm junto com cada tela.
