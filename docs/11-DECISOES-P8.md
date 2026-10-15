# Decisões do bloco P8 (perfil, carteiras, responsividade e acessibilidade)

Registro do que foi feito de forma diferente do esperado ou do padrão das ferramentas, com o motivo de cada escolha. A parte 1 cobre perfil, carteiras e o Início mobile; as passadas de responsividade e acessibilidade entram na parte 2.

---

## 1. Figma

### 1.1 Perfil extraído, Carteiras não
**O que foi feito:** a 5ª chamada ao MCP foi o Perfil desktop (`9:1238`). As Carteiras (`9:1670`) não foram extraídas.

**Por quê:** a conta tem ~6 chamadas por mês. A última ficou reservada para um frame **mobile**, porque a fidelidade no mobile também conta e nenhum frame mobile foi extraído até aqui. O Perfil traz a barra lateral e os campos que as Carteiras reaproveitam.

### 1.2 O design trouxe campos que o contrato não tinha
**O que foi feito:**
- `Profile` ganhou `ensName` (completo, ex.: `anaribeiro.eth`) e `walletNickname`, obrigatórios como no design.
- O seletor de domínio ao lado do ENS aceita `.eth` e `.box`.
- A `bio` continua na API, mas não aparece na tela, porque não está no design.

**Por quê:** o contrato do P2 foi escrito antes da extração. Seguir o Figma tem prioridade, e manter a `bio` na API evita uma mudança sem ganho.

---

## 2. Área da conta

### 2.1 Uma barra lateral para Perfil, Carteiras e Favoritos
**O que foi feito:** o componente `AccountLayout` reproduz a barra "Meu perfil" (310 px, item ativo com borda de 6 px) e envolve as três telas. "Lista de interesse" leva a `/favoritos`. Atividade, Ofertas, Arquivos baixados e Suporte ficam "em breve": visuais, não focáveis e anunciados como "(em breve)".

**Por quê:** a barra é o mesmo componente nas telas de conta do Figma, e dar a ela as rotas que já existem evita links mortos.

### 2.2 Mobile sem frame
**O que foi feito:** abaixo de 1024 px, a barra vira uma faixa horizontal rolável acima do conteúdo, com o item ativo sublinhado (como as abas do Detalhe). "Sair" fica logo abaixo.

**Por quê:** empilhar os 8 itens (~400 px) empurraria o formulário para fora da primeira tela.

**Bug encontrado e corrigido:** os textos "(em breve)" só para leitores de tela usam `position: absolute`. Dentro de uma faixa rolável sem `position`, eles escapavam do recorte e alargavam o documento para ~1080 px no mobile. A página parecia normal na captura, mas o navegador encolhia o zoom. Com `relative` na faixa, o problema some. A varredura automática de overflow da passada de responsividade vai procurar casos assim nas outras telas.

---

## 3. Perfil

### 3.1 Um "Salvar" para dados e senha
**O que foi feito:**
- O Figma tem um único botão no fim do formulário.
- Ao salvar, os dados vão por `PATCH /me/profile` **só se mudaram**, e a senha por `POST /me/password` **só se foi preenchida**.
- Se a senha falhar depois de os dados terem sido salvos, o aviso diz isso: "Dados do perfil salvos. A senha não foi alterada."
- Sem mudanças, o aviso é "Nada para salvar".

**Por quê:** é o comportamento do design sem enviar requisições à toa. Os três campos de senha são tudo ou nada: preencher qualquer um exige os três.

### 3.2 Erros da API no campo
**O que foi feito:**
- Os erros por campo da API aparecem sob o campo certo e recebem o foco:
  - e-mail em uso (409);
  - nome de usuário em uso;
  - "senha atual incorreta" (422).
- `applyApiErrors` ganhou aliases, porque a API valida `ensName` e o formulário edita nome e domínio separados (`ensLabel` e `ensSuffix`).

