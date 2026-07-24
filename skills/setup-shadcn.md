# Setup Shadcn Skill

## Identidade

Você é um agente de desenvolvimento frontend especializado em **React, TypeScript e shadcn/ui**, responsável pela implementação da interface do sistema **Controle de Setup**.

O objetivo desta skill é garantir que toda a interface:

* Seja consistente.
* Seja profissional.
* Seja previsível.
* Seja acessível.
* Seja responsiva.
* Tenha hierarquia visual clara.
* Utilize componentes reutilizáveis.
* Evite duplicação de padrões.

O projeto deve utilizar **shadcn/ui como base dos componentes de interface**.

Não criar componentes visuais complexos quando um componente shadcn/ui existente puder resolver o problema.

---

# 1. Princípio Fundamental

A interface deve seguir o princípio:

> **A interface deve facilitar a tomada de decisão operacional, não competir com ela.**

O sistema não deve parecer:

* Um dashboard genérico.
* Uma aplicação SaaS cheia de cards.
* Um painel futurista.
* Uma interface gamer.
* Um sistema excessivamente decorado.

O visual deve transmitir:

```text
Precisão
Organização
Confiabilidade
Clareza
Tecnologia
Eficiência operacional
```

---

# 2. shadcn/ui como Base

Utilizar os componentes disponíveis no shadcn/ui sempre que apropriado.

Exemplos:

```text
Button
Input
Label
Textarea
Select
Combobox
Command
Dialog
AlertDialog
Sheet
Drawer
Popover
Tooltip
Card
Badge
Table
Tabs
Accordion
Breadcrumb
Separator
Skeleton
Progress
DropdownMenu
Checkbox
RadioGroup
Switch
Form
```

Antes de criar um componente customizado:

```text
1. Verificar se shadcn/ui possui um componente adequado.
2. Verificar se um componente existente pode ser combinado com outros.
3. Criar componente customizado somente se houver necessidade real.
```

---

# 3. Componentes UI vs Componentes de Domínio

Separar claramente:

```text
components/ui/
```

para componentes genéricos.

E:

```text
features/*/components/
```

para componentes específicos do domínio.

Exemplo:

```text
components/ui/
    Button
    Input
    Dialog
    Table
```

Enquanto:

```text
features/parts/components/
    PartCard
    PartForm
    PartSelector
```

---

# 4. Botões

Utilizar o componente `Button`.

Variantes recomendadas:

```text
default
secondary
outline
ghost
destructive
```

Uso:

```text
default
→ Ação principal.

secondary
→ Ação secundária.

outline
→ Ação alternativa.

ghost
→ Ações discretas.

destructive
→ Exclusão ou ação irreversível.
```

Exemplo:

```tsx
<Button>
  Criar fluxo
</Button>
```

A ação principal da página deve possuir apenas um botão visualmente dominante.

Evitar múltiplos botões `default` competindo entre si.

---

# 5. Hierarquia de Ações

Toda interface deve possuir:

```text
Primary Action
Secondary Actions
Destructive Actions
```

Exemplo:

```text
[ Criar fluxo ]       ← Primary

[ Cancelar ]          ← Secondary

[ Excluir fluxo ]     ← Destructive
```

Não utilizar `destructive` apenas para chamar atenção.

---

# 6. Formulários

Utilizar:

```text
React Hook Form
+
Zod
+
shadcn/ui Form
```

Estrutura:

```text
Form
├── FormField
│   ├── FormLabel
│   ├── FormControl
│   ├── Input
│   └── FormMessage
```

Exemplo conceitual:

```tsx
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Nome</FormLabel>

      <FormControl>
        <Input {...field} />
      </FormControl>

      <FormMessage />
    </FormItem>
  )}
/>
```

---

# 7. Validação

Erros devem aparecer próximos ao campo.

Exemplo:

```text
Nome da peça
[________________]

O nome da peça é obrigatório.
```

Evitar depender exclusivamente de toast para erros de formulário.

Toast pode complementar.

Não utilizar mensagens genéricas como:

```text
Erro.
```

Preferir:

```text
Informe o nome da peça.
```

---

# 8. Inputs

Todo input deve possuir:

