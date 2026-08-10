# SetFlow — Histórico de Desenvolvimento

Registro do que já foi feito no projeto **SetFlow**, sistema de gestão de setups industriais para padronizar, documentar e agilizar a troca de formato em máquinas de produção.

> Documento mantido como resumo por fases. Para o detalhe completo dos commits, consulte o histórico do git (`git log`).

---

## Visão Geral

O SetFlow centraliza as informações necessárias para que qualquer operador realize um setup de forma padronizada e segura, reduzindo tempo, erros operacionais e a dependência do conhecimento de operadores experientes.

**Stack:** React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · shadcn/ui · TanStack Query · TanStack Table · Zustand · React Hook Form · Zod · Stepperize · Firebase (Firestore).

---

## Linha do Tempo por Fases

### 1. Fundação — SPA e CRUD

- SPA React com CRUD completo de **Máquinas**, **Produtos**, **Peças**, **Formatos** e **Fluxos** de setup.
- Cadastros com cards de identificação, características, foto e registro (criado por / data).
- **Exportação em PDF** via impressão (template padronizado em `utils/pdf`).
- Seleção em massa, paginação e busca nas listas.
- Botão de **reset de dados** na página de exportação.

### 2. Motor de Compatibilidade e Novo Fluxo

- **Motor de compatibilidade baseado em regras** (selagem + diâmetro + regras combinadas), substituindo listas fixas de peças.
- Suporte a peças com critérios de compatibilidade (categoria, máquinas compatíveis, selagem, diâmetro).
- **Wizard de Novo Fluxo em 6 etapas**: máquina, linha, produto, características/formato, sugestão automática de peças (via `resolveSetup`), revisão e conclusão.
- Modo de edição de fluxo com versionamento automático (`V{n}`) e recálculo de peças/ferramentais.
- Modal de seleção de peças com busca, altura fixa e paginação.
- **Detalhe de máquina** (`/maquinas/:id`) com stats, fluxos e formatos relacionados, e **detalhe de formato** (`/formatos/:id`).

### 3. Configurações, Histórico e Dashboard

- Página de **Configurações** no estilo de um painel de opções (abas Geral, UOs, Sistema, Aparência, Notificações).
- **Configurações por UO** (unidade organizacional): ferramentais, tipos de formato, categorias, linhas.
- **Histórico de ações** com filtros por tipo, busca compacta e layout em tabela.
- **Dashboard** com stats (com ícones), fluxos recentes, máquinas e acesso rápido.
- Páginas de **Importar/Exportar** com resumo do arquivo, entidades suportadas e zona de perigo.

### 4. Migrações Técnicas

- **JavaScript → TypeScript** em todo o projeto.
- **Context API → TanStack Query + Zustand** (server state e client state separados).
- **Hash router custom → React Router v7** (data router, com suporte a `useBlocker`).
- **Feature-Based Architecture** (`src/features/*` com types, schemas, api e pages) + `src/lib`, `src/queries`, `src/hooks`, `src/components`.
- Rotas padronizadas em português (`/maquinas`, `/produtos`, `/pecas`, `/formatos`, `/fluxos`, `/novo-fluxo`, `/historico`, `/configuracoes`, `/importar`, `/exportar`).

### 5. Persistência de Dados

- Primeira integração com **Google Apps Script** (backend sobre **Google Sheets**, na pasta `backend/apps-script/`), com mappers de linha → domínio e fallback para `localStorage` quando a API não está configurada.
- Em seguida, **persistência no Firebase Firestore** (projeto `setflow-boti`), com credenciais movidas para variáveis de ambiente (`VITE_FIREBASE_*`).
- **Simplificação da camada de dados:** o **Firestore passou a ser a única camada de persistência**. Foram removidos o backend de Google Sheets (Apps Script) e o fallback `localStorage` (`src/lib/storage.ts`, `mappers.ts` e a API do Apps Script em `src/lib/api/`), mantendo apenas `client.ts`, `endpoints.ts` e `firestore.ts`.

### 6. Design System Industrial

- **Tema shadcn padrão** com `:root` (light) e `.dark`, paleta zinc e accent acromático.
- Aplicação dos **design tokens do SIGMA Studio**: dark-first, densidade industrial, cantos retos, sem glow.
- **Topbar** de 52px com toggle de tema, breadcrumb e trigger de sidebar.
- **Sidebar** colapsável (shadcn sidebar-07), grupos Operação/Catálogo/Sistema, drawer mobile com hamburger.
- Padronização das páginas (padding, tabelas firmware-style com UO badge, paginação, formulários em cards com barra de ações fixa).
- **Responsividade mobile**: scroll horizontal em tabelas, toolbar wrap, min-width, sidebar drawer.

