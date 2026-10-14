# Decisões do bloco P6 (pagamento, pedido idempotente e recibo)

Registro do que foi feito de forma diferente do esperado, do Figma ou do padrão das ferramentas, com o motivo de cada escolha.

---

## 1. Fluxo de pagamento

### 1.1 Três etapas em uma tela: preencher, conectar e revisar
**O que foi feito:** `/pagamento` (rota privada) segue o frame `11:2862`.
- **Preencher:** à esquerda, o formulário "Perfil do colecionador".
- **Conectar:** à direita, "Seus NFTs", com os totais da cotação, e "Carteira e rede".
- **Revisar:** "Confirmar compra" valida o formulário, exige a carteira conectada, revalida a cotação na API e abre a **revisão** num diálogo. O pagamento só é enviado em "Confirmar pagamento", dentro da revisão.

**Por quê:** o enunciado pede "revisão antes do envio". O Figma não tem uma tela de revisão, e o diálogo mantém o layout da página igual ao frame. O botão do Figma ("Confirmar compra") passa a significar "ir para a revisão", e o envio de fato tem um passo explícito.

### 1.2 Revalidação dupla da cotação
**O que foi feito:** a cotação é buscada de novo ao abrir a revisão e de novo ao clicar em "Confirmar pagamento". Se o `id` mudou (preço, disponibilidade, cupom ou taxa), a revisão mostra o que mudou ("Sage Nomad #089: 1.69 ETH → 1.79 ETH", total antigo → novo) e o botão vira "Confirmar novos valores". A API também rejeita uma cotação velha com 409 `QUOTE_OUTDATED`, que cai no mesmo aviso.

**Por quê:** o enunciado exige revalidar preço, disponibilidade, cupom e taxas antes de confirmar e pedir nova confirmação se algo mudou. A checagem no cliente evita uma ida inútil à API, e a do servidor cobre a mudança que acontece entre as duas.

### 1.3 Conexão de carteira simulada pela API
**O que foi feito:** endpoint novo `POST /checkout/wallet-connection`, com validade de 10 minutos, e `DELETE` para desconectar. O pedido exige um `connectionId` válido, da mesma carteira e rede.
- **Novo cenário `carteira-recusada`:** a conexão é recusada (409 `WALLET_REJECTED`).
- **Novo cenário `carteira-desconectada`:** a conexão cai no envio (409 `WALLET_DISCONNECTED`), a revisão fecha e a pessoa reconecta.
- **Troca de carteira ou rede:** derruba a conexão anterior.

**Por quê:** o enunciado pede "simulação de conexão, recusa e desconexão". Fazer isso na API simulada mantém a regra no "servidor", como as demais, e permite testar pela interface.

### 1.4 Rede limitada pela carteira
**O que foi feito:** o select "Rede" mostra só as redes da carteira escolhida. Trocar para uma carteira que não opera na rede atual ajusta a rede automaticamente.

**Por quê:** evita a combinação inválida de carteira e rede antes de chegar na API, que continua respondendo 409 `WALLET_NETWORK_MISMATCH` se acontecer.

---

## 2. Idempotência e recuperação

### 2.1 Chave por tentativa, guardada no `sessionStorage`
**O que foi feito:** cada tentativa (corpo do pedido) recebe um UUID como `Idempotency-Key`, salvo com o corpo em `kurio:checkout-attempt:<userId>`.
- **Mesmo corpo:** a mesma chave é reutilizada (clique repetido, nova tentativa, refresh).
- **Corpo diferente:** por exemplo, depois de aceitar novos valores, gera uma chave nova.

**Por quê:** é a regra do enunciado. Mesma tentativa = mesmo pedido, e outro conteúdo = outra tentativa. Guardar no `sessionStorage` faz a regra sobreviver a refresh na mesma aba.

### 2.2 Timeout: reenviar exatamente a mesma tentativa
**O que foi feito:** se o envio não tem resposta conclusiva (timeout ou rede), a revisão mostra "Não recebemos a confirmação do pedido. Ele pode ter sido criado." com "Tentar de novo". O botão reenvia **o corpo e a chave salvos**, sem revalidar a cotação.

**Por quê:** se o pedido foi criado, o pagamento já pode ter sido confirmado e retirado os itens do carrinho, o que muda a cotação. Revalidar nesse momento mostraria "valores mudaram" e levaria a uma **segunda compra**. Reenviar a tentativa salva devolve o pedido existente. O teste do cenário `pedido-timeout` confere que fica 1 pedido só.

### 2.3 Trava síncrona contra clique repetido
**O que foi feito:** além de desabilitar o botão, uma `ref` trava o fluxo do clique até o fim do envio.

**Por quê:** entre o clique e o início da mutation há a revalidação da cotação. Nesse intervalo, o `isPending` da mutation ainda é falso e o botão ainda está habilitado. Sem a trava, um duplo clique faria duas revalidações em paralelo. A idempotência da API já impediria o pedido duplicado, mas a trava evita até a segunda requisição. O teste usa `dblclick` e confere 1 pedido.

### 2.4 Retomada após refresh
**O que foi feito:**
- A página do pedido (`/pedidos/$id`) busca o estado na API e consulta a cada 1,5 s enquanto o pedido está pendente.
- No pagamento, um aviso mostra se há pedido pendente, com link para acompanhar, ou se há uma tentativa sem resposta, com o botão "Verificar tentativa", que reenvia a mesma tentativa.

