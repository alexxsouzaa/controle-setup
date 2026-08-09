# SetFlow — Backend Google Apps Script

Banco de dados do **SetFlow** implementado sobre **Google Planilhas**, exposto como API REST através do **Google Apps Script**.

O frontend **não acessa as planilhas diretamente**. Toda comunicação passa pela API do Apps Script.

## Arquitetura

```text
React (frontend)
    ↓  fetch
Google Apps Script (Web App / API)
    ↓  SpreadsheetApp
Google Planilhas (14 abas)
```

## Estrutura do Banco

| Aba | Descrição | Chave primária |
| --- | --- | --- |
| `usuarios` | Usuários do sistema | `USR0001` |
| `maquinas` | Máquinas de produção | `MAC0001` |
| `linhas` | Linhas de produção | `LIN0001` |
| `maquina_linha` | Relação máquina × linha (N:N) | `MLN0001` |
| `produtos` | Produtos fabricados | `PRO0001` |
| `formatos` | Formatos/embalagens | `FOR0001` |
| `categorias_pecas` | Categorias de peças | `CAT0001` |
| `pecas` | Peças de setup | `PAR0001` |
| `compatibilidade_selagem` | Regras de selagem (faca, mordente, bico de ar) | `CSG0001` |
| `compatibilidade_dimensional` | Regras dimensionais (copo, envase, ponteira, berço) | `CDM0001` |
| `compatibilidade_bico_ar` | Regra combinada (máquina + selagem + diâmetro) | `CBA0001` |
| `fluxos` | Fluxos de setup | `FLW0001` |
| `fluxo_pecas` | Peças de cada fluxo | `FLP0001` |
| `configuracoes` | Chave/valor de configuração | `CFG0001` |

> **Nota:** além dos campos do PRD, as abas `maquinas`, `produtos`, `pecas`, `formatos` e `fluxos` possuem colunas operacionais usadas pelo frontend atual (linhas/ferramentais da máquina, características do motor de compatibilidade, peças do fluxo em JSON, etc.). O `buildSchema` é idempotente: adiciona colunas faltantes sem apagar dados existentes.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `Code.gs` | Entradas `doGet` / `doPost` |
| `Api.gs` | Roteamento por ação e respostas padronizadas |
| `Database.gs` | Esquema das abas, `createDatabase()`, dados iniciais |
| `Entities.gs` | Configuração de cada entidade (prefixo de ID, obrigatórios) |
| `SheetsService.gs` | Leitura/escrita nas planilhas |
| `Crud.gs` | CRUD genérico, validação e geração de IDs |
| `appsscript.json` | Manifesto do projeto (deploy web app) |

## Instalação (cópia manual)

1. Acesse <https://script.google.com> e crie um **Novo projeto**.
2. Para cada arquivo `.gs` desta pasta, crie um arquivo no projeto e cole o conteúdo.
3. Cole o conteúdo de `appsscript.json` em **Configurações do projeto → Manifesto appsscript.json** (o editor gera a partir do manifesto).
4. Na barra de ferramentas, selecione a função `createDatabase` e clique em **Executar**.
5. Autorize o script (Dados → planilhas do Google, propriedades do script, etc.).
6. Confirme o retorno: ele contém o `spreadsheetId` e a `url` da nova planilha.

O banco é criado com as 14 abas, cabeçalhos, dados iniciais de usuários e categorias de peças.

## Publicar como Web App

1. Clique em **Implantar → Nova implantação**.
2. Tipo: **Aplicativo da web**.
3. **Executar como:** `Eu` (a conta que publica).
4. **Quem tem acesso:** `Qualquer pessoa` (MVP) ou `Qualquer pessoa com uma Conta do Google`.
5. Autorize e finalize.
6. Copie a **URL do aplicativo da web** — é essa URL que o frontend consumirá.

## Endpoints

A API usa parâmetros de ação (`entity` + `action`), conforme o PRD §43.

### Listar registros

```text
GET {URL}?entity=maquinas&action=list
```

### Buscar por ID

```text
GET {URL}?entity=maquinas&action=get&id=MAC0001
```

### Criar

```text
POST {URL}?entity=maquinas&action=create
```

```json
{ "nome": "Norden C5", "uo": "Bisnagas", "ativo": true, "created_by": "USR0001" }
```

### Atualizar

```text
POST {URL}?entity=maquinas&action=update&id=MAC0001
```

```json
{ "nome": "Norden C5", "ativo": false }
```

### Excluir

```text
POST {URL}?entity=maquinas&action=delete&id=MAC0001
```

### Outros

```text
GET  {URL}?action=stats                    → contagens por aba
POST {URL}?action=seed                     → reinsere dados iniciais ausentes
POST {URL}?action=reset                    → limpa todas as abas (mantém cabeçalhos)
```

## Formato de Resposta

Sucesso:

```json
{ "success": true, "data": { } }
```

Erro:

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Registro não encontrado." } }
```

## Chamadas a partir do frontend

O Apps Script não aceita preflight CORS. O frontend deve enviar **requisições simples**:

```ts
const res = await fetch(`${SCRIPT_URL}?entity=maquinas&action=create`, {
  method: 'POST',
  redirect: 'follow',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify(payload),
});
const json = await res.json();
```

Nunca usar `Content-Type: application/json` (quebra o redirect do Apps Script) nem cabeçalhos customizados no MVP.

## Segurança

- Nenhuma credencial vive no frontend.
- O acesso `Qualquer pessoa` é adequado para o MVP interno; restrinja quando houver autenticação (PRD §42).
- Validações no frontend e na API (nunca confiar somente no frontend, PRD §39).

## Próximos passos

- Criar o client de API no frontend (`src/lib/api`) consumindo esta URL.
- Substituir `src/lib/storage.ts` pelas queries TanStack Query apontando para a API.

---

## Conexão com o frontend

O frontend já possui o client de API em `src/lib/api/` com fallback para `localStorage`.

1. Copie `.env.example` para `.env` na raiz do projeto.
2. Defina a URL do Web App:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_SCRIPT_ID/exec
```

3. Sem essa variável, o app continua funcionando com `localStorage` (modo desenvolvimento). Com ela, todas as queries (TanStack Query) passam a ler/escrever no Google Planilhas.

As queries vivem em `src/queries/` e não conhecem detalhes do Apps Script — a troca de banco futura (ex.: PostgreSQL) não exige reescrever a interface.
