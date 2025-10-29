# Regras do Projeto Financeiro – Guardiões, Padrões e Bloqueios

Este documento consolida ambiente, padrões, guardiões (checks preventivos), lista de bloqueios e procedimentos de segurança/backup. Objetivo: manter o projeto estável no Replit e local (Windows), reduzir falhas e evitar mudanças perigosas.

## 1) Ambiente e Stack Detectados
- Runtime: Node 20.x (Replit module: `nodejs-20`) e ESM (`"type": "module"`).
- Package manager: `npm`.
- Linguagem: TypeScript 5.6.3 (`strict: true`, `noEmit: true`).
- Frontend: React 18.3.x + Vite 5.4.x, Wouter 3.x, React Query 5.x, Tailwind 3.4.x (+ `@tailwindcss/typography`, `tailwindcss-animate`).
- UI/UX libs: Radix UI, `lucide-react`, `class-variance-authority`, `cmdk`, `vaul`.
- Backend: Express 4.21.x, `express-session`, WebSocket (`ws` 8.18.x), Passport Local.
- DB/ORM: Drizzle ORM 0.39.x, `@neondatabase/serverless` (Neon), Postgres 16 (Replit module).
- Build: Vite para client (gera `dist/public`), esbuild para server (gera `dist/index.js`).
- Paths/aliases: `@ -> ./client/src`, `@shared -> ./shared`, `@assets -> ./attached_assets`.
- Root Vite: `client/`. Saída de build: `dist/public` (em prod, `server/serveStatic` resolve para `dist/public`).

## 2) Scripts e Execução
- `npm run dev`: `NODE_ENV=development tsx server/index.ts` (Replit/Linux).
- `npm run dev:pc`: `cross-env NODE_ENV=development npx tsx server/index.ts` (Windows).
- `npm run build`: `vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`.
- `npm run start`: `NODE_ENV=production node dist/index.js`.
- `npm run check`: `tsc` (type-checking sem emissão).
- `npm run db:push`: `drizzle-kit push` (atentar para diretórios de migração, ver Guardiões).

Observações importantes:
- No Windows, prefira `npm run dev:pc`. Em prompts, se precisar encadear, use `&&` (não use `;`).
- A API e o client servem na mesma porta (`PORT`, default 5000). O Replit já mapeia diversas portas, mas a app expõe 5000.

## 3) Compatibilidade Replit x Local
- Arquivo `.replit`: manter `run = "npm run dev"` e o bloco `[deployment]` estáveis.
- O Vite em dev é injetado via `server/setupVite` com HMR compartilhando o `http.Server`.
- Em produção, `serveStatic` espera os assets em `dist/public` (consistente com `vite.config.ts`).
- Variáveis de ambiente: `DATABASE_URL` é obrigatória para DB (Neon/Postgres). Em desenvolvimento local, defina-a antes de rotas que interagem com DB.

## 4) Guardiões (Checks Preventivos)
Estes guardiões devem ser seguidos antes de alterações críticas. Quando possível, automatizar via scripts de verificação; por ora, documentados como política operacional.

- Validação de Ambiente
  - Node 20.x e `npm` presentes.
  - `tsx`, `vite`, `esbuild`, `typescript` e `drizzle-kit` instalados.

- Validação de Arquivos Críticos
  - Devem existir: `.replit`, `vite.config.ts`, `server/vite.ts`, `server/index.ts`, `client/index.html`, `client/src/main.tsx`, `tailwind.config.ts`, `tsconfig.json`, `shared/schema.ts`.
  - Se algum estiver ausente, abortar alteração e notificar usuário.

- Scripts de Execução
  - Em Windows, usar `npm run dev:pc` para setar `NODE_ENV` com `cross-env`.
  - Em Linux/Replit, `npm run dev` é o padrão.

- Drizzle – Diretórios e Migrações
  - Conferir se `drizzle.config.ts` `out` aponta para `db/migrations` (atualmente está `./migrations`). Se divergente, não executar `db:push` até alinhar diretório para evitar migrações fora do versionamento esperado.
  - Conferir `shared/schema.ts` antes de rodar migrações; realizar backup do diretório de migrações.

- Proteção do `.replit`
  - Não alterar chaves `run`, `[deployment]`, `[[ports]]` e módulos sem revisão. Se necessário, criar backup em `.backups` e notificar.

