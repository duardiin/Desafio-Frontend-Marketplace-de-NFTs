# Decisões do bloco P4 (Início, catálogo, detalhe e favoritos)

Registro do que foi feito de forma diferente do plano, do Figma ou do padrão das ferramentas, com o motivo de cada escolha.

---

## 1. Mudanças de contrato descobertas no Figma

### 1.1 Edições por NFT (1/1, 1/10, 1/50, Aberta)
**O que mudou:**
- O contrato do P2 tinha uma única tiragem por NFT (`editions: { total, available }`). Agora cada NFT tem uma lista de edições, cada uma com disponibilidade própria: `EditionOption { id, label, supply, available }`. `available: null` indica edição aberta.
- **Carrinho:** cada linha agora é NFT + edição, com `lineId = <nftId>__<editionId>`. `PATCH` e `DELETE` passaram para `/cart/items/:lineId`.
- **Cotação e pedido:** carregam a edição em cada linha.
- **Banco simulado:** foi para a versão 2. Estados salvos no formato antigo são descartados automaticamente.

**Por quê:** o frame do Detalhe (extraído com a 3ª chamada ao Figma) mostra a seleção de edição. O enunciado fala em "disponibilidade por NFT **e edição**" e pede tratar "edição indisponível". Sem o modelo por edição, esses requisitos não teriam como ser cumpridos.

### 1.2 Campos novos no detalhe
**O que mudou:** `NftDetail` ganhou `series` (ex.: "Kurio Apes"), `tokenId`, `attributes`, `royaltyPercent`, `story` (os parágrafos da aba "Detalhes do NFT"), `rating` e as 3 avaliações mais recentes (`reviews`). `NftSummary` trocou a tiragem por `soldOut`.

**Por quê:** são as informações que o Figma mostra no detalhe. A "série" é separada da "coleção" porque a sidebar do Figma usa "Coleções" como categorias (Arte digital, Música…), enquanto o detalhe diz "Coleção: Kurio Apes". São conceitos diferentes com o mesmo nome no layout.

### 1.3 Avaliações só para leitura
**O que foi feito:** a aba "Avaliações de colecionadores" mostra a média, o total e as 3 avaliações mais recentes, vindas da API. Não há formulário de avaliação.

**Por quê:** o Figma mostra a contagem e a aba, mas o enunciado não pede avaliações como fluxo. Mostrar os dados da API cumpre o layout sem inventar uma funcionalidade fora do escopo.

---

## 2. Imagens

### 2.1 WebP responsivo gerado por script com o Chromium do Playwright
**O que foi feito:**
- `scripts/optimize-images.mjs` gera, para cada arte, versões WebP de 256, 512 e 900 px, usando o Chromium que já vem com o Playwright.
- Os PNGs originais (~2 MB cada) saíram de `public/` e foram para `design/nfts-original/`, como fonte para gerar as versões de novo.
- O contrato de imagem ganhou `width`, `height` e `variants`. O componente `NftImage` monta `srcset`/`sizes`, reserva a proporção e usa carregamento tardio, exceto na imagem principal da tela.

**Por quê:** cada card baixava ~2 MB, o que inviabilizaria o Lighthouse. As versões ficaram com 8–66 KB, uma redução de mais de 97%. O script não precisa de dependência nova (não há sharp, ImageMagick ou Python na máquina) e fica versionado para reprodução.

### 2.2 A galeria repete a arte principal
**Por quê:** o Figma tem só 4 artes, e o próprio frame do detalhe repete a mesma imagem nas 4 miniaturas. Usar artes de outros NFTs como "galeria" seria enganoso. Cada vista tem texto alternativo próprio ("vista 2 de 4").

---

## 3. Estado na URL

### 3.1 Serialização própria dos search params
**O que foi feito:** o router usa `parseSearch`/`stringifySearch` simples, com texto puro e vírgula nas listas: `/?colecao=musica,arte-3d&rede=polygon&precoMin=0.5&ordem=preco-asc&pagina=2`. Cada rota valida os próprios parâmetros.

**Por quê:** o padrão do TanStack Router serializa em JSON (`?colecao=%5B%22musica%22%5D`, `?precoMin=%220.5%22`). A URL é estado visível, que pode ser copiado e compartilhado, então precisa ser legível.

### 3.2 Chaves da URL em português; da API, no contrato
**O que foi feito:** a URL usa `colecao`, `rede`, `ordem`, `pagina`, e a API usa `collection`, `network`, `sort`, `page`. A conversão fica em `toApiParams`.

**Por quê:** a URL é parte da interface em pt-BR. O contrato da API segue nomes técnicos estáveis.