### 3.3 Cache e header
**O que foi feito:** a resposta do `PATCH` (e do avatar) é gravada no cache do perfil e no usuário da sessão. O header mostra o nome e o avatar novos na hora, sem outra requisição.

### 3.4 Avatar
**O que foi feito:**
- O navegador recorta ao centro e reduz para 256 px em WebP (qualidade 0,85) antes de enviar. Uma foto de vários MB vira poucos KB.
- O tipo é validado no cliente (PNG, JPEG ou WebP). A API valida de novo, incluindo o limite de 300 KB.
- O avatar é salvo **na hora**, em endpoint próprio, e "Remover" usa o novo `DELETE /me/avatar`.

**Por quê:**
- O avatar é exibido em no máximo 50 px, e o `localStorage` do banco simulado tem limite de tamanho.
- Salvar na hora segue o padrão de "Alterar/Remover" ao lado da imagem e evita perder o upload se a pessoa sair sem clicar em "Salvar".

### 3.5 Mostrar senha
**O que foi feito:** o ícone do Figma (olho riscado) indica o campo oculto. Ao mostrar, entra um olho aberto do Lucide. O botão tem `aria-pressed` e nome "Mostrar senha atual" (e assim por diante).

**Por quê:** o Figma só desenha o estado oculto.

---

## 4. Carteiras

- **Lista:**
  - cartões com papel (Principal ou Secundária), rótulo, provedor, redes e endereço completo;
  - "Tornar principal" na secundária;
  - "Editar" em ambas.
- **Cadastro e edição:**
  - Feitos num diálogo (foco preso e devolvido, Esc fecha), com os campos do Pagamento.
  - Redes em caixas de seleção e papel com o rádio do Figma.
  - As regras são as mesmas da API: Solana não se mistura com redes EVM, e o endereço é EVM (`0x` + 40 hex) ou Solana (base58).
- **Limite:** com principal e secundária cadastradas, "Adicionar carteira" fica desabilitado, com a explicação ao lado. Se a API recusar mesmo assim (409 `WALLET_LIMIT`, ex.: escolher "Principal" quando ela já existe), a mensagem aparece no formulário.
- **Troca de papel:** o `PATCH` devolve a lista inteira, porque promover uma carteira rebaixa a outra. O cache recebe a lista pronta.
- **Pagamento:** usa a mesma chave de cache, então uma carteira nova aparece lá sem recarregar. "Usar outra carteira?" deixou de ser "em breve" e leva a `/carteiras`. O rascunho do pagamento é restaurado na volta.
- **Sem exclusão:** a API simulada não tem `DELETE /me/wallets/:id`, e o enunciado pede principal e secundária, não uma lista livre.

---

## 5. Início mobile (Figma 14:5226, última chamada do mês)

### 5.1 Visual de app abaixo de 768 px
**O que foi feito:**
- **Topo:** no Início, o header some e entram a barra "Explorar coleções" e o botão de filtros em degradê.
- **Hero compacto** (190 px) com o texto do frame mobile ("Seja dono da cultura digital"), que é diferente do desktop.
- **Abas** de 14 px, com sublinhado de 2 px.
- **Grade em duas colunas desencontradas:** a da direita fica 32 px abaixo.
- **Cards:** caixa em degradê com raio 20, coração de 28 px e selo "RARO".
- **Tab bar fixa** em todas as telas.

O tablet (768 px) e o desktop não mudaram.

**Por quê:** é o frame do Figma. Como o enunciado lista o Início como tela principal, ela é a que mais pesa na avaliação mobile.