* Label.
* Placeholder quando necessário.
* Descrição quando útil.
* Mensagem de erro quando inválido.

Exemplo:

```text
Nome da peça

[ Bico de envase                  ]

Informe o nome utilizado para identificar a peça.
```

O placeholder não substitui o label.

---

# 9. Select

Utilizar `Select` quando as opções forem conhecidas e relativamente pequenas.

Exemplo:

```text
Unidade

[ ml ▼ ]
```

Opções:

```text
ml
g
```

---

# 10. Combobox

Utilizar `Combobox` ou `Command` para listas grandes ou pesquisáveis.

Exemplos:

```text
Selecionar produto
Selecionar máquina
Selecionar linha
Selecionar peça
```

Exemplo:

```text
Buscar produto...

Shampoo Hidratante
SHP-250

Condicionador Nutritivo
CON-500
```

Deve permitir pesquisa por:

* Nome.
* Código.
* Identificador relevante.

---

# 11. Seleção de Máquina

Para seleção de máquina, utilizar cards ou lista selecionável quando houver poucas máquinas.

Exemplo:

```text
┌───────────────────────┐
│ Máquina A             │
│ Código: M001          │
│                       │
│ ○ Selecionar          │
└───────────────────────┘
```

Quando houver muitas máquinas:

```text
Combobox
+
Busca
+
Filtros
```

Não criar uma interface visualmente pesada apenas para poucas opções.

---

# 12. Seleção de Linha

Após selecionar a máquina, mostrar apenas linhas pertencentes à máquina.

Exemplo:

```text
Máquina
Máquina A

Linha

[ Linha 01 ▼ ]
```

Se houver poucas linhas:

```text
[ Linha 01 ]
[ Linha 02 ]
[ Linha 03 ]
```

A interface deve deixar clara a dependência:

```text
Máquina A
    ↓
Linhas disponíveis
```

---

# 13. Wizard

O fluxo de Novo Setup deve utilizar uma navegação por etapas.

Estrutura:

```text
Contexto
   →
Produto
   →
Formato
   →
Peças
   →
Revisão
   →
Concluído
```

O wizard deve mostrar:

* Etapa atual.
* Etapas concluídas.
* Etapas futuras.

Exemplo:

```text
✓ Contexto
✓ Produto
● Formato
○ Peças
○ Revisão
```

A etapa atual deve ser visualmente distinguível.

---

# 14. Layout do Wizard

Utilizar uma área central com largura controlada.

Exemplo:

```text
┌─────────────────────────────────────────────┐
│ Novo fluxo de setup                         │
│                                             │
│ ✓ Contexto  ✓ Produto  ● Formato  ○ Peças  │
│                                             │
│ ------------------------------------------- │
│                                             │
│ Conteúdo da etapa                           │
│                                             │
│                                             │
│ [ Voltar ]                    [ Continuar ] │
└─────────────────────────────────────────────┘
```

Não colocar múltiplos painéis desnecessários.

O usuário deve concentrar-se na etapa atual.

---

# 15. Navegação do Wizard

Botões padrão:

```text
Primeira etapa:
[ Cancelar ] [ Continuar ]

Etapas intermediárias:
[ Voltar ] [ Continuar ]

Revisão:
[ Voltar ] [ Criar fluxo ]
```

O botão principal deve permanecer no mesmo local visual sempre que possível.

---

# 16. Cards

Utilizar `Card` para agrupar informações relacionadas.

Exemplos:

```text
Produto
Formato recomendado
Peça recomendada
Resumo do setup
```

Não transformar toda informação em card.

Cards devem ser utilizados para criar agrupamentos semânticos.

Evitar:

```text
Card dentro de Card dentro de Card
```

---

# 17. Recomendação de Formato

Utilizar um card destacado.

Exemplo:

```text
┌───────────────────────────────────────┐
│ Formato recomendado                   │
│                                       │
│ Frasco cilíndrico                     │
│                                       │
│ ✓ Compatibilidade ideal               │
│                                       │
│ Compatível com a máquina e volumetria │
│                                       │
│ [ Usar este formato ]                 │
└───────────────────────────────────────┘
```

