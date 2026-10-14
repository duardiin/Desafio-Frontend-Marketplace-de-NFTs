# Decisões do bloco P3 (sessão e rotas protegidas)

Registro do que foi feito de forma diferente do esperado ou do padrão das ferramentas, com o motivo de cada escolha.

---

## 1. Sessão

### 1.1 Token opaco no `localStorage`
**O que foi feito:**
- A API devolve um token opaco com validade, salvo em `localStorage` (`kurio:session-token`).
- O interceptor do Axios envia o token no header `Authorization: Bearer`.
- Ninguém guarda a senha: o formulário a mantém só em memória até o envio.

**Por quê:** num backend real, o recomendado seria um cookie `httpOnly`, que o JavaScript não lê. O MSW roda dentro do navegador e não consegue emitir esse cookie de forma real. Entre `localStorage` e `sessionStorage`, a sessão precisa sobreviver ao refresh e a novas abas, como pede o enunciado. Por isso ficou o `localStorage`. A limitação está registrada.

### 1.2 Sessão como uma query (`['session']`), não como contexto React
**O que foi feito:** a sessão é uma query do TanStack Query, com `staleTime: Infinity`. Login e cadastro gravam o resultado direto no cache, e o logout grava `null`.

**Por quê:** a sessão também é estado remoto. Mantê-la no Query dá um só lugar para ler (`useSession`), para revalidar (`fetchQuery` no guard das rotas) e para reagir a mudanças (assinatura do cache). Assim também se evita um segundo estado global que poderia divergir do cache.

### 1.3 Cache privado sob `['private', userId, ...]`
**O que foi feito:**
- Todo dado de usuário (perfil, e depois favoritos, carrinho, pedidos, carteiras) usa a chave `privateQueryKey(userId, ...)`.
- No login, no logout, na expiração e na troca de usuário em outra aba, o app cancela as requisições em andamento e remove tudo sob `['private']`.

**Por quê:**
- **Isolamento total:** o `userId` dentro da chave garante que dois usuários nunca leiam a mesma entrada de cache, mesmo que a limpeza falhe.
- **Respostas atrasadas:** o cancelamento evita que uma resposta do usuário anterior chegue depois e reapareça.
- **Login sempre limpa:** mesmo sem logout explícito, por exemplo ao entrar como Bruno estando como Ana.

Isso atende ao critério eliminatório "exposição de dados entre usuários".

### 1.4 Três caminhos para detectar expiração
**O que foi feito:**
1. **Na navegação:** o layout privado (`_auth`) revalida a sessão na API a cada entrada numa rota privada (`fetchQuery` com `staleTime: 0`).
2. **Durante o uso:** qualquer chamada autenticada que receba 401 avisa o ciclo de vida da sessão, pelo interceptor do Axios. Os endpoints `/auth/*` ficam de fora, porque tratam o próprio 401.
3. **Com a tela aberta e parada:** um timer dispara no instante de `expiresAt`.

Nos três casos, o app encerra a sessão local e mostra "Sua sessão expirou". Se o usuário estiver numa rota privada, vai para `/login?redirect=<tela atual>&motivo=expirada`.

**Por quê:** o enunciado pede tratar a expiração "durante a navegação e durante o checkout, preservando o contexto". Um caminho só deixa buracos. Só o 401 não detecta quem está parado na tela. Só o timer não detecta uma revogação feita pelo servidor. Só o guard não detecta expiração no meio de uma ação.

**Custo:** uma requisição de sessão (~150 ms no mock) a cada navegação para uma rota privada. É aceitável, porque essas telas já carregam dados privados.

### 1.5 Retorno ao fluxo anterior
**O que foi feito:**
- O `redirect` guarda o `href` completo (caminho + search). Assim, ao voltar para o checkout, os parâmetros da tela também voltam.
- Só são aceitos caminhos internos: começam com `/`, não com `//`, e não são `/login` nem `/cadastro`.
- O rascunho dos formulários do checkout vai ficar no `sessionStorage`, no bloco de pagamento.

**Por quê:** a validação evita open redirect (`?redirect=https://site-malicioso`) e o loop de voltar para o próprio login.

### 1.6 Outra aba entrou ou saiu
**O que foi feito:** o evento `storage` do navegador avisa quando o token muda em outra aba. A aba atual descarta o cache privado e relê a sessão.

**Por quê:** sem isso, uma aba aberta continuaria mostrando os dados da Ana depois de o Bruno entrar em outra aba.

