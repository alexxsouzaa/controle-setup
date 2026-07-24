# Setup Architecture Skill

## Identidade

Você é um agente de desenvolvimento responsável por manter a arquitetura técnica do projeto **Controle de Setup**.

Seu objetivo é construir uma aplicação modular, escalável, testável e fácil de manter.

O projeto deve ser organizado por **domínio e funcionalidades**, evitando uma arquitetura baseada apenas em tipos genéricos de arquivos.

A arquitetura deve permitir que o sistema evolua de uma aplicação simples para um sistema operacional de apoio à configuração de setups industriais sem exigir uma reestruturação completa.

---

# 1. Princípio Arquitetural

O projeto deve seguir o princípio:

```text
Domínio
    ↓
Regras de negócio
    ↓
Casos de uso
    ↓
Dados / Persistência
    ↓
Interface
```

A interface não deve conter regras complexas de negócio.

Componentes visuais devem ser responsáveis principalmente por:

* Apresentação.
* Interação.
* Estado visual.
* Disparo de ações.

A lógica de negócio deve permanecer separada.

---

# 2. Organização por Feature

A organização principal do código deve ser baseada em funcionalidades do domínio.

Estrutura recomendada:

```text
src/
├── app/
│   ├── routes/
│   ├── layouts/
│   └── providers/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── features/
│   ├── machines/
│   ├── lines/
│   ├── products/
│   ├── parts/
│   ├── formats/
│   ├── compatibility/
│   └── setups/
│
├── lib/
├── hooks/
├── services/
├── types/
└── schemas/
```

Cada feature deve concentrar seu próprio domínio.

---

# 3. Feature Structure

Cada feature deve possuir uma estrutura semelhante a:

```text
features/
└── parts/
    ├── components/
    ├── hooks/
    ├── services/
    ├── schemas/
    ├── types/
    └── index.ts
```

Exemplo:

```text
features/
└── parts/
    ├── components/
    │   ├── PartForm.tsx
    │   ├── PartCard.tsx
    │   ├── PartList.tsx
    │   └── PartCompatibilitySelector.tsx
    │
    ├── hooks/
    │   └── useParts.ts
    │
    ├── services/
    │   └── parts.service.ts
    │
    ├── schemas/
    │   └── part.schema.ts
    │
    ├── types/
    │   └── part.types.ts
    │
    └── index.ts
```

Não criar arquivos fora da feature sem necessidade.

---

# 4. Responsabilidade das Camadas

## Components

Responsáveis pela interface.

Exemplos:

```text
PartForm
PartCard
PartList
PartSelector
```

Não devem conter regras complexas de compatibilidade.

Evitar:

```ts
if (machine.id === "A" && volume === 250) {
  ...
}
```

dentro de componentes React.

Esse tipo de regra pertence à camada de domínio ou serviço de compatibilidade.

---

## Hooks

Responsáveis por encapsular lógica de estado e integração com dados.

Exemplos:

```ts
useParts()
useMachines()
useProducts()
useSetupWizard()
useCompatibility()
```

Hooks não devem concentrar regras de negócio complexas.

Eles podem chamar serviços especializados.

---

## Services

Responsáveis por operações de negócio e acesso aos dados.

Exemplos:

```text
parts.service.ts
machines.service.ts
products.service.ts
setups.service.ts
compatibility.service.ts
```

Exemplo conceitual:

```ts
compatibilityService.getCompatibleParts({
  machineId,
  lineId,
  formatId,
  volumetry
})
```

A interface não deve conhecer os detalhes internos de como a compatibilidade é calculada.

---

## Schemas

Responsáveis pela validação dos dados.

Utilizar schemas para:

* Formulários.
* Dados recebidos da API.
* Dados persistidos.
* Parâmetros importantes.

Preferencialmente utilizar **Zod**.

Exemplo:

```ts
const partSchema = z.object({
  name: z.string().min(1),
  specification: z.string().min(1),
  compatibleMachineIds: z.array(z.string()).min(1),
  imageUrl: z.string().min(1)
});
```

---

## Types

Responsáveis pelas definições de tipos.

Exemplo:

```ts
type Part = {
  id: string;
  name: string;
  specification: string;
  compatibleMachineIds: string[];
  imageUrl: string;
  createdBy: string;
  createdAt: string;
};
```

Não duplicar tipos equivalentes em vários arquivos.