A recomendação deve ser facilmente identificável.

---

# 18. Níveis de Compatibilidade

Utilizar `Badge`.

Exemplo:

```text
[ Ideal ]
[ Alta ]
[ Média ]
[ Condicional ]
[ Incompatível ]
```

Os badges devem ser semanticamente consistentes.

Não depender apenas de cor.

Sempre que necessário, incluir:

* Texto.
* Ícone.
* Tooltip.
* Explicação.

---

# 19. Peças

Uma peça deve possuir uma representação visual consistente.

Exemplo:

```text
┌─────────────────────────────────────┐
│ [ FOTO ]                            │
│                                     │
│ Bico de envase                      │
│ 250 mm                              │
│                                     │
│ [ Ideal ]                           │
│                                     │
│ ✓ Compatível com a máquina          │
│ ✓ Compatível com o formato          │
│ ✓ Volumetria correspondente         │
│                                     │
│ [ Selecionar ]                      │
└─────────────────────────────────────┘
```

Não esconder informações importantes em menus secundários.

---

# 20. Peça Principal e Alternativa

Diferenciar visualmente:

```text
Peça recomendada
```

de:

```text
Peça alternativa
```

Exemplo:

```text
PEÇA PRINCIPAL

Bico 250 mm
[ Ideal ]
[ Selecionado ]
```

Depois:

```text
ALTERNATIVA

Bico 300 mm
[ Condicional ]

⚠ Requer ajuste adicional.
```

A alternativa não deve parecer mais recomendada que a principal.

---

# 21. Foto da Peça

Quando disponível, mostrar a imagem.

A imagem deve:

* Ter proporção consistente.
* Ter tamanho previsível.
* Utilizar `object-fit: contain`.
* Possuir fallback quando não existir.

Exemplo:

```text
┌─────────────────┐
│                 │
│     IMAGEM      │
│                 │
└─────────────────┘
```

Se não houver imagem:

```text
[ Sem imagem ]
```

Não quebrar o layout.

---

# 22. Dialog

Utilizar `Dialog` para ações rápidas que não exigem navegação.

Exemplos:

```text
Cadastrar produto
Editar peça
Visualizar detalhes
```

Não utilizar Dialog para formulários excessivamente complexos.

Se o formulário exigir muitas etapas:

```text
Utilizar página ou wizard.
```

---

# 23. AlertDialog

Utilizar `AlertDialog` para ações destrutivas ou irreversíveis.

Exemplo:

```text
Excluir peça?

Esta ação não pode ser desfeita.

[ Cancelar ] [ Excluir ]
```

Nunca excluir imediatamente sem confirmação quando a ação for destrutiva.

---

# 24. Sheet

Utilizar `Sheet` para detalhes complementares.

Exemplos:

```text
Detalhes da peça
Detalhes do fluxo
Filtros
```

Pode ser utilizado para manter o usuário na página atual.

---

# 25. Drawer

Utilizar `Drawer` principalmente quando a interface exigir navegação lateral ou interação contextual.

Não utilizar Drawer e Sheet indiscriminadamente.

Escolher um padrão consistente.

---

# 26. Tooltip

Utilizar Tooltip para:

* Ícones sem texto.
* Ações pouco frequentes.
* Informações auxiliares.

Exemplo:

```text
[ ⓘ ]
```

Tooltip:

```text
Essa peça requer ajuste adicional.
```

Não utilizar tooltip para esconder informações essenciais.

---

# 27. Toast

Utilizar toast para feedback rápido.

Sucesso:

```text
Fluxo criado com sucesso.
```

Erro:

```text
Não foi possível salvar o fluxo.
```

Não usar toast como único mecanismo para informações críticas.

---

# 28. Feedback de Sucesso

Após criar um fluxo, preferir uma tela ou estado de sucesso dedicado.

Exemplo:

```text
✓

Fluxo criado com sucesso

SHP-250 - SHAMPOO HIDRATANTE - V1

[ Ver lista de fluxos ]

[ Criar novo fluxo ]
```

O feedback deve ser claro e permitir uma próxima ação.

---

# 29. Empty State

Toda lista que pode ficar vazia deve possuir um estado vazio.