**Por quê:** o enunciado pede recuperar o estado depois de refresh ou reconexão sem criar outra compra. A consulta periódica é provisória: no P7, a atualização vem pelo evento `order.updated` (Socket.IO) e a consulta passa a ser reconciliação.

### 2.5 Rascunho do formulário
**O que foi feito:** os campos são salvos no `sessionStorage` a cada mudança e restaurados ao voltar, inclusive depois de a sessão expirar e a pessoa entrar de novo. O rascunho é apagado quando o pedido é criado.

**Por quê:** é a pendência do P3, "preservar o contexto para retomada" durante o checkout. Coberto por E2E.

---

## 3. Pedido e recibo

### 3.1 Confirmação só com pedido confirmado
**O que foi feito:** o modal "Pedido confirmado", com o recibo, só abre quando a API devolve `status: 'confirmed'`. Pendente mostra "Aguardando confirmação". Recusado mostra o motivo, avisa que nada foi cobrado e que os itens continuam no carrinho.

**Por quê:** "Exibir a confirmação somente para pedido efetivamente confirmado na simulação" é critério eliminatório.

### 3.2 Recibo é o snapshot do pedido
**O que foi feito:** o recibo mostra só os dados gravados no pedido (linhas, preços, totais, carteira, rede, transação), e não os dados atuais do catálogo.

**Por quê:** o enunciado diz que mudanças posteriores no catálogo não podem alterar o recibo.

### 3.3 Confirmação como modal sobre o pedido
**O que foi feito:** no Figma, a Confirmação (`11:4385`) é um modal sobre o Pagamento. Aqui ela é um modal sobre a página do pedido. Ao fechar, o recibo completo continua na página.

**Por quê:** a confirmação precisa de URL própria (`/pedidos/<id>`) para sobreviver a refresh. Sobre o Pagamento, ela sumiria ao recarregar. O frame da Confirmação não foi extraído, para economizar chamadas ao Figma; o modal segue o padrão visual do Login.

### 3.4 Link de exploração simulado
**O que foi feito:** o hash da transação leva a `/transacoes/<hash>`, uma página que diz claramente que é uma referência simulada.

**Por quê:** "Referências de transação e links de exploração são simulados". Um link para um explorador real levaria a "transação não encontrada".

### 3.5 Atualização depois do pagamento
**O que foi feito:** quando o pedido sai de pendente, o app invalida o carrinho, os pedidos e o catálogo, e avisa por `aria-live` ("Pagamento confirmado." ou "Pagamento recusado.").

---

## 4. Campos do Figma (decisão aprovada)

| Campo do Figma | Como ficou | Motivo |
|---|---|---|
| Nome de exibição*, Nome de usuário*, E-mail* | Obrigatórios, pré-preenchidos com o perfil | Dados do colecionador |
| Nome do perfil* | Obrigatório, pré-preenchido com o nome | Segue o Figma |
| Rede*, Tipo de carteira* | Obrigatórios: escolha entre as carteiras cadastradas e suas redes | "Utilizar as carteiras cadastradas" |
| Endereço da carteira* | Só leitura, preenchido pela carteira escolhida | O endereço vem do cadastro da carteira |
| Código de indicação*, Nome ENS* | **Opcionais**, com validação de formato | Exigir um código de indicação travaria qualquer compra |
| ENS ou carteira secundária | Opcional (como no Figma) | — |
| Observação do colecionador | Opcional, até 280 caracteres | — |
| "Usar outra carteira?" | "Em breve" | O cadastro de carteiras é o P8 |

- **Chip "METAMASK • WALLETCONNECT • COINBASE":** no Figma é a primeira opção da lista "Carteira e rede". Aqui ele é um cabeçalho informativo acima da lista, porque não corresponde a uma carteira selecionável.
- **"Desconto do lançamento" e o cupom:** a linha do Figma mostra o desconto da cotação. O texto "Aplique aqui" leva ao carrinho, onde o cupom é aplicado.
- **Linhas do resumo:** mostram a edição ("Edição 1/1") no lugar do "ID do token", porque a cotação é por edição.

---

## 5. Correções feitas durante o bloco

### 5.1 Corrida na gravação do carrinho (bug real)
**Problema:** na primeira inclusão do visitante, o id do carrinho nasce durante a mutation e dispara um `GET /cart` em paralelo com o `POST`. Se o GET respondia depois, gravava o carrinho vazio por cima do resultado. Isso apareceu como falha intermitente: o carrinho ficava vazio depois do COMPRAR.

**Correção:** antes de gravar o resultado de qualquer mutation do carrinho, as leituras em andamento são canceladas (`cancelQueries`).

### 5.2 Teste de expiração com dois gatilhos possíveis
**O que foi feito:** depois de expirar a sessão, o teste tenta clicar em "Conectar carteira", mas aceita que um refetch da própria página detecte a expiração antes.

**Por quê:** os dois caminhos são comportamentos corretos do app. O teste assumir um só causava falha intermitente.

### 5.3 `useWatch` no lugar de `form.watch`
**Por quê:** o lint (regra de compatibilidade com o React Compiler) apontou que `form.watch` impede a memoização. `useWatch` é a forma recomendada pelo react-hook-form.

### 5.4 Rádio selecionado do Figma recortado
**O que foi feito:** o SVG do rádio selecionado tem 39 × 16 px, com o círculo à esquerda. Ele é exibido recortado numa área de 16 px.

**Por quê:** forçar o arquivo em 16 × 16 achatava o círculo.