### 7. Marca e Release

- Renome do app para **SetFlow**.
- **Logo SetFlow** no sidebar e favicon.
- **Versão gerada via tags git** exibida no sidebar (`scripts/version.mjs` + `src/version.ts`).
- Deploy configurado para **GitHub Pages**.

### 8. Limpeza e Manutenção

- Remoção de código morto e inconsistências ao longo do desenvolvimento (imports e variáveis não utilizados, arquivos duplicados).
- **Auditoria recente de arquivos sem uso**: análise de alcançabilidade a partir do entry point e remoção de **43 arquivos mortos** (~1.225 linhas) e 28 diretórios vazios — barrels não utilizados, schemas e types órfãos e componentes de UI sem uso.
- `npm run lint` (oxlint) e `npm run build` validando o projeto após as remoções.

---

## Funcionalidades por Domínio

### Máquinas

- Cadastro com nome, **múltiplas linhas**, **UO**, tipo, ferramentais, foto opcional, notas e registro.
- Detalhe com stats, fluxos e formatos relacionados.
- Filtros por UO, seleção em massa, paginação, busca.

### Produtos

- Cadastro com código, nome, categoria, **volumetria**, unidade (ml/g), formato e foto.
- Características usadas pelo motor de compatibilidade.

### Peças

- Cadastro com nome, categoria, referência/dimensão, **máquinas compatíveis** (multi-select), foto, estoque mínimo e registro.
- Critérios de compatibilidade: selagem, diâmetro mínimo/máximo.

### Formatos

- Cadastro com tipo de selagem, volumetria, diâmetro, máquinas compatíveis e peças primárias/alternativas.
- Página de detalhe com rota dedicada.

### Fluxos de Setup

- Wizard de criação em 6 etapas com sugestão automática de peças.
- Nome padronizado, versionamento (`V{n}`), status, histórico e edição.
- Duplicação de fluxo e exportação em PDF.

### Motor de Compatibilidade

- Resolução por **selagem** (faca, mordente, bico de ar quente), **dimensional** (copo, bico de envase, ponteiras, berço) e **regras combinadas**.
- Arquitetura permite adicionar novas regras sem modificar o restante do sistema.

### Configurações

- Configurações por **UO**: ferramentais, tipos de formato, categorias e linhas.
- Interface estilo painel de opções com abas e barra de ações fixa (salvar/descartar).

### Histórico

- Registro de ações com filtros por tipo, busca e layout em tabela.
- Limpar e restaurar histórico.

### Dashboard

- Stats com ícones e subtítulos, fluxos recentes, máquinas em grade e acesso rápido.

### Importar / Exportar

- Exportação completa dos dados (máquinas, produtos, peças, fluxos, formatos, config) em JSON.
- Importação com substituição de entidades e invalidação do cache do TanStack Query.

---

## Arquitetura Atual

```text
src/
├── app/
│   ├── providers/        # AppProviders, QueryProvider
│   └── router/           # rotas e layout
├── components/
│   ├── shared/           # DataTable, PageHeader, SearchInput, etc.
│   └── ui/               # shadcn/ui
├── contexts/             # Tema e Toast
├── features/
│   ├── machines/ products/ pieces/ formatos/
│   ├── flows/ setup-flow/
│   ├── history/ dashboard/ config/
│   ├── compatibility/ import-export/
│   └── ... (pages, schemas, types, api)
├── hooks/ layouts/ lib/ queries/ stores/
```

### Camada de Dados

- **Firestore** como única camada de persistência (coleções: `machines`, `products`, `pieces`, `flows`, `formatos`, `history`, `config`).
- API de acesso em `src/lib/api/` (`client.ts`, `endpoints.ts`, `firestore.ts`), consumida pelos hooks em `src/queries/`.
- `localStorage` usado apenas para preferências de interface (tema, notificações e usuário corrente).

### Qualidade

- **Oxlint** (`npm run lint`).
- **Build** de produção via Vite (`npm run build`).

---

## Pendências e Próximos Passos

- **Feito:** remoção do backend de Google Sheets (Apps Script) e do fallback `localStorage` — a camada de dados agora usa apenas o Firebase Firestore.
- Evolução planejada (segundo o README): Supabase/PostgreSQL, autenticação, GitHub Actions e Vercel.
- Melhorias de desempenho no bundle (chunk único acima de 500 kB, code-splitting).