### 3.3 Normalização dos parâmetros
**O que foi feito:**
- Valores inválidos são descartados.
- As listas ficam em ordem canônica, então "música,arte-3d" e "arte-3d,música" viram a mesma URL.
- Os valores padrão não aparecem na URL (`ordem=recentes`, `aba=todos`, `pagina=1`).
- Qualquer mudança de filtro remove `pagina`.

**Por quê:** cada estado tem uma única URL, então o cache, o histórico e os testes ficam previsíveis. Voltar para a página 1 ao mudar o filtro é exigência do enunciado.

### 3.4 Edição do detalhe na URL (`?edicao=1-50`)
**Por quê:** permite compartilhar o link de uma edição específica e manter a escolha no refresh. A troca de edição usa `replace`, para não encher o histórico.

---

## 4. Catálogo e cache

### 4.1 Respostas fora de ordem
**O que foi feito:**
- A chave da consulta inclui todos os parâmetros, e o `signal` do Query é repassado ao Axios.
- No cenário `fora-de-ordem`, uma resposta atrasada vai para a entrada de cache dela e nunca substitui a tela atual. Se a combinação deixa de ser usada, a requisição é cancelada.
- Há um teste E2E que prova isso: a primeira busca é lenta, a segunda é rápida e a tela final corresponde à segunda.

**Por quê:** é o mecanismo nativo do TanStack Query. Não precisa de contador de requisição nem de "ignorar se for antiga" feito à mão.

### 4.2 Atualização em segundo plano visível
**O que foi feito:** ao trocar filtro, a lista anterior continua na tela (`keepPreviousData`), mas atenuada, com `aria-busy` e o texto "Atualizando…". O skeleton aparece só no primeiro carregamento.

**Por quê:** o enunciado pede o estado de "atualização em segundo plano". Trocar a grade inteira por um skeleton a cada filtro deslocaria o layout e pareceria mais lento.

### 4.3 Estados de erro
- **Sem dados:** mensagem e botão "Tentar novamente".
- **Com dados anteriores:** os resultados continuam visíveis, com aviso de que podem estar desatualizados.

Erros 5xx são repetidos automaticamente 2 vezes antes de aparecer o erro, conforme a política de retry do P1.

### 4.4 Página fora do intervalo
**O que foi feito:** `?pagina=99` mostra "Esta página não existe" com um link para a página 1, em vez de "Nenhum NFT encontrado".

**Por quê:** "vazio" seria uma mensagem falsa, porque há resultados, só não naquela página.

---

## 5. Tela Início

### 5.1 Busca pela lupa do header
**O que foi feito:** a lupa abre um diálogo com o campo de busca. A busca vira `?q=` e aparece como um chip removível acima da grade.

**Por quê:** o Figma só mostra o ícone, sem campo visível. Um diálogo mantém o header igual ao Figma, e o Radix cuida do foco.

### 5.2 Filtros no mobile em drawer
**O que foi feito:** abaixo de 1024 px, a sidebar some e um botão "Filtros", com a contagem de filtros ativos, abre o mesmo painel num drawer.

**Por quê:** o frame mobile da Início não foi extraído. A sidebar de 310 px não cabe ao lado da grade em 390 px.

### 5.3 Checkbox com ícone de marcação
**O que foi feito:** o filtro selecionado usa cor `text-accent` (como no Figma), negrito e um quadradinho com ✓.

**Por quê:** no Figma o estado selecionado é só cor, e o enunciado exige "estados não dependentes apenas de cor".

### 5.4 Banner "NFT em destaque" vindo da API
**O que foi feito:** mostra o NFT mais favoritado (`sort=populares`), com nome e preço sobre a imagem e link para o detalhe.

**Por quê:** "Destaques" é funcionalidade obrigatória da Início. Uma imagem fixa não seria um destaque de verdade. O nome e o preço sobre a imagem não estão no Figma, mas um banner clicável precisa dizer para onde leva.

### 5.5 Promos aplicam filtros reais
**O que foi feito:** "Explorar" do primeiro card abre `?aba=novos`; o do segundo abre `?colecao=arte-digital`.

**Por quê:** botões que levam a uma página vazia ou "em breve" seriam ações sem efeito. Filtrar o catálogo é o comportamento coerente com o texto de cada card.

### 5.6 Blog estático com "Ler mais" em breve
**Por quê:** páginas editoriais estão fora do escopo do enunciado.

### 5.7 Grade de 2 colunas no mobile e 3 a partir de 640 px
**Por quê:** em 390 px, uma coluna mostraria um NFT por tela; duas é o padrão de marketplaces. A partir de 1024 px, fica igual ao Figma: 3 colunas e espaço vertical de 72 px.