Exemplo:

```text
Nenhum fluxo encontrado

Crie seu primeiro fluxo de setup para começar.

[ Criar fluxo ]
```

Não mostrar apenas:

```text
Nenhum resultado.
```

O empty state deve explicar o que aconteceu e, quando possível, oferecer uma ação.

---

# 30. Loading State

Utilizar `Skeleton` quando o carregamento fizer parte da estrutura da página.

Exemplo:

```text
██████████████
████████

████████████
████████
```

Para ações rápidas:

```text
[ Salvando... ]
```

O botão deve ficar desabilitado enquanto a operação estiver em andamento.

---

# 31. Error State

Erro de carregamento:

```text
Não foi possível carregar os dados.

[ Tentar novamente ]
```

Erro de operação:

```text
Não foi possível salvar a peça.

[ Tentar novamente ]
```

Sempre que possível, preservar os dados já digitados.

---

# 32. Tabelas

Utilizar tabela para dados tabulares.

Exemplo:

```text
Fluxos

Nome                         Status     Criado em
-------------------------------------------------------
SHP-250 - SHAMPOO - V1       Ativo      24/07/2026
CON-500 - CONDICIONADOR - V2 Ativo      23/07/2026
```

Não utilizar cards para substituir tabelas quando o objetivo principal for comparação de linhas.

---

# 33. Lista de Fluxos

A lista de fluxos deve permitir:

* Busca.
* Visualização de status.
* Visualização de data.
* Visualização do criador.
* Acesso aos detalhes.

Exemplo:

```text
Fluxos de setup

[ Buscar fluxo... ]

Nome
Status
Criado em
Criado por
Ações
```

---

# 34. Ações em Tabela

Ações secundárias podem ficar em:

```text
DropdownMenu
```

Exemplo:

```text
[ ⋮ ]
    Visualizar
    Editar
    Duplicar
    Arquivar
```

A ação principal pode ficar visível.

Evitar excesso de ícones.

---

# 35. Status

Utilizar `Badge` para status.

Exemplo:

```text
[ Ativo ]
[ Inativo ]
[ Arquivado ]
```

O texto deve ser explícito.

Não utilizar apenas ícones.

---

# 36. Breadcrumb

Utilizar Breadcrumb para páginas profundas.

Exemplo:

```text
Início
/
Fluxos
/
Novo fluxo
```

Não utilizar breadcrumb em telas simples onde não adiciona valor.

---

# 37. Responsividade

A interface deve funcionar em:

```text
Desktop
Tablet
Mobile
```

Prioridade:

```text
Desktop
```

por ser um sistema operacional de ambiente industrial.

Ainda assim, não criar layouts que quebrem em telas menores.

---

# 38. Layout Responsivo

Desktop:

```text
Sidebar
+
Conteúdo principal
```

Tablet:

```text
Sidebar reduzida
+
Conteúdo
```

Mobile:

```text
Header
+
Conteúdo
```

Cards e listas devem adaptar-se ao espaço disponível.

---

# 39. Espaçamento

Utilizar o sistema de espaçamento do Tailwind.

Preferir:

```text
gap-2
gap-4
gap-6
gap-8
```

Evitar valores arbitrários sem necessidade.

Não utilizar dezenas de valores diferentes de espaçamento.

---

# 40. Tipografia

Utilizar uma hierarquia consistente.

Exemplo:

```text
Título da página
text-2xl / text-3xl

Título de seção
text-lg / text-xl

Título de card
text-base

Texto normal
text-sm / text-base

Texto auxiliar
text-sm
```

Evitar exagero de tamanhos.

---

# 41. Ícones

Utilizar uma biblioteca consistente.

Preferencialmente:

```text
Lucide Icons
```

Ícones devem:

* Ter tamanho consistente.
* Ter função clara.
* Possuir tooltip quando não houver texto.
* Não substituir texto em ações importantes.

---

# 42. Ícones de Status

Utilizar ícones quando agregarem compreensão.

Exemplo:

```text
✓ Compatível

⚠ Condicional

✕ Incompatível
```

O texto deve continuar presente.

Não depender exclusivamente de cor.

---

# 43. Acessibilidade

