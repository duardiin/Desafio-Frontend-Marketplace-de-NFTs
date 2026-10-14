# Decisões do bloco P5 (carrinho e cotação)

Registro do que foi feito de forma diferente do esperado, do Figma ou do padrão das ferramentas, com o motivo de cada escolha.

---

## 1. Estado do carrinho

### 1.1 O carrinho fica na API, não no navegador
**O que foi feito:** o carrinho é um recurso da API simulada. O visitante tem um carrinho próprio, identificado por um UUID (`kurio:guest-id`) que o Axios envia no header `X-Guest-Id`. Com sessão ativa, a API usa o carrinho da conta.

**Por quê:**
- **Uma regra só:** disponibilidade por edição, limite por pedido e cupom são validados num único lugar (o "servidor"), seja para visitante ou para usuário.
- **Refresh:** o carrinho sobrevive porque a API simulada persiste o estado.
- **Cotação real:** o resumo do visitante também vem da API.

Um carrinho no `localStorage` do cliente duplicaria essas regras e criaria duas fontes de verdade.

### 1.2 Id do visitante criado só na primeira inclusão
**Por quê:** quem só navega não precisa de carrinho. Assim também não se cria um id a cada visita.

### 1.3 Mescla no login e troca do id do visitante
**O que foi feito:** login e cadastro chamam `POST /cart/merge` com o id do visitante. Os itens são somados ao carrinho da conta, respeitando os limites atuais. Em seguida, o id do visitante é descartado e um aviso informa que os itens foram mantidos. Se a mescla falhar, o login continua e o aviso de erro diz que os itens seguem salvos.

**Por quê:**
- **Requisito do enunciado:** preservar os itens do visitante ao autenticar.
- **Isolamento:** descartar o id evita que, depois do logout, o carrinho antigo de visitante reapareça com itens que já foram para a conta.
- **Login não depende da mescla:** é um efeito secundário do login.

### 1.4 Chaves de cache por dono
**O que foi feito:**
- **Conta:** `['private', userId, 'cart']` e `[..., 'quote']`. Essas chaves são removidas no logout e na troca de usuário, junto com o resto do cache privado.
- **Visitante:** `['cart', 'guest', guestId]`.

**Por quê:** dois donos nunca compartilham uma entrada de cache. O teste "cada usuário vê só o próprio carrinho" cobre isso.

**Detalhe técnico:** na primeira inclusão, o id do visitante nasce durante a mutation. Por isso a chave onde o resultado é gravado é calculada no momento da resposta, e não no render.

### 1.5 Quantidade e remoção sem atualização otimista
**O que foi feito:** cada mudança vai para a API, os botões ficam desabilitados até a resposta, e a cotação é recalculada em seguida.

**Por quê:** o limite depende da disponibilidade atual da edição, que só o servidor sabe. Mostrar uma quantidade que depois volta seria confuso, e o otimismo já está demonstrado nos favoritos. Erros (esgotou, acima do limite) aparecem como aviso.

---

## 2. Cotação

### 2.1 O cliente não calcula valores
**O que foi feito:** subtotal, desconto, taxa de rede, total e o total de cada linha vêm de `GET /cart/quote`. O cliente só formata as strings com decimal.js (`formatEth`).

**Por quê:** o enunciado diz que a cotação da API é a referência do checkout. Calcular no cliente criaria uma segunda fonte, que poderia divergir da API, por exemplo em arredondamento ou numa regra de cupom.

### 2.2 Estados da cotação
- **Carregando:** skeleton com shimmer em cada valor, nas mesmas dimensões.
- **Atualizando:** "Atualizando valores…" depois de cada mudança no carrinho.
- **Erro:** mensagem e "Tentar novamente", sem esconder os itens.

### 2.3 Avisos de preço alterado e de item indisponível
**O que foi feito:**
- **Preço alterado:** se `priceWhenAddedEth` for diferente do preço atual, a linha mostra "Preço atualizado: era X quando você adicionou, agora é Y".
- **Item bloqueado:** os itens que a cotação marca como esgotados ou acima do limite (`blockers`) mostram o motivo na linha e um alerta no resumo.

**Por quê:** é a base do cenário de tempo real do enunciado: preço muda com o item no carrinho, a interface avisa e o resumo atualiza. No P7, o mesmo aviso vai disparar pelo evento `nft.updated` via Socket.IO, sem precisar recarregar.

---

## 3. Telas

### 3.1 Carrinho sem frame do Figma (decisão aprovada)
**O que foi feito:** a tela segue o padrão visual do Detalhe e da Início, porque o frame `11:1278` não foi extraído. A chamada ao Figma foi guardada para o Pagamento.
- Trilha "Início / Mercado".
- Lista de itens com arte, nome, edição, preço unitário, quantidade com os mesmos botões circulares do Detalhe, total da linha e "Remover".
- Resumo em cartão `surface-card` de 380 px à direita (no mobile, abaixo dos itens).
- "Mais desta coleção" no fim, porque o enunciado/Figma cita produtos relacionados no carrinho.

### 3.2 COMPRAR adiciona e abre o carrinho
**O que foi feito:** no Detalhe, COMPRAR adiciona a edição e a quantidade escolhidas e navega para `/carrinho`, com aviso.

**Por quê:** o Figma tem só esse botão (não há "Adicionar ao carrinho" separado). Abrir o carrinho deixa claro o que aconteceu e encurta o caminho da compra.

### 3.3 Badge do carrinho no header
**O que foi feito:** o badge segue o Figma (círculo de 16 px `primary`, borda `ink`, número Tiny/10) e mostra a soma das quantidades. O nome acessível do link inclui a contagem ("Carrinho, 2 itens").

### 3.4 Cupom no próprio campo
**O que foi feito:** os erros da API (`COUPON_INVALID`, `COUPON_EXPIRED`) aparecem no campo, com `aria-describedby`. Com o cupom aplicado, o campo vira "Cupom KURIO10 aplicado" com o botão "Remover cupom". O desconto mostra o código e o percentual.

### 3.5 "Finalizar compra" em breve até o P6
**Por quê:** o pagamento e o pedido são o P6. Um link para uma rota inexistente não compilaria, por causa do roteamento tipado, e um botão que não faz nada aparentaria sucesso.

---

## 4. Testes

### 4.1 Timeout das asserções de 10 s
**O que foi feito:** `expect: { timeout: 10_000 }` no `playwright.config.ts`.

**Por quê:** na primeira rodada da suíte completa (96 testes, 8 workers em paralelo contra o servidor de desenvolvimento), 2 asserções do carrinho passaram dos 5 s padrão. Isolados, os mesmos testes passaram 36 de 36 em 3 repetições, e as 3 rodadas seguintes da suíte completa passaram inteiras. O valor maior dá folga para máquinas mais lentas sem mascarar erro real, porque a asserção continua exigindo o resultado certo.

### 4.2 Mudança "do servidor" pelo controle da API simulada
**O que foi feito:** os testes de preço alterado e de esgotado usam `window.__kurioMock.updateNft(...)` e recarregam a página.

**Por quê:** é a mudança vista pelo REST. No P7, o mesmo cenário vai ser testado sem recarregar, pelo evento Socket.IO.