- Backup Automático de Regras
  - Antes de editar este arquivo, criar cópia em `.backups/project_rules_<timestamp>.md`.
  - Em caso de falha, realizar rollback imediato com o último backup.

<!--
- [DESABILITADO por agora] Hook de Pré-Commit (husky)
  - Rodar `npm run check` e verificador de diffs críticos.
  - Bloquear commit que altere `.replit`, `vite.config.ts`, `server/vite.ts` sem tag `[override-guard]` na mensagem.
-->

## 5) Lista de Bloqueios (ações proibidas/arriscadas)
- Não usar `;` para encadear comandos; sempre `&&`.
- Não commitar segredos (tokens, `DATABASE_URL`). Usar variáveis de ambiente seguras.
- Não alterar `PORT` em produção sem revisão.
- Não apagar/alterar: `.replit`, `vite.config.ts`, `server/vite.ts`, `server/index.ts`, `client/index.html`, `client/public/`, `tailwind.config.ts`, `tsconfig.json` sem backup e notificação.
- Não rodar `npm audit fix --force` sem avaliação de impacto.
- Não executar migrações em produção sem backup dos dados e dos arquivos de migração.
- Não mudar `tsconfig.json` `moduleResolution` (está `bundler`) sem alinhar Vite/TS.
- Não trocar o diretório de saída do Vite (`dist/public`) sem ajustar `serveStatic`.
- Não adicionar dependências globais que existam no runtime do Replit sem necessidade.

## 6) Padrões de Código e Projeto
- TypeScript estrito; preferir tipos explícitos em boundaries (APIs, hooks, contextos).
- Evitar `any`. Permitir `unknown` em fronteiras, refinar com schemas Zod.
- Schemas: usar `zod` e `drizzle-zod` onde possível.
- Arquitetura:
  - Client sob `client/src`, com aliases `@`, `@shared`, `@assets`.
  - Server Express com rotas em `server/routes.ts`. Usar middlewares `isAuthenticated`/`isAdmin` conforme necessidade.
  - Log: preferir `server/vite.ts log()` para padronizar saída no console.
- Estilo UI: Tailwind com tokens CSS (`--background`, `--foreground`, etc.), dark mode via `class`. Reaproveitar componentes shadcn/radix.

## 7) Procedimento de Testes e Tentativas (até 3)
Quando houver alterações de configuração/código:
1. Criar backup do(s) arquivo(s) modificado(s) em `.backups`.
2. Rodar checagens rápidas: `npm run check`.
3. Se aplicável, build: `npm run build` (exige `DATABASE_URL` válido se houver código que inicializa DB em build/runtime). Caso falhe:
   - Tentar corrigir, repetir até 3 tentativas, revisando logs a cada vez.
   - Se falhar 3x, notificar o usuário: escolher rollback (restaurar backups) ou continuar tentando.

## 8) Notificações ao Usuário
- Em dev, logs no console padronizados pelo `log()`.
- No client, usar `Toaster` para ações relevantes (já presente). Futuro: integrar uma barra de status para avisos de guardiões.

## 9) Itens Fututos (comentados)
<!--
- Script "guard:preflight"
  - Verificar Node, TS, Vite, Drizzle, arquivos críticos, `.replit` e diretório de migrações.
  - Saída: lista de OK/ERRO e instruções de correção.

- Hook de CI simples
  - Executar `npm ci && npm run check && npm run build` em ambiente com `DATABASE_URL` ephemeral.

- Lint/Format
  - Adicionar ESLint/Prettier com regras mínimas (TS, React) e integração com Vite.
-->

## 10) Observações e Ações Recomendadas
- Drizzle: alinhar `drizzle.config.ts` `out: "db/migrations"` para refletir a pasta existente no repo. Até lá, evite `db:push`.
- Windows: preferir `npm run dev:pc` durante desenvolvimento.
- Segurança: garantir `express-session` com store persistente em produção (ex.: `connect-pg-simple` já listado). Validar `SESSION_SECRET` via ambiente.
- Emails: `nodemailer` configurado em `emailService.ts` — revisar credenciais em ambiente seguro.

---

Última revisão das regras: atualizada automaticamente pela assistência. Mantenha este arquivo sob versionamento e não o modifique sem criar backup em `.backups`.