---

## 6. Detalhe

### 6.1 Seções do Figma com rótulos corrigidos
**O que foi feito:** no Figma, os textos de "Contrato" e "Direitos autorais" estão trocados: o endereço aparece sob "Direitos autorais" e o percentual sob "Contrato". O código pareia cada título com o conteúdo certo.

### 6.2 Edição esgotada
**O que foi feito:** a pílula da edição esgotada fica desabilitada e riscada, com "(esgotada)" para leitores de tela. A edição selecionada por padrão é a primeira com unidades. Se todas estiverem esgotadas, aparece "Todas as edições estão esgotadas." e a quantidade fica travada.

### 6.3 Quantidade com limite por edição
**O que foi feito:** o limite é o menor valor entre as unidades da edição e o máximo por pedido do NFT. Abaixo das pílulas aparece "4 de 10 disponíveis · máximo de 5 por pedido", anunciado por leitores de tela quando muda.

### 6.4 Zoom com foco controlado
**O que foi feito:** a lupa sobre a imagem abre a versão de 900 px num diálogo. O botão é o gatilho do Radix, então o foco volta para ele ao fechar.

**Problema encontrado no teste:** a primeira versão abria o diálogo por estado React, e o foco se perdia ao fechar. O E2E pegou isso e a correção foi trocar para o gatilho do Radix.

### 6.5 "COMPRAR" em breve até o P5
**Por quê:** comprar significa adicionar ao carrinho, que é o P5, o bloco seguinte. Até lá o botão fica marcado como "em breve", para não aparentar funcionar.

> **Atualização:** resolvido no P5. COMPRAR adiciona ao carrinho e abre o carrinho.

### 6.6 Compartilhar com destinos reais
**O que foi feito:** LinkedIn, e-mail e Twitter usam as URLs públicas de compartilhamento e abrem em nova aba, com aviso para leitores de tela.

**Por quê:** compartilhar não exige backend. O comportamento é real e coerente, como pede o enunciado para links externos.

### 6.7 "Mais desta coleção" sem carrossel funcional
**O que foi feito:** no desktop mostra 5 cards em linha, como no Figma. No mobile vira uma linha rolável com encaixe. O indicador de pontos do Figma aparece como decoração.

**Por quê:** com 5 itens visíveis no desktop, não há o que paginar. Um carrossel com botões só acrescentaria complexidade e mais um componente para tornar acessível.

---

## 7. Favoritos

### 7.1 Atualização otimista com rollback
**O que foi feito:**
- O coração muda na hora (`onMutate` altera o cache).
- Se a API falha, o estado anterior volta e aparece um aviso de erro: "A alteração foi desfeita".
- No fim, a lista é sincronizada com o servidor.
- Cliques repetidos no mesmo NFT são ignorados enquanto a mudança anterior não termina.

**Por quê:** o enunciado pede atualização otimista em pelo menos uma interação. Favoritar é a candidata natural, porque é de baixo risco e frequente.

### 7.2 Latência maior no cenário `favorito-falha`
**O que foi feito:** a falha simulada de favoritar demora 800 ms, e não 150 ms.

**Por quê:** com 150 ms, o estado otimista aparece e some rápido demais para ser visto na demonstração ou verificado no teste. A falha continua determinística.

### 7.3 Visitante vai para o login
**O que foi feito:** clicar no coração sem sessão leva a `/login?redirect=<tela atual>` e, depois de entrar, de volta à tela.

### 7.4 Página "Meus favoritos"
**O que foi feito:** rota protegida `/favoritos`, acessível pelo menu da conta, com skeleton, estado vazio com link para o catálogo e erro com nova tentativa.

---

## 8. Testes

### 8.1 Checkbox clicado pelo rótulo
**Por quê:** o `input` é visualmente oculto (`sr-only`) e o visual fica num elemento ao lado. O Playwright não clica em elementos invisíveis. Clicar no `label` é o que uma pessoa faz.

### 8.2 Espera pelo fim da atualização
**O que foi feito:** o helper `waitForCatalogIdle` espera sumir o "Atualizando…" antes de ler a grade.

**Por quê:** na primeira rodada, alguns testes leram a lista anterior (placeholder) e passaram ou falharam por acaso.

### 8.3 Teste de `falha-temporaria` sem a Início
**Por quê:** a Início agora busca o catálogo ao abrir e consumia a "primeira chamada" do cenário. O teste de contrato passou a abrir uma rota que não consulta o catálogo.