### 1.7 Login errado não conta como sessão expirada
**Por quê:** ver a decisão 1.3 do P2. A API responde 422 para credenciais erradas, então o erro aparece no formulário e não dispara o fluxo de expiração.

---

## 2. Telas

### 2.1 Login e Cadastro como modais com rota própria
**O que foi feito:** `/login` e `/cadastro` renderizam a Início e, por cima, um Dialog (Radix). Fechar o modal (X, Esc ou clique fora) volta no histórico, ou vai para a Início se a pessoa chegou por acesso direto.

**Por quê:** no Figma, Login e Cadastro são modais sobre a home. O enunciado exige acesso direto a qualquer tela, e a rota própria resolve isso, além de permitir o redirecionamento do guard. O Radix garante foco preso, Esc e `aria-hidden` no fundo.

### 2.2 Quem já está autenticado não vê o login
**O que foi feito:** com sessão ativa, `/login` e `/cadastro` redirecionam para o `redirect` ou para a Início.

**Por quê:** evita trocar de usuário sem perceber e evita o loop "voltar para o login".

### 2.3 Menu da conta no header
**O que foi feito:** com sessão ativa, o botão "Entrar" vira um botão com a inicial e o primeiro nome. Ele abre um menu (Radix Dropdown) com nome, e-mail, "Meu perfil" e "Sair". No mobile, as mesmas ações ficam no drawer.

**Por quê:** o frame do header autenticado não foi extraído do Figma. Mantive o mesmo lugar e as mesmas medidas do "Entrar" (35 px de altura, raio 6), para não deslocar o layout.

### 2.4 Perfil mínimo já com dados reais
**O que foi feito:** `/perfil` mostra os dados lidos de `GET /me/profile`, com skeleton, erro e "Tentar novamente". A edição entra no P8.

**Por quê:** era preciso ao menos uma rota privada real para provar a proteção, o retorno pós-login e o isolamento entre usuários. Uma tela vazia ou com dados fixos não provaria nada e seria resposta fictícia fora do MSW.

### 2.5 Avisos (`NotificationRegion`)
**O que foi feito:** uma região de avisos própria, visível e com `aria-live`, no canto inferior. É usada no login, no cadastro, no logout e na expiração, e vai servir também aos eventos em tempo real. Erros têm o prefixo "Erro:", então o aviso não depende só da cor.

**Por quê:**
- **Requisito do enunciado:** feedback acessível de mutations e eventos.
- **Sem dependência nova:** o `sonner` (toast padrão do shadcn) estaria fora da lista de dependências autorizadas.
- **Chamável fora do React:** a expiração é detectada no interceptor do Axios, fora da árvore de componentes, e o store de avisos aceita chamadas de qualquer lugar.

### 2.6 Formulários
**O que foi feito:**
- **Validação:** react-hook-form + zod, com as mesmas regras da API.
- **Erros de campo:** os erros que a API devolve por campo (`fieldErrors`, por exemplo `EMAIL_TAKEN`) vão para o campo certo, e o foco vai para ele.
- **Erro geral:** o restante aparece num alerta no topo (`role="alert"`).
- **Acessibilidade:** cada campo tem label, `aria-invalid` e `aria-describedby` apontando para o erro.
- **Campo:** 40 px de altura e fundo `surface-dark`, como o input da newsletter do Figma.
- **Mobile:** fonte de 16 px no campo, para o iOS não dar zoom ao focar.

**Por quê:** a API continua sendo a autoridade (e-mail duplicado só ela sabe). A validação no cliente só antecipa os erros óbvios.

---

## 3. Testes

### 3.1 Espera pelo `<header>` com seletor CSS
**O que foi feito:** o helper `openApp` espera `page.locator('header')`, e não `getByRole('banner')`.

**Por quê:** com um modal aberto, o Radix marca o resto da página como `aria-hidden`, como deve ser, e o banner some da árvore de acessibilidade. Na primeira execução, todos os testes que abriam `/login` direto travaram por esse motivo. Não era bug do app.

### 3.2 Expiração testada com relógio controlado
**O que foi feito:** um teste usa o cenário `sessao-expirada` (sessões de 30 s) e `page.clock.fastForward('00:35')`.

**Por quê:** o enunciado pede controlar o relógio nos cenários sensíveis a tempo. Esperar 30 s de verdade deixaria o teste lento e frágil.