---

# 5. Componentes UI

Componentes genéricos e reutilizáveis devem ficar em:

```text
src/components/ui/
```

Exemplos:

```text
Button
Input
Dialog
Select
Command
Table
Card
AlertDialog
Sheet
Tabs
```

Esses componentes devem ser provenientes do **shadcn/ui** ou seguir seus padrões.

Componentes específicos do domínio devem ficar dentro da feature correspondente.

Exemplo:

```text
src/components/ui/Button.tsx
```

é genérico.

Enquanto:

```text
src/features/parts/components/PartCard.tsx
```

é específico de peças.

Não colocar componentes específicos do domínio em `components/ui`.

---

# 6. Shared Components

Componentes utilizados por múltiplas features devem ficar em:

```text
src/components/shared/
```

Exemplos:

```text
PageHeader
EmptyState
ConfirmDialog
DataTable
SearchInput
StatusBadge
LoadingState
ErrorState
```

Antes de criar um novo componente compartilhado, verificar se já existe um equivalente.

Evitar duplicação.

---

# 7. Entidades do Domínio

As entidades principais são:

```text
Machine
Line
Product
Format
Part
CompatibilityRule
SetupFlow
```

Cada entidade deve possuir um modelo claramente definido.

Relações conceituais:

```text
Machine
    │
    ├── Line
    │
    └── Compatible Parts
             │
             ▼
Product
    │
    └── Format
          │
          ▼
Compatibility Rules
          │
          ▼
Setup Flow
```

---

# 8. Relações entre Features

As features devem possuir baixo acoplamento.

Exemplo:

```text
setups
    ↓
machines
    ↓
lines
    ↓
products
    ↓
formats
    ↓
compatibility
    ↓
parts
```

A feature `setups` pode consumir serviços das outras features.

Porém, não deve acessar diretamente detalhes internos de implementação.

Preferir APIs públicas através de `index.ts`.

Exemplo:

```ts
import {
  getCompatibleParts
} from "@/features/compatibility";
```

Evitar:

```ts
import {
  internalCompatibilityEngine
} from "@/features/compatibility/services/internal/engine";
```

A menos que exista uma necessidade arquitetural clara.

---

# 9. Barrel Exports

Cada feature deve possuir um `index.ts` para expor sua API pública.

Exemplo:

```ts
export { PartForm } from "./components/PartForm";
export { useParts } from "./hooks/useParts";
export { partsService } from "./services/parts.service";
export type { Part } from "./types/part.types";
```

Isso ajuda a controlar o acoplamento entre módulos.

---

# 10. Fluxo de Novo Setup

O fluxo de criação de setup deve ser tratado como uma funcionalidade própria.

Estrutura:

```text
features/
└── setups/
    ├── components/
    │   ├── SetupWizard.tsx
    │   ├── SetupStepContext.tsx
    │   ├── SetupStepProduct.tsx
    │   ├── SetupStepFormat.tsx
    │   ├── SetupStepParts.tsx
    │   ├── SetupStepReview.tsx
    │   └── SetupSuccess.tsx
    │
    ├── hooks/
    │   └── useSetupWizard.ts
    │
    ├── services/
    │   └── setups.service.ts
    │
    ├── schemas/
    │   └── setup.schema.ts
    │
    ├── types/
    │   └── setup.types.ts
    │
    └── index.ts
```

O wizard deve controlar apenas o fluxo de interação.

A lógica de compatibilidade deve permanecer na feature:

```text
features/compatibility/
```

---

# 11. Estado do Wizard

O estado temporário do wizard deve ser separado do objeto final persistido.

Durante a criação:

```ts
type SetupDraft = {
  machineId?: string;
  lineId?: string;
  productId?: string;
  formatId?: string;
  parts: SetupPartSelection[];
};
```

Após confirmação:

```ts
type SetupFlow = {
  id: string;
  name: string;
  version: number;
  machineId: string;
  lineId: string;
  productId: string;
  formatId: string;
  parts: SetupPartSelection[];
  status: SetupStatus;
  createdBy: string;
  createdAt: string;
};
```

Não utilizar o modelo persistido diretamente como estado incompleto do formulário.

---

# 12. Máquina de Estados do Wizard

O wizard deve possuir etapas explícitas.

```ts
type SetupStep =
  | "context"
  | "product"
  | "format"
  | "parts"
  | "review"
  | "success";
```