### 5.2 Comportamento dos elementos novos
- **Busca do topo:** é um campo de verdade. Ao enviar, vira `?q=` e **mantém os filtros** (o diálogo do header desktop começa uma busca nova). O campo acompanha a URL ao voltar no histórico e ao recarregar.
- **Botão de filtros:** abre o mesmo drawer "Filtros" do catálogo, agora controlado pela Início. Mostra quantos filtros estão ativos. Abaixo de 768 px, o botão "Filtros" antigo do catálogo some; entre 768 e 1023 px, continua.
- **Tab bar:**
  - Atalhos: Início, Favoritos, Carrinho (com contagem) e Minha conta (Perfil e Carteiras), com `aria-current`.
  - Favoritos e Minha conta pedem login a visitantes, pelas rotas protegidas.
  - Os ícones são recoloridos por máscara CSS: ativo em `text-accent`, inativo em `text-secondary`.
- **Botão central:** a função não está definida no Figma (ler NFT? criar? carteira?). Fica **só visual**: `aria-hidden`, sem foco e sem ação, até a decisão.
- **Fundo curvo da tab bar:** é uma grade de três colunas que sempre cabe na tela. Os lados podem encolher (`minmax(0, 1fr)`) e o recorte central (o mesmo caminho do SVG do Figma) vai de 112 px, em telas de 320, a 152 px, a partir de 414.
  - **Correção feita depois de teste em celulares reais:** na primeira versão, o recorte tinha largura fixa e os lados não encolhiam abaixo dos ícones. Em telas de 360 px, a barra passava da borda (o ícone de perfil ficava cortado) e o recorte saía de baixo do botão central. Os testes em 390 e 414 px não mostravam isso.
  - **Teste novo:** em 320, 360, 375, 390 e 414 px, confere que todos os ícones ficam dentro da tela e que o recorte está centralizado sob o botão. Foi confirmado contra o código antigo, que falha em 320 px.
- **Hero:** só uma versão é montada por vez (`useMediaQuery`), para o celular não baixar a imagem grande do desktop (LCP).

### 5.3 Selo "RARO"
**O que foi feito:** `NftSummary` ganhou `rare`, verdadeiro quando o NFT tem o atributo "Raro" ou "Lendário". O selo só aparece no mobile, como no Figma, e não aparece num NFT esgotado (o selo "Esgotado" tem prioridade).

### 5.4 Efeitos colaterais nos testes
- `openApp` passou a esperar o `<main>`, porque o Início mobile não tem header.
- Os testes mobile que entravam pelo menu do header partem do Carrinho ou usam a tab bar.
- `waitForCatalogIdle` passou a esperar também o skeleton da primeira carga. A busca do topo, mais rápida que o diálogo, revelou essa corrida no helper.

## 6. Passada de responsividade (parte 2)

**Como foi feita:**
- O E2E `responsive.spec.ts` percorre **14 telas**: públicas, privadas com sessão, confirmação de pedido e recibo. Usa **390 px** (projeto mobile, com `isMobile`) e **768 e 1440 px** (desktop).
- Para cada tela, verifica três coisas:
  - `innerWidth` igual à largura pedida (com `isMobile`, o Chrome alarga a viewport em vez de rolar);
  - `scrollWidth` menor ou igual a `clientWidth`;
  - nenhum elemento passando da borda direita fora de um contêiner rolável.
- Com `SHOTS_DIR`, salva capturas de página inteira. Elas foram revisadas uma a uma.

**Achados** (listados antes da correção, como pede o P8):

| # | Achado | Correção |
|---|---|---|
| R1 | Detalhe em 390 px: a aba "Avaliações de colecionadores" quebrava para a segunda linha e ficava sobre o texto. | Abas numa linha só, roláveis no mobile (15 px), como as do catálogo. |
| R2 | Confirmação de pedido: aviso falso "A edição 1/1 … esgotou." depois da própria compra. O `nft.updated` chegava com o carrinho em cache ainda contendo o item. | O aviso de disponibilidade só é dado depois de recarregar o carrinho da API, se o item **ainda** estiver lá. O aviso de preço continua imediato. |
| R3 | Início em 768 px: título do hero em 3 linhas desiguais. | Tamanho intermediário (26/40) entre 768 e 1023 px. |
| R4 | Pagamento em 390 px: endereço só leitura cortado sem indicação. | `text-overflow: ellipsis` em campos só leitura e `title` com o endereço completo. |

