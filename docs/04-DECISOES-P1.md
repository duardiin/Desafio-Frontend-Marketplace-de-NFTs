# Decisões do bloco P1 (tema, layout, skeleton, Router, Query, Axios)

Registro do que foi feito de forma diferente do Figma, do `design-tokens.md` ou do padrão das bibliotecas, com o motivo de cada escolha.
O resumo está em `ARCHITECTURE.md`; aqui fica o detalhe.

---

## 1. Tema e tokens

### 1.1 Tokens do Figma com nomes próprios, separados dos do shadcn
**O que mudou:** os tokens do Figma que não têm equivalente direto no shadcn viraram classes com nomes próprios:

| Token Figma | Classe Tailwind |
|---|---|
| `color/ink` | `bg-ink`, `text-ink` |
| `color/surface-card` | `bg-surface-card` |
| `color/surface-dark` | `bg-surface-dark` |
| `color/text-accent` (#E89B55) | `text-highlight` |
| `color/secondary` (#B39463) | `text-subtle` |
| `color/border-soft` | `border-border-soft` |

Os tokens restantes seguem a tabela de mapeamento do `design-tokens.md` (`--primary`, `--muted-foreground` etc.).

**Por quê:** o Figma chama de `secondary` uma cor de texto (#B39463), mas no shadcn `--secondary` é cor de fundo de botão. Reaproveitar o mesmo nome deixaria `bg-secondary` e o "secondary" do Figma significando coisas diferentes. Com nomes distintos, não há ambiguidade, e os componentes do shadcn continuam funcionando sem ajuste.

### 1.2 Classe `dark` fixa no `<html>`, sem tema claro
**O que mudou:** removi o bloco `.dark` e as variáveis de tema claro, `sidebar-*` e `chart-*`. Os tokens ficam só em `:root`, e o `<html>` recebe `class="dark"` e `color-scheme: dark`.

**Por quê:** o Figma só tem tema escuro. A classe `dark` fixa faz com que as variantes `dark:` que o shadcn já escreve nos componentes (pensadas para fundo escuro) sejam aplicadas, sem eu precisar editar cada componente gerado. `color-scheme: dark` deixa barras de rolagem e campos nativos escuros. As variáveis de sidebar e gráficos não são usadas no projeto.

### 1.3 Cor `--destructive` criada fora do Figma
**O que mudou:** `--destructive: #FF7A6B`.

**Por quê:** o Figma não tem cor de erro, mas o projeto precisa de erros de formulário e de API. Escolhi um vermelho quente, coerente com a paleta cobre, com contraste de ~7,5:1 sobre `ink` e ~6,9:1 sobre `surface-card`. As duas razões passam do mínimo de 4,5:1 da WCAG AA.

### 1.4 Alturas de linha elevadas onde o Figma usa valor menor que a fonte
**O que mudou:** a escala tipográfica virou classes (`text-display`, `text-heading-28`, `text-body-16`, `text-caption-12`…), com a altura de linha embutida. Onde o Figma define altura de linha menor que o tamanho da fonte, usei um valor maior:

| Estilo | Figma | Projeto |
|---|---|---|
| Heading/22 | 22 / 16 | 22 / 1.25 |
| Body/18 | 18 / 16 | 18 / 24 |
| Body/17 | 17 / 16 | 17 / 22 |
| Body/16 e Body/15 | 16 e 15 / 16 | 16 e 15 / 20 |
| Heading/28 | "normal" | 1.3 |

**Por quê:** no Figma esses estilos aparecem em rótulos de uma linha só, onde a altura de linha pequena não aparece. No navegador, quando o texto quebra (mobile, nomes longos, zoom de 200%), as linhas se sobrepõem. O enunciado exige zoom sem corte. Nos casos de uma linha, a diferença visual é mínima. Itens de filtro com linha de 40 px (Body/15 lh 40) vão usar `leading-10` no próprio componente.

### 1.5 Raios mapeados na escala do Tailwind
**O que mudou:** `rounded-sm` = 4 px (paginação), `rounded-md`/`rounded-lg` = 6 px (botões, inputs), `rounded-xl` = 8 px (cards), `rounded-2xl` = 15 px (imagem do card), `rounded-3xl` = 18 px (promo), `rounded-4xl` = 24 px (hero) e `rounded-banner` = 22 px.

**Por quê:** os componentes do shadcn usam `rounded-md` e `rounded-lg`. Fixar esses dois em 6 px faz os componentes gerados já saírem com o raio do Figma, sem edição.

### 1.6 `cn` configurado com os tokens do projeto
**O que mudou:** [src/lib/utils.ts](../src/lib/utils.ts) passou a criar o `cn` com `createCn`, registrando a escala tipográfica, o raio `banner` e o tracking `brand`. Os componentes de `src/components/ui` agora importam de `@/lib/utils`, e não mais direto do pacote `cn`.

**Por quê:** era um bug real, confirmado em teste. `cn("text-body-16", "text-primary-foreground")` devolvia só `text-primary-foreground`: o merge tratava `text-body-16` como cor de texto e o descartava. O resultado seriam botões com o tamanho de fonte errado. **Atenção:** componentes novos adicionados pelo CLI do shadcn vêm com `import { cn } from "cn"` e precisam ter o import trocado.

### 1.7 Divisória do header com 1 px a 50% em vez de 0,3 px
**O que mudou:** no Figma a linha tem 0,3 px. No código ela tem 1 px com `primary` a 50% de opacidade.

**Por quê:** 0,3 px é arredondado de forma diferente por cada navegador e densidade de tela. Em telas 1x, às vezes a linha some. Com 1 px e meia opacidade, a aparência fina fica parecida e a renderização é estável, inclusive para as baselines de regressão visual.

### 1.8 Container de 1200 px com gutter responsivo
**O que mudou:** utilitário `container-page` = `min(1200px, 100% - 2 × gutter)`, com gutter de 16 px (mobile), 24 px (≥ 768) e 32 px (≥ 1024).

**Por quê:** em 1440 px o resultado é idêntico ao Figma (1200 centralizado, 120 px de margem). Abaixo disso, o Figma só define o frame de 414 px. O gutter de 16 px atende a regra de "sem overflow em 390" com respiro lateral.

### 1.9 Movimento reduzido global
**O que mudou:** além do Skeleton, há uma regra global com `prefers-reduced-motion: reduce` que zera animações e transições (inclusive a do drawer).

**Por quê:** o enunciado pede respeito a essa preferência. Uma regra global cobre também componentes futuros do shadcn, que usam `tw-animate-css`.

---

## 2. Fontes e assets

### 2.1 Roboto Mono via `@fontsource-variable/roboto-mono`
**O que mudou:** instalei o pacote (autorizado) e removi a Geist.

**Por quê:** o Vite empacota os `.woff2` no build, então a fonte é servida pelo próprio site, sem Google Fonts. O pacote declara `unicode-range` por subconjunto: o navegador baixa só o `latin` (~33 KB) para pt-BR, e não os seis arquivos.

### 2.2 Restos do template do Vite removidos
**O que mudou:** apaguei `App.tsx`, `App.css`, `src/assets/{hero.png,react.svg,vite.svg}` e `public/icons.svg`.

**Por quê:** não eram usados e entrariam no build e no Lighthouse.

### 2.3 Ícones do Figma como `<img>`
**O que mudou:** busca, carrinho, login e redes sociais usam os SVGs de `src/assets/figma/`, como `<img>` com `alt`. Só o ícone do menu mobile (hambúrguer) vem do `lucide-react`.

**Por quê:** o enunciado pede os assets do arquivo quando disponíveis. O Figma não tem ícone de menu (o frame mobile ainda não foi extraído), então usei o Lucide, que já é a biblioteca de ícones do shadcn.

---

## 3. Layout

### 3.1 Navegação mobile com drawer (adaptação, sem frame)
**O que mudou:** abaixo de 1024 px, o header mostra KURIO, busca, carrinho e um botão "Abrir menu". O botão abre um Sheet (Radix Dialog) pela direita, com os itens de navegação e o "Entrar".

**Por quê:** o frame mobile do header (`14:5226`) não foi detalhado. Pela regra do CLAUDE.md, não gastei chamada do MCP do Figma para isso. O Radix Dialog entrega de graça o que o enunciado cobra: foco preso, Esc fecha, foco volta ao botão e `role="dialog"` com título. Quando o frame mobile for consultado, o visual pode ser ajustado.

### 3.2 Nav completa só a partir de 1024 px (não 768)
**Por quê:** wordmark (160) + 4 itens com gap de 40 + ações chegam a ~720 px, e a largura útil em 768 é 720. O header ficaria sem folga e quebraria com zoom. Em 768 px (tablet) o drawer é a opção segura.

### 3.3 Sublinhado do item ativo encostado na divisória
**O que mudou:** a barra de 3 px fica na base da linha do header, sobre a divisória.

**Por quê:** o `design-tokens.md` fala em "24 px abaixo do texto". Na captura, a barra aparece colada à divisória. Segui a captura, porque é o resultado visual que o avaliador vai comparar.

### 3.4 Item ativo definido pela rota (`staticData`)
**O que mudou:** cada rota declara `staticData: { navSection, headerDivider }`. Em `/#catalogo`, "Mercado" fica ativo. Na 404, nenhum item fica ativo.

**Por quê:** o Figma marca "Mercado" ativo em telas que não são o catálogo (detalhe, carrinho, pagamento), então o estado ativo do link do router não basta. A `staticData` é tipada e fica junto da rota. O mesmo vale para a divisória, que existe só em algumas telas.

### 3.5 "Mercado" aponta para `/#catalogo`
**Por quê:** decisão aprovada. O catálogo vive na Início, e uma rota `/mercado` duplicada criaria duas URLs para o mesmo estado de busca e filtros.

### 3.6 Itens fora do escopo marcados como "em breve"
**O que mudou:** Criadores, Aprenda, os links editoriais do footer e as redes sociais mantêm o visual do Figma, mas não são links. Têm `aria-disabled`, cursor de bloqueio, `title="Em breve"` e o texto "(em breve)" para leitores de tela. No drawer mobile, "em breve" aparece visível.

**Por quê:** decisão aprovada. O enunciado diz que páginas editoriais não fazem parte da entrega e que nada pode aparentar sucesso funcional.

**Temporário:** busca, carrinho e "Entrar" usam o mesmo componente (`ComingSoon`) até os blocos P3 (sessão), P4 (catálogo) e P5 (carrinho) criarem as rotas. Com o roteamento tipado, um `Link` para uma rota que ainda não existe nem compila. Nos links de Coleções do footer, a ideia é virarem filtros do catálogo no P4.

> **Atualização (estado final):** busca, carrinho e "Entrar" ganharam destino nos blocos seguintes. No footer, "Meu perfil", "Lista de interesse" e as Coleções levam ao perfil, aos favoritos e ao catálogo filtrado (`/?colecao=…`). Os itens editoriais e de ajuda continuam "em breve".

### 3.7 Newsletter informa indisponibilidade
**O que mudou:** o formulário existe e tem label, mas o envio mostra "A newsletter ainda não está disponível nesta versão." numa região `role="status"`.

**Por quê:** não há endpoint de newsletter no escopo. Simular "inscrito com sucesso" seria exatamente o falso sucesso que o enunciado proíbe.

### 3.8 Contato do footer como texto
**Por quê:** `contato@email.com` e o telefone são fictícios. Links `mailto:` e `tel:` levariam a destinos falsos.

### 3.9 Skip link e `<main>` focável
**O que mudou:** "Pular para o conteúdo" é o primeiro item do Tab e leva ao `<main id="conteudo">`.

**Por quê:** não está no Figma, mas é requisito de navegação por teclado. Ele só aparece quando recebe foco.

### 3.10 Footer responsivo
**O que mudou:**
- Em 1440, o footer segue o Figma: 3 medalhões com divisórias e a newsletter numa linha, depois a faixa da marca, as colunas de links e o copyright.
- Em 768, os medalhões ficam em 3 colunas e a newsletter ocupa uma linha inteira.
- Em 390, tudo empilha e os links ficam em 2 colunas.

**Por quê:** não há frame mobile do footer extraído. Mantive a ordem e as cores, mudando só o fluxo.

### 3.11 Títulos da Início
**O que mudou:** por enquanto a Início tem só um `<h1>` oculto e a âncora `#catalogo`.

**Por quê:** hero, catálogo e destaques são do P4 e dependem dos dados da API simulada. Um placeholder visível ("em construção") apareceria no deploy.

---

## 4. Skeleton

**O que mudou em relação ao shadcn:** o `animate-pulse` foi trocado por shimmer. É um gradiente `surface-dark → border-soft → surface-dark` que desliza.
- O componente é `aria-hidden`. O contêiner anuncia o carregamento com `aria-busy` e um texto `role="status"`.
- Com movimento reduzido, a animação e o gradiente saem e fica um bloco estático. Validado no navegador: `animation-name: none` e `background-image: none`.
- O componente não tem tamanho padrão: quem usa sempre informa as dimensões finais, para não deslocar o layout.

**Por quê:** o enunciado pede shimmer e não pulse. A base `surface-dark` aparece tanto sobre `ink` quanto dentro de cards `surface-card`.

**Uso atual:** `PageSkeleton` é o pending padrão do router, enquanto o código ou os dados de uma rota demoram mais de 1 s. O teste E2E com movimento reduzido entra no P4, junto com o skeleton do catálogo, para evitar uma rota artificial só de teste.

---

## 5. Router, Query e Axios

### 5.1 Router file-based
**Por quê:** o plugin já estava instalado e gera code-splitting automático por rota, o que ajuda o Lighthouse. Os tipos das rotas também saem automaticamente, então um link para rota inexistente é erro de compilação. O arquivo gerado, `src/routeTree.gen.ts`, é versionado (o build na Vercel não depende de gerar antes do `tsc`) e fica fora do lint.

**Ajuste de lint:** a regra `only-export-components` foi desligada em `src/routes/**`. Arquivos de rota exportam a constante `Route` por convenção, e o plugin separa o componente. O aviso era falso positivo.

### 5.2 404 e erro de rota
- A 404 é o `notFoundComponent` da raiz e também o padrão. Ela renderiza dentro do layout (header e footer continuam) e funciona em acesso direto (a Vercel já reescreve para `index.html`). O componente aceita título e descrição, para ser reaproveitado em "NFT inexistente".
- `RouteErrorPage` mostra a mensagem do `ApiError` com "Tentar novamente". O botão reseta o boundary do Query e invalida o router, sem recarregar a página. Isso cobre o pedido do enunciado de "falha e recuperação após nova tentativa".

### 5.3 TanStack Query
**O que mudou:**
- `staleTime` de 30 s.
- Retry só para erros transitórios (rede, timeout, 408, 429, 5xx), no máximo 2 vezes.
- Mutations nunca têm retry automático.
- O router usa `defaultPreloadStaleTime: 0`, então quem cuida do cache é o Query.

**Por quê:** repetir um 4xx (validação, sessão, conflito) só atrasa a mensagem de erro. Repetir uma mutation de pedido por conta própria pode gerar duplicidade: a chave de idempotência protege, mas a decisão de tentar de novo deve ser do usuário. O `queryClient` vai no contexto do router para que os loaders das rotas possam fazer prefetch.

### 5.4 Axios e erro normalizado
**O que mudou:**
- Um único `httpClient` (`baseURL` = `VITE_API_URL`, timeout de 10 s).
- Um interceptor converte todo erro em `ApiError` com `kind`: validation, session, permission, not-found, conflict, transient ou unknown. O `kind` vem do status HTTP, e o corpo `{ code, message, fieldErrors }` é aproveitado quando existe.

**Por quê:** a UI decide o que fazer pelo tipo de erro (refazer login, mostrar erros do formulário, oferecer nova tentativa), e não pelo status solto. O contrato ficou mínimo de propósito: o P2 completa com os erros de cada endpoint. O cliente não tem nenhum dado fictício.

---

## 6. Outros

- **Título da página** mudou de "NFT Marketplace" para "Kurio | Marketplace de NFTs", com `meta description` e `theme-color`. A marca na UI é KURIO, e a description conta para o SEO do Lighthouse. O teste de fumaça foi atualizado.
- **Bundle de 516 KB** (161 KB gzip) num chunk só. O Vite avisa. Fica para o P9 (Lighthouse), quando houver rotas reais para dividir. Ainda não medi quais dependências pesam mais.
