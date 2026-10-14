# 01 · Setup: do zero ao primeiro commit e deploy

Tempo estimado: 45 a 60 minutos. Faça tudo nesta ordem.

> Versões e comandos de ferramentas mudam. Se algum comando falhar, rode `--help` dele ou peça ao Claude Code para ajustar, mostrando a mensagem de erro.

## 0. Antes de tudo
- [ ] Mande mensagem ao recrutador: confirmar **horário exato do prazo**, se **ferramentas de IA são permitidas** e (opcional) pedir 2 a 3 dias a mais.
- [x] Anote o prazo aqui: `16/10 às 09:14h`

## 1. Pré-requisitos na máquina
- [ ] **Node.js LTS** (`node -v`) e npm.
- [ ] **Git** (`git --version`).
- [ ] **VS Code** atualizado (a extensão do Claude Code pede 1.98 ou superior: `code --version`).
- [ ] Conta no **GitHub** e na **Vercel** (login com GitHub).
- [ ] Conta Claude **Pro** (ou créditos de API). Confira que a variável `ANTHROPIC_API_KEY` NÃO está definida se for usar a assinatura, senão a cobrança vai para a API.

## 2. Instalar o Claude Code
Siga o guia oficial de instalação: https://docs.claude.com/en/docs/claude-code/overview

No VS Code:
1. Extensões (`Ctrl+Shift+X`), procure **Claude Code**, instale a publicada pela **Anthropic** (selo de verificado).
2. Abra o painel pelo ícone de faísca e entre com a sua conta.
3. Alternativa: no terminal integrado, rode `claude` e faça o login.

## 3. Criar o projeto
```bash
npm create vite@latest nft-marketplace -- --template react-ts
cd nft-marketplace
npm install
git init
```

Copie para a raiz do projeto os arquivos deste kit:
```
CLAUDE.md
docs/00-ENUNCIADO.md
docs/01-SETUP-VSCODE.md
docs/02-PLANO-2-DIAS.md
docs/03-PROMPTS-CLAUDE-CODE.md
```

## 4. `.gitignore` ANTES do primeiro commit
Confirme que contém, no mínimo:
```
node_modules
dist
.env
.env.*
!.env.example
.vercel
```
Não ignore: `tests/**-snapshots` (baselines visuais), `lighthouse/` (relatórios) e `playwright-report` pode ser ignorado, mas gere e guarde o relatório HTML final se o enunciado pedir entrega dele.

## 5. Dependências
```bash
# runtime
npm i @tanstack/react-router @tanstack/react-query axios socket.io-client decimal.js react-hook-form zod @hookform/resolvers

# dev
npm i -D tailwindcss @tailwindcss/vite @tanstack/router-plugin msw @mswjs/socket.io-binding @playwright/test lighthouse

# navegador do Playwright
npx playwright install chromium
```
Depois:
```bash
npx shadcn@latest init           # siga o assistente (Tailwind + Vite)
npx msw init public/ --save      # gera public/mockServiceWorker.js (necessário no build de demonstração)
```
Consulte a documentação de cada ferramenta se o assistente pedir algo diferente; o Claude Code pode conferir isso para você.

## 6. Scripts do `package.json`
Peça ao Claude Code para garantir estes scripts (use o prompt P0 em `03-PROMPTS-CLAUDE-CODE.md`):
`dev`, `build`, `preview`, `typecheck`, `lint`, `test:e2e`, `lighthouse`.

## 7. Variáveis de ambiente
Crie `.env.example` (versionado) e `.env` (ignorado):
```
VITE_ENABLE_MOCKS=true
VITE_API_URL=/api
VITE_MOCK_SCENARIO=default
```
Os mocks precisam estar ativos no build publicado (o enunciado exige).

## 8. Primeiro commit e GitHub
```bash
git add .
git commit -m "chore: setup inicial do projeto"
# crie o repositório no GitHub (público, se a entrega pedir link) e:
git remote add origin <URL_DO_REPO>
git branch -M main
git push -u origin main
```

## 9. Deploy na Vercel (faça AGORA, não no fim)
1. Vercel, **Add New Project**, importe o repositório.
2. Framework: Vite. Build: `npm run build`. Output: `dist`.
3. Variáveis: `VITE_ENABLE_MOCKS=true` (e as demais do `.env.example`).
4. Crie `vercel.json` na raiz para o refresh e acesso direto às rotas funcionarem (SPA):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
5. Confirme que `/mockServiceWorker.js` é servido (abra a URL publicada com `/mockServiceWorker.js`).

## 10. Figma (opcional, com limite)
- Se a sua conta Figma for gratuita ou com assento View, o MCP permite poucas chamadas por mês (a documentação do Figma cita 6). Use em 1 ou 2 frames complexos e **salve o resultado em `docs/design-tokens.md`**.
- Para o resto, use prints dos frames e o Dev Mode/inspeção, se disponível.
- Instalação do MCP (opcional): `claude mcp add --transport http figma https://mcp.figma.com/mcp` e autentique com a conta Figma. Nunca versione tokens.

## 11. Como trabalhar com o Claude Code (para o Pro render)
- Uma tarefa por conversa; abra conversa nova ao mudar de bloco (`/clear`).
- Peça **plano antes do código** nas tarefas grandes e revise.
- Rode `typecheck`, `lint` e testes você mesmo; mande ao agente só o erro.
- Não ligue aprovação automática; leia os diffs.
- Se bater o limite: espere renovar ou ative créditos de uso extra, e use o que resta para o que é eliminatório.

## 12. Checklist final de entrega (copiar para o fim do dia 2)
- [ ] `git clone` novo, `npm ci`, `npm run dev`, `npm run build`, `npm run preview` funcionam.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:e2e` passam.
- [ ] URL pública abre, refresh e acesso direto a rotas funcionam, mocks e Socket.IO funcionando.
- [ ] README.md e ARCHITECTURE.md completos (ver seção 12 do enunciado).
- [ ] Relatórios Lighthouse e baselines versionados.
- [ ] Enviar: link do repositório + URL pública.