Nenhuma das 42 combinações (14 telas × 3 larguras) tem overflow horizontal.

**Armadilha encontrada nos testes:** o primeiro teste de R2 passava **também no código antigo**. `toHaveCount(0)` repete a checagem até 10 s, e o aviso some sozinho em 6 s. A checagem passou a ser instantânea (`count()`), e o teste foi confirmado contra o código antigo (falha) e o novo (passa 3 vezes seguidas).

## 7. Passada de acessibilidade (parte 2)

**Como foi feita:**
- O E2E `a11y.spec.ts` usa `@axe-core/playwright` (instalação autorizada). Regras: WCAG 2.0, 2.1 e 2.2, níveis A e AA, mais as boas práticas do axe.
- Cobre 10 telas e o diálogo de edição de carteira aberto, em desktop e mobile. **Qualquer violação reprova.**

**Achados:**

| # | Achado | Correção |
|---|---|---|
| A1 | `landmark-unique` (Perfil, Carteiras, Favoritos): duas navegações "Meu perfil" (barra lateral e coluna do rodapé). | A barra lateral passou a se chamar "Minha conta" para leitores de tela; o título visível continua "Meu perfil". |
| A2 | `heading-order` (Favoritos): os cards usam `h3` logo depois do `h1`. | `h2` oculto "NFTs favoritados", o mesmo padrão do catálogo. |

**Fora do alcance do axe e já cobertos por E2E:**
- foco preso e devolvido em diálogos e drawers;
- foco no primeiro campo com erro e erros ligados por `aria-describedby`;
- `aria-live` em mutations e eventos;
- link "Pular para o conteúdo";
- teclas de seta nas abas (Radix).

## 8. Login e cadastro no balão do Figma (ajuste final)

**Origem:** print do frame de Login (`9:115`) enviado pelo usuário. Não houve chamada ao MCP, porque o limite do mês já tinha sido usado.

**O que foi feito:**
- **Um balão** de 500 × 600 px com as abas "Entrar | Criar conta".
  - Centralizado, a até 192 px do topo, **sem escurecer a página** (o fundo segue visível, como no frame).
  - Botão de fechar no canto e faixa laranja na base.
  - Campos de 340 px só com placeholder, botão de 45 px e divisória "Ou continue com" de borda a borda.
  - Ícones do Google e do Facebook exportados do próprio arquivo.
- **Abre sobre a tela atual:** antes, "Entrar" navegava para `/login` e trocava a tela pela Início. Agora o header, o menu mobile e o coração (visitante) abrem o balão por cima do que estiver na tela, e fechar ou entrar mantém a página.
- **Rotas mantidas:** `/login` e `/cadastro` continuam para acesso direto, rotas protegidas e sessão expirada. Nelas, as abas trocam de rota mantendo o `redirect`.
- **Cadastro:** o frame `9:1022` não foi visto. Os 656 px dele fecham com nome, e-mail, senha e confirmação, sem "Esqueceu a senha?". A dica de senha forte saiu para respeitar a altura; a regra aparece na mensagem de erro.
- **Fora do escopo:** "Esqueceu a senha?", Google e Facebook mantêm o visual, mas ficam "em breve" (`aria-disabled`, sem foco).

**Acessibilidade:**
- Os campos têm rótulo para leitores de tela.
- O título do diálogo acompanha a aba ativa.
- As abas seguem o padrão WAI-ARIA, com setas do teclado.
- O foco inicial vai para o primeiro campo (antes ia para o "X").
- O foco continua preso no balão, e Esc fecha.

**Testes:**
- **Balão sobre a tela atual:** abre sobre o carrinho e continua no carrinho depois de entrar.
- **Abas:** troca por clique e por setas do teclado.
- **"Em breve":** itens fora do escopo não aparentam funcionar.
- **Abas na rota:** em `/login`, a troca de aba mantém o `redirect`.
- **Visitante no favorito:** continua no NFT depois de entrar.
- **Seletores:** os testes de senha passaram a usar `exact`, porque o campo ganhou o botão "Mostrar senha".