Fluxo:

```text
context
   ↓
product
   ↓
format
   ↓
parts
   ↓
review
   ↓
success
```

O usuário não deve avançar para uma etapa que dependa de dados ainda não definidos.

Exemplo:

```text
Não é possível calcular peças
sem:
- Máquina
- Linha
- Produto
- Formato
```

---

# 13. Regras de Negócio

Regras importantes não devem ficar em componentes.

Evitar:

```tsx
function SetupPartsStep() {
  if (
    machineId === "machine-a" &&
    volumetry === 250
  ) {
    ...
  }
}
```

Preferir:

```ts
const recommendations =
  compatibilityService.getRecommendations({
    machineId,
    lineId,
    productId,
    formatId,
    volumetry
  });
```

A interface recebe o resultado.

```text
Regra de negócio
        ↓
Service / Domain
        ↓
Resultado
        ↓
React Component
        ↓
Interface
```

---

# 14. Compatibilidade

A lógica de compatibilidade deve ser isolada.

Estrutura recomendada:

```text
features/
└── compatibility/
    ├── components/
    ├── services/
    │   ├── compatibility.service.ts
    │   ├── format-recommendation.service.ts
    │   └── part-recommendation.service.ts
    │
    ├── rules/
    │   ├── format.rules.ts
    │   └── part.rules.ts
    │
    ├── schemas/
    ├── types/
    └── index.ts
```

A aplicação deve permitir evolução futura da lógica sem modificar o fluxo principal de criação de setup.

---

# 15. Separar Recomendação de Seleção

O sistema deve diferenciar:

```text
Recommendation
```

de:

```text
Selection
```

Exemplo:

```ts
type PartRecommendation = {
  partId: string;
  compatibility: "ideal" | "high" | "medium" | "conditional";
  reason?: string;
};
```

Depois que o usuário escolhe:

```ts
type SetupPartSelection = {
  partId: string;
  role: "primary" | "alternative";
  source: "recommended" | "manual";
};
```

Isso permite saber:

* O que o sistema recomendou.
* O que o usuário selecionou.
* Se a peça foi escolhida manualmente.
* Se a peça é principal ou alternativa.

---

# 16. Persistência

A camada de persistência deve ser abstraída.

Evitar que os componentes React acessem diretamente:

```text
localStorage
IndexedDB
fetch
axios
database
```

Exemplo ruim:

```tsx
function PartList() {
  const parts = JSON.parse(
    localStorage.getItem("parts")
  );
}
```

Preferir:

```tsx
const { parts } = useParts();
```

E:

```text
Component
    ↓
Hook
    ↓
Service
    ↓
Repository / API
    ↓
Persistência
```

A implementação atual pode utilizar uma persistência local ou API, mas a interface não deve depender diretamente dela.

---

# 17. Preparação para Backend

Mesmo que o projeto inicialmente utilize dados locais ou mockados, estruturar os serviços de maneira que possam ser substituídos por uma API posteriormente.

Exemplo:

```ts
partsService.getAll()
partsService.getById(id)
partsService.create(data)
partsService.update(id, data)
partsService.delete(id)
```

O componente não deve precisar saber se os dados vieram de:

```text
Mock
LocalStorage
IndexedDB
REST API
GraphQL
```

---

# 18. Tratamento de Estados

Toda funcionalidade que busca ou manipula dados deve considerar:

```text
Loading
Success
Empty
Error
```

Exemplo:

```text
Loading
    ↓
Success
    ├── Data
    └── Empty
```

Ou:

```text
Loading
    ↓
Error
```

Não deixar telas em branco quando uma requisição falhar.

---

# 19. Formulários

Formulários devem utilizar:

```text
React Hook Form
+
Zod
```

Sempre que possível.

Estrutura:

```text
Form
    ↓
Schema
    ↓
Validation
    ↓
Submit
    ↓
Service
```

Não duplicar validações manualmente em múltiplos locais.

A mesma regra de validação deve possuir uma fonte única de verdade.

---

# 20. Nomenclatura

Utilizar nomes claros e semânticos.

Preferir:

```text
SetupWizard
PartForm
PartRecommendation
CompatibilityRule
FormatRecommendation
```

Evitar:

```text
DataComponent
GenericForm2
Helper
Utils2
TempComponent
NewComponent
```

Nomes devem representar responsabilidades.

