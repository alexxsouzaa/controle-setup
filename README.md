# Controle de Setup

Sistema de gestão de setups industriais desenvolvido para padronizar, documentar e agilizar o processo de troca de formato em máquinas de produção.

O projeto tem como objetivo reduzir o tempo de setup, minimizar erros operacionais, preservar o conhecimento técnico da empresa e facilitar a criação, consulta e reutilização de configurações de setup.

---

# Objetivos

O Controle de Setup foi criado para resolver problemas comuns encontrados durante a troca de formato em linhas de produção, como:

* Dificuldade em identificar quais peças devem ser utilizadas.
* Dependência do conhecimento de operadores mais experientes.
* Erros de montagem.
* Falta de padronização entre setups.
* Tempo elevado para preparação das máquinas.
* Ausência de histórico estruturado das configurações utilizadas.

O sistema centraliza todas as informações necessárias para que qualquer operador consiga realizar um setup de forma padronizada e segura.

---

# Principais Funcionalidades

## Gestão de Máquinas

* Cadastro de máquinas
* Associação com uma ou mais linhas de produção
* Cadastro da UO
* Foto opcional da máquina
* Histórico de criação

---

## Gestão de Produtos

* Cadastro de produtos
* Código do produto
* Nome
* Volumetria
* Unidade (ml ou g)
* Características utilizadas pelo motor de compatibilidade

---

## Gestão de Peças

Cadastro das peças utilizadas durante o setup.

Cada peça possui:

* Nome
* Categoria
* Referência ou dimensão
* Máquinas compatíveis
* Foto
* Data de criação
* Responsável pelo cadastro

---

## Gestão de Formatos

Os formatos representam as características físicas necessárias para produção de um determinado produto.

Cada formato pode definir informações como:

* Tipo de selagem
* Volumetria
* Diâmetro da embalagem
* Máquinas compatíveis
* Configuração de setup associada

---

## Criação de Fluxos

O sistema permite criar fluxos completos de setup.

Fluxo resumido:

```text
Selecionar Máquina
        ↓
Selecionar Linha
        ↓
Selecionar Produto
        ↓
Selecionar ou confirmar Formato
        ↓
Motor de Compatibilidade
        ↓
Sugestão automática das peças
        ↓
Revisão
        ↓
Salvar Fluxo
```

Após a criação, o fluxo recebe:

* Nome padronizado
* Data de criação
* Criador
* Status
* Histórico

---

## Motor de Compatibilidade

O diferencial do projeto é o motor de compatibilidade.

Ao invés de armazenar listas fixas de peças, o sistema determina automaticamente quais componentes devem ser utilizados considerando as características do produto.

Atualmente o motor considera principalmente:

### Configuração de Selagem

Responsável por definir:

* Faca
* Mordente
* Conjunto do bico de ar quente

---

### Configuração Dimensional

Responsável por definir:

* Copo
* Bico de envase
* Ponteiras
* Berço
* Conjunto do bico de ar quente

---

### Regras Combinadas

Algumas peças dependem de mais de um critério.

Exemplo:

```text
Máquina
+
Tipo de Selagem
+
Diâmetro
=
Conjunto do Bico de Ar Quente
```

Essa arquitetura permite que novas regras sejam adicionadas sem modificar o restante do sistema.

---

# Arquitetura

O projeto segue uma arquitetura orientada a domínio (Domain-Oriented Architecture) combinada com organização por funcionalidades (Feature-Based Architecture).

```text
src/
│
├── app/
├── assets/
├── components/
│   ├── shared/
│   └── ui/
│
├── features/
│   ├── machines/
│   ├── products/
│   ├── parts/
│   ├── formats/
│   ├── compatibility/
│   └── flows/
│
├── hooks/
├── layouts/
├── lib/
├── stores/
├── styles/
├── types/
└── utils/
```

Cada funcionalidade possui seus próprios componentes, páginas, hooks, schemas, tipos e serviços.

---

# Stack

## Frontend

* React 19
* TypeScript
* Vite 8

## Interface

* Tailwind CSS v4
* shadcn/ui
* Base UI
* Lucide React

## Gerenciamento de Estado

* TanStack Query
* Zustand

## Formulários

* React Hook Form
* Zod

## Componentes

* TanStack Table
* Stepperize

## Qualidade

* Oxlint
* Prettier

## Testes

* Vitest
* React Testing Library
* Playwright

---

# Estrutura do Domínio

O sistema foi modelado a partir do processo real de setup industrial.

```text
Produto
        │
        ▼
Formato
        │
        ▼
Máquina
        │
        ▼
Motor de Compatibilidade
        │
        ▼
Peças Compatíveis
        │
        ▼
Fluxo de Setup
```

O objetivo é que o operador não precise conhecer todas as regras técnicas do processo.

O sistema atua como um assistente de configuração.

---

# Fluxo de Criação de Setup

```text
Selecionar Máquina
        ↓
Selecionar Linha
        ↓
Selecionar Produto
        ↓
Selecionar ou criar Produto
        ↓
Selecionar Formato
        ↓
Executar Motor de Compatibilidade
        ↓
Sugestão automática das peças
        ↓
Selecionar alternativas (quando necessário)
        ↓
Revisão
        ↓
Salvar
```

---

# Tecnologias Futuras

O projeto foi planejado para suportar evolução sem grandes alterações arquiteturais.

Planejamento futuro:

* Supabase
* PostgreSQL
* Supabase Storage
* Supabase Auth
* GitHub Actions
* Vercel

---

# Padrões de Desenvolvimento

O projeto segue algumas regras fundamentais:

* TypeScript obrigatório
* Componentes reutilizáveis
* Separação entre UI e regras de negócio
* Feature-Based Architecture
* Domain-Oriented Architecture
* Server State utilizando TanStack Query
* Client State utilizando Zustand
* Formulários utilizando React Hook Form + Zod

---

# Objetivos de Longo Prazo

* Reduzir o tempo de setup
* Diminuir erros operacionais
* Padronizar procedimentos
* Preservar conhecimento técnico
* Facilitar treinamento de operadores
* Automatizar a seleção de peças
* Criar histórico completo de configurações
* Evoluir para um configurador inteligente de setups industriais

---

# Licença

Este projeto é de uso interno e foi desenvolvido para gerenciamento de setups industriais.

Todos os direitos reservados.