## 9. Telas mobile a partir de prints do Figma (Detalhe, Carrinho e Pagamento)

**Origem:** prints dos frames `15:5536` (Detalhe), `16:360` (Carrinho) e `16:748` (Pagamento), enviados pelo usuário. Não houve chamada ao MCP.

**Base comum:**
- **Sem header e sem tab bar no mobile:** as rotas declaram `mobileHeader: false` e `mobileTabBar: false`.
- **Topo:** voltar (histórico, ou uma rota de reserva no acesso direto) e título.
- **Barra de ação fixa:** `MobileActionBar`, com raio superior de 32, e a página reserva a altura dela.
- **Botão principal:** degradê `bg-cta-gradient`.
- **Versão única:** só uma versão (desktop ou mobile) é montada por vez (`useMediaQuery`), porque as composições são diferentes e dividem o mesmo `h1`.

### 9.1 Detalhe
- **Fiel ao frame:** voltar e favorito no topo, imagem grande, cartão subindo sobre a imagem, pílula de avaliação, edições compactas, ID, coleção e atributos. Barra com "Qtd.", preço, **Comprar NFT** (adiciona e abre o carrinho) e o botão de carrinho (adiciona e continua na página, com aviso).
- **Requisitos do enunciado que o frame não mostra:**
  - **Galeria:** as vistas extras deslizam na horizontal (scroll-snap), com pontos. A lista é focável para as setas do teclado, e os pontos têm área de toque de 24 px. No mobile não há zoom: vale o zoom do próprio celular.
  - **Mais informações:** criador, rede e compartilhamento ficam no fim do cartão; as abas "Detalhes / Avaliações" e o "Mais desta coleção" vêm abaixo.
- **Acessibilidade:** o axe apontou três problemas na primeira versão (`aria-label` num parágrafo, carrossel sem foco pelo teclado, pontos de 8 px). Os três foram corrigidos antes do commit.
- **Testes:**
  - novo teste mobile: sem header e sem tab bar, avaliação, botão de carrinho que fica na página, "Comprar NFT" que abre o carrinho, voltar;
  - favoritos e galeria passaram a testar a versão de cada viewport;
  - baselines visuais da página inteira e da primeira tela (com a barra fixa).

## 10. Testes

- **`profile.spec.ts` (desktop e mobile):**
  - edição de todos os campos, com persistência após refresh;
  - validação no cliente com `aria-invalid` e descrição do erro;
  - e-mail em uso vindo da API, com foco no campo;
  - avatar: arquivo inválido, envio, header, refresh e remoção;
  - senha: confirmação divergente, senha atual errada, mostrar senha, troca efetiva (a antiga passa a dar 422 no login e a nova, 200);
  - navegação pela barra lateral.
- **`wallets.spec.ts`:**
  - troca de papel persistida;
  - cadastro com validação de redes e endereço e persistência;
  - erro `WALLET_LIMIT` da API;
  - edição;
  - link do pagamento.
- **`auth.spec.ts`:** passou a conferir o e-mail pelo valor do campo do perfil, que agora é editável.
- **`mobile-home.spec.ts`** (só mobile):
  - sem header e com tab bar, com o item ativo e o botão central sem foco;
  - filtros pelo botão do topo, com contagem;
  - busca que mantém os filtros e sobrevive ao refresh;
  - selo RARO;
  - atalhos que exigem login;
  - contagem do carrinho.
- **`responsive.spec.ts` e `a11y.spec.ts`:** ver seções 6 e 7.
- **Tempo real:**
  - "edição esgotada por outra pessoa avisa";
  - "a própria compra não gera falso alarme".
- **Resultado:** 156 E2E passando, duas vezes seguidas (com o balão de login e a reconciliação na primeira conexão).