---

# 21. Funções

Funções devem possuir uma única responsabilidade clara.

Evitar funções gigantes que:

* Validam dados.
* Fazem requisição.
* Calculam compatibilidade.
* Atualizam estado.
* Exibem toast.
* Navegam.

Tudo ao mesmo tempo.

Preferir:

```text
validate
    ↓
calculate
    ↓
persist
    ↓
notify
    ↓
navigate
```

Cada responsabilidade deve estar na camada adequada.

---

# 22. Evitar Overengineering

Não criar abstrações complexas sem necessidade.

Não implementar:

* Microserviços.
* Event bus complexo.
* Design patterns desnecessários.
* Camadas vazias.
* Repositórios artificiais sem uso.
* Abstrações genéricas para uma única função.

A arquitetura deve ser escalável, mas proporcional ao tamanho real do projeto.

Priorizar:

```text
Simplicidade
+
Separação de responsabilidades
+
Evolução incremental
```

---

# 23. Reutilização

Antes de criar:

* Novo componente.
* Novo hook.
* Novo service.
* Nova função utilitária.

Verificar se já existe algo equivalente.

Não duplicar lógica.

Se uma funcionalidade possui uso em duas ou mais features e realmente representa uma abstração comum, considerar mover para:

```text
shared
```

ou:

```text
lib
```

Somente após existir necessidade real.

---

# 24. Dependências entre Features

Preferir dependências unidirecionais.

Exemplo:

```text
setups
    ↓
compatibility
    ↓
parts
```

Evitar ciclos:

```text
setups
    ↓
parts
    ↓
setups
```

Se houver dependência circular, reavaliar a modelagem.

---

# 25. Princípio de Evolução

O sistema deve poder evoluir nesta direção:

```text
MVP
    ↓
Catálogo de máquinas
    ↓
Catálogo de produtos
    ↓
Catálogo de peças
    ↓
Regras de compatibilidade
    ↓
Fluxos de setup
    ↓
Versionamento
    ↓
Histórico
    ↓
Execução de setup
    ↓
Indicadores operacionais
```

A arquitetura atual deve evitar bloquear essa evolução.

Porém, funcionalidades futuras não devem ser implementadas antecipadamente sem necessidade.

---

# 26. Regra Principal de Arquitetura

Sempre que implementar uma nova funcionalidade, responder mentalmente:

```text
1. A qual domínio pertence?
2. Qual feature é responsável?
3. Isso é interface ou regra de negócio?
4. Isso precisa ser reutilizado?
5. Onde os dados devem ser persistidos?
6. Existe uma validação?
7. Existe uma regra de compatibilidade?
8. Essa implementação cria acoplamento desnecessário?
```

Se a resposta não estiver clara, analisar a arquitetura antes de implementar.

---

# 27. Checklist antes de finalizar uma implementação

Antes de considerar uma tarefa concluída:

```text
[ ] A funcionalidade está na feature correta?
[ ] A lógica de negócio está separada da UI?
[ ] Os dados possuem tipos definidos?
[ ] Os formulários possuem validação?
[ ] Os estados loading/error/empty foram tratados?
[ ] A persistência está abstraída?
[ ] Não existe duplicação de lógica?
[ ] Não existem imports circulares?
[ ] Os componentes possuem responsabilidade clara?
[ ] A implementação está preparada para evolução?
[ ] Não foi criada abstração desnecessária?
```

---

# 28. Diretriz Final

O projeto deve seguir uma arquitetura **feature-first, modular e orientada ao domínio**.

A estrutura deve permitir que o desenvolvedor pense:

```text
Estou implementando uma funcionalidade de peças.
        ↓
Vou para features/parts.

Estou implementando regras de compatibilidade.
        ↓
Vou para features/compatibility.

Estou implementando o fluxo de criação de setup.
        ↓
Vou para features/setups.

Estou implementando um componente visual genérico.
        ↓
Vou para components/ui.

Estou implementando um componente reutilizável.
        ↓
Vou para components/shared.
```

O objetivo não é criar a arquitetura mais complexa possível.

O objetivo é garantir que cada parte do sistema tenha um lugar claro, uma responsabilidade clara e baixo acoplamento com as demais partes.

A arquitetura deve favorecer:

```text
Clareza
+
Manutenção
+
Testabilidade
+
Escalabilidade
+
Evolução incremental
```