Todos os componentes devem considerar:

* Navegação por teclado.
* Foco visível.
* Labels.
* Contraste adequado.
* Estados de erro.
* Descrições acessíveis.
* `aria-label` quando necessário.

Não criar componentes inacessíveis apenas para obter um visual específico.

---

# 44. Dialogs e Formulários

Ao abrir um Dialog:

* Foco deve ir para o conteúdo relevante.
* Escape deve fechar quando apropriado.
* Botões devem ser claros.
* Formulário deve preservar validações.

Não criar modais que impeçam o usuário de entender como sair.

---

# 45. Cores

A interface deve utilizar o sistema de tokens do projeto.

Não colocar cores diretamente em componentes sem necessidade.

Evitar:

```tsx
className="bg-[#1255DA]"
```

Preferir tokens semânticos quando disponíveis.

Exemplo:

```text
bg-primary
text-primary-foreground
bg-muted
text-muted-foreground
border
```

---

# 46. Temas

Se o projeto possuir suporte a tema:

```text
Light
Dark
```

os componentes devem utilizar tokens semânticos.

Não assumir que uma cor específica funcionará em ambos os temas.

---

# 47. Estados Visuais

Todo componente interativo deve considerar:

```text
Default
Hover
Focus
Active
Disabled
Loading
Error
Selected
```

Exemplo:

```text
Botão
├── Default
├── Hover
├── Focus
├── Disabled
└── Loading
```

---

# 48. Seleção de Peças

Para selecionar peças, preferir componentes que permitam comparação.

Exemplo:

```text
RadioGroup
```

ou:

```text
Cards selecionáveis
```

Quando houver uma recomendação principal:

```text
[ Card selecionado ]
```

Deve ser visualmente evidente.

---

# 49. Revisão

A etapa de revisão deve ser predominantemente visual.

Utilizar:

```text
Card
Accordion
Separator
Badge
```

Exemplo:

```text
Resumo do setup

Máquina
Máquina A

Linha
Linha 01

Produto
Shampoo Hidratante
250 ml

Formato
Frasco cilíndrico

Peças
Bico 250 mm
Guia F9-F10
Estrela X
```

A revisão não deve parecer um formulário gigante.

---

# 50. Evitar Excesso de UI

Não utilizar:

```text
Card
dentro de Card
dentro de Dialog
dentro de Accordion
```

sem necessidade.

Evitar:

* Sombras excessivas.
* Bordas em todos os elementos.
* Gradientes decorativos.
* Animações desnecessárias.
* Elementos flutuantes sem função.
* Ícones decorativos em excesso.

---

# 51. Animações

Animações devem ser discretas.

Utilizar apenas quando ajudarem a:

* Indicar mudança de estado.
* Mostrar carregamento.
* Confirmar uma ação.
* Melhorar transição entre etapas.

Evitar animações que atrasem operações.

---

# 52. Feedback Visual de Recomendações

O usuário deve identificar imediatamente:

```text
Recomendado
```

```text
Alternativa
```

```text
Seleção manual
```

Exemplo:

```text
[ Recomendado pelo sistema ]
```

```text
[ Alternativa ]
```

```text
[ Selecionado manualmente ]
```

Esses estados devem ser visualmente distintos.

---

# 53. Componente de Recomendação

Quando houver lógica de recomendação, criar um padrão reutilizável.

Exemplo conceitual:

```text
RecommendationCard
```

Responsável por apresentar:

* Item recomendado.
* Nível de compatibilidade.
* Score, se necessário.
* Justificativas.
* Alternativa.
* Ação de seleção.

Não duplicar esse padrão em:

```text
FormatRecommendation
PartRecommendation
```

sem necessidade.

---

# 54. Componente de Compatibilidade

Criar um padrão visual para explicar compatibilidade.

Exemplo:

```text
CompatibilityBadge
CompatibilityDetails
CompatibilityReasons
```

Exibição:

```text
[ Ideal ]

✓ Máquina compatível
✓ Linha compatível
✓ Formato compatível
✓ Volumetria compatível
```

---

# 55. Componentes Customizados

Componentes customizados são permitidos quando:

* Não existe equivalente no shadcn/ui.
* Existe uma combinação recorrente de componentes.
* Existe uma regra visual específica do domínio.

Exemplo:

```text
SetupWizard
PartRecommendationCard
CompatibilitySummary
SetupReview
```

Esses componentes devem utilizar componentes shadcn/ui internamente sempre que possível.

---

# 56. Evitar Componentes Monolíticos

Não criar:

```text
SetupPage.tsx
```

com milhares de linhas.

Dividir:

```text
SetupWizard
SetupContextStep
SetupProductStep
SetupFormatStep
SetupPartsStep
SetupReviewStep
```

A página deve coordenar.

Cada etapa deve ter responsabilidade própria.

---

# 57. Padrão de Página

Uma página deve seguir estrutura semelhante:

```text
Page
├── PageHeader
│   ├── Title
│   ├── Description
│   └── Actions
│
└── PageContent
```

Exemplo:

```text
Fluxos de Setup
Gerencie os fluxos de configuração das máquinas.

[ Novo fluxo ]

--------------------------------

Tabela de fluxos
```

---

# 58. Padrão de Cabeçalho

O cabeçalho deve possuir:

```text
Título
Descrição opcional
Ação principal
```

Exemplo:

```text
Fluxos de Setup

Visualize e gerencie os fluxos de configuração.

[ + Novo fluxo ]
```

---

# 59. Padrão de Cadastro

Para cadastros simples:

```text
PageHeader
    ↓
Form
    ↓
Actions
```

Para cadastros rápidos:

```text
Dialog
    ↓
Form
```

Para processos complexos:

```text
Wizard
```

---

# 60. Regra de Escolha de Componente

Utilizar:

```text
Input
→ Texto simples

Textarea
→ Texto longo

Select
→ Poucas opções conhecidas

Combobox
→ Muitas opções pesquisáveis

Command
→ Busca e seleção avançada

RadioGroup
→ Escolha única entre poucas opções

Checkbox
→ Múltiplas opções independentes

Switch
→ Ativação/desativação

Dialog
→ Ação rápida

Sheet
→ Conteúdo contextual

AlertDialog
→ Confirmação destrutiva

Table
→ Dados tabulares

Card
→ Agrupamento semântico
```

---

# 61. Regra Final

Antes de implementar qualquer interface, perguntar:

```text
1. Existe um componente shadcn/ui adequado?
2. Esse padrão já existe no projeto?
3. O componente é genérico ou específico do domínio?
4. O usuário precisa dessa informação agora?
5. A ação principal está clara?
6. O estado atual está claro?
7. O componente funciona em loading?
8. O componente funciona em erro?
9. O componente funciona vazio?
10. O componente é acessível?
```

---

# 62. Checklist Visual

Antes de concluir uma tela:

```text
[ ] Usa componentes shadcn/ui quando apropriado
[ ] Não existem componentes duplicados
[ ] Hierarquia visual clara
[ ] Ação principal evidente
[ ] Estados loading implementados
[ ] Estados vazios implementados
[ ] Estados de erro implementados
[ ] Estados disabled implementados
[ ] Feedback de sucesso implementado
[ ] Formulários possuem validação
[ ] Erros aparecem próximos dos campos
[ ] Layout responsivo
[ ] Navegação por teclado
[ ] Foco visível
[ ] Não depende apenas de cores
[ ] Ícones possuem significado claro
[ ] Não existem animações desnecessárias
[ ] Não existe excesso de cards
```

---

# 63. Diretriz Final

O sistema **Controle de Setup** deve utilizar o shadcn/ui como uma base de consistência, não como uma coleção de componentes utilizados aleatoriamente.

A interface deve transmitir:

```text
Clareza
+
Precisão
+
Organização
+
Confiabilidade
```

O usuário deve conseguir executar um setup rapidamente, entendendo:

```text
Onde está
    ↓
O que está configurando
    ↓
O que o sistema recomenda
    ↓
Por que recomenda
    ↓
O que precisa revisar
    ↓
Como confirmar
```

A tecnologia deve desaparecer atrás da experiência.

O usuário não precisa entender a arquitetura do sistema.

Ele precisa entender o trabalho que está realizando.
