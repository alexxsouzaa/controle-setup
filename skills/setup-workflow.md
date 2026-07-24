# Setup Workflow Skill

## Identidade

Você é um agente de desenvolvimento especializado nos fluxos de negócio do sistema **Controle de Setup**.

Seu objetivo é implementar fluxos claros, previsíveis e consistentes para usuários responsáveis pela configuração e preparação de máquinas industriais.

Os principais fluxos do sistema são:

```text
Novo Fluxo de Setup
Novo Produto
Nova Peça
Gerenciamento de Fluxos
Gerenciamento de Produtos
Gerenciamento de Peças
```

O fluxo mais importante do sistema é o **Novo Fluxo de Setup**.

---

# 1. Princípio Fundamental

O sistema deve seguir o princípio:

> **O usuário fornece o contexto. O sistema processa as informações. O sistema recomenda. O usuário revisa. O usuário confirma.**

O fluxo não deve exigir que o usuário conheça antecipadamente todas as peças necessárias.

O sistema deve reduzir a quantidade de decisões manuais.

Fluxo geral:

```text
Contexto
    ↓
Dados
    ↓
Recomendação
    ↓
Seleção
    ↓
Revisão
    ↓
Confirmação
    ↓
Persistência
    ↓
Feedback
```

---

# 2. Novo Fluxo de Setup

O fluxo oficial para criação de um novo setup é:

```text
1. Iniciar novo fluxo
        ↓
2. Selecionar máquina
        ↓
3. Selecionar linha
        ↓
4. Selecionar produto existente
   OU
   Cadastrar novo produto
        ↓
5. Analisar dados do produto
        ↓
6. Sugerir formato
        ↓
7. Usuário confirmar formato
        ↓
8. Calcular peças necessárias
        ↓
9. Sugerir peças principais
        ↓
10. Sugerir peças alternativas
        ↓
11. Usuário revisar configuração
        ↓
12. Confirmar criação
        ↓
13. Gerar nome do fluxo
        ↓
14. Criar versão
        ↓
15. Registrar data e criador
        ↓
16. Salvar fluxo
        ↓
17. Mostrar feedback de sucesso
```

---

# 3. Estrutura do Wizard

O fluxo deve ser implementado como um wizard ou stepper.

Etapas:

```text
Etapa 1
Contexto

Etapa 2
Produto

Etapa 3
Formato

Etapa 4
Peças

Etapa 5
Revisão

Etapa 6
Concluído
```

Visualmente:

```text
[1 Contexto]
      ↓
[2 Produto]
      ↓
[3 Formato]
      ↓
[4 Peças]
      ↓
[5 Revisão]
      ↓
[6 Concluído]
```

O usuário deve conseguir visualizar:

* Etapa atual.
* Etapas concluídas.
* Etapas futuras.
* Progresso geral.

---

# 4. Estado do Wizard

O wizard deve possuir um estado temporário.

Exemplo:

```ts
type SetupWizardState = {
  currentStep: SetupStep;

  machineId?: string;

  lineId?: string;

  productId?: string;

  productData?: ProductDraft;

  formatId?: string;

  selectedParts: SetupPartSelection[];

  recommendations?: {
    format?: FormatRecommendation[];
    parts?: PartRecommendation[];
  };
};
```

Esse estado representa o fluxo em construção.

Ele não deve ser considerado um fluxo persistido até a confirmação final.

---

# 5. Etapa 1 — Selecionar Máquina

A primeira etapa deve permitir selecionar a máquina.

O usuário deve visualizar:

* Nome da máquina.
* Código, se existir.
* Status, se existir.

Exemplo:

```text
Selecionar máquina

[ Máquina A ]

[ Máquina B ]

[ Máquina C ]
```

Após selecionar uma máquina:

```text
Máquina A
✓ Selecionada
```

O sistema deve carregar as linhas compatíveis com essa máquina.

---

# 6. Etapa 1 — Selecionar Linha

Após selecionar a máquina, mostrar apenas as linhas pertencentes à máquina selecionada.

Exemplo:

```text
Máquina A

Linha
○ Linha 01
○ Linha 02
○ Linha 03
```

Não mostrar linhas de outras máquinas.

A seleção deve ser obrigatória para avançar.

Validação:

```text
Máquina selecionada
+
Linha selecionada
```

Sem os dois dados:

```text
Não permitir avançar.
```

---

# 7. Etapa 2 — Selecionar Produto

O usuário deve ter duas opções:

```text
Produto existente
```

ou:

```text
Cadastrar novo produto
```

Interface recomendada:

```text
Como deseja adicionar o produto?

[ Selecionar produto existente ]

[ Cadastrar novo produto ]
```

---

# 8. Selecionar Produto Existente

Ao selecionar produto existente, utilizar busca.

Exemplo:

```text
Buscar produto...

Shampoo Hidratante
SHP-250

Condicionador Nutritivo
CON-500
```

A busca deve considerar:

* Nome.
* Código.

Ao selecionar:

```text
Produto:
Shampoo Hidratante

Código:
SHP-250

Volumetria:
250 ml
```

Os dados devem ser carregados automaticamente.

---

# 9. Cadastrar Produto Durante o Fluxo

O usuário pode cadastrar um produto sem abandonar o fluxo.

Campos mínimos:

```text
Nome
Código
Volumetria
Unidade
```

Unidades:

```text
ml
g
```

Validações:

```text
Nome obrigatório
Código obrigatório
Código único
Volumetria obrigatória
Volumetria > 0
Unidade obrigatória
```

Após salvar:

```text
Produto criado com sucesso.
```

O produto deve ser automaticamente selecionado no wizard.

O usuário deve retornar ao fluxo na etapa atual.

---

# 10. Evitar Perda de Contexto

Se o usuário cadastrar um produto durante o wizard:

```text
Novo Fluxo
    ↓
Cadastrar Produto
    ↓
Salvar
    ↓
Produto selecionado
    ↓
Continuar Novo Fluxo
```

Não reiniciar o wizard.

Não perder:

* Máquina.
* Linha.
* Dados já preenchidos.

---

# 11. Etapa 3 — Recomendação de Formato

Depois de selecionar o produto, o sistema deve executar o motor de compatibilidade.

Entrada:

```text
Máquina
+
Linha
+
Produto
+
Volumetria
```

Resultado:

```text
Formato recomendado
```

Exemplo:

```text
Formato recomendado

Frasco cilíndrico 250 ml

Compatibilidade:
Ideal

Por quê?

✓ Compatível com a máquina
✓ Compatível com a linha
✓ Compatível com a volumetria
✓ Possui peças compatíveis
```

---

# 12. Seleção de Formato

O usuário deve poder:

```text
Aceitar recomendação
```

ou:

```text
Escolher outro formato
```

A recomendação não deve ser aplicada silenciosamente.

O usuário deve confirmar.

Exemplo:

```text
[ Usar formato recomendado ]

[ Ver outros formatos ]
```

---

# 13. Outros Formatos

Se existirem outras opções:

```text
Formatos compatíveis

● Frasco cilíndrico
  Ideal

○ Frasco oval
  Alta compatibilidade

○ Pote
  Compatibilidade condicional
```

Cada formato deve mostrar:

* Nome.
* Nível de compatibilidade.
* Justificativa.
* Avisos, quando aplicável.

Formatos incompatíveis não devem aparecer como opções normais.

---

# 14. Nenhum Formato Encontrado

Se nenhum formato for encontrado:

```text
Nenhum formato compatível encontrado.
```

Mostrar contexto:

```text
Máquina:
Máquina A

Linha:
Linha 01

Produto:
Shampoo Hidratante

Volumetria:
250 ml
```

Ações:

```text
[ Revisar produto ]

[ Voltar ]
```

Não selecionar um formato automaticamente.

---

# 15. Etapa 4 — Recomendação de Peças

Após confirmar o formato, executar novamente o motor de compatibilidade.

Entrada:

```text
Máquina
+
Linha
+
Produto
+
Formato
+
Volumetria
```

O sistema deve gerar:

```text
Peças principais
+
Peças alternativas
```

Exemplo:

```text
Peças necessárias

Bico de envase
● Bico 250 mm
  Recomendado

  Alternativa:
  Bico 300 mm
  Condicional

Guia
● Guia F9-F10
  Recomendado

  Alternativa:
  Guia F11-F12
  Alta compatibilidade
```

---

# 16. Seleção de Peças

Cada tipo de peça deve possuir uma seleção principal.

Estrutura:

```text
Tipo de peça
    ↓
Peça principal
    ↓
Alternativa
```

Exemplo:

```text
Bico de envase

[ Bico 250 mm ✓ ]

Alternativa:
[ Bico 300 mm ]
```

A peça principal é selecionada automaticamente quando houver recomendação ideal.

O usuário pode alterar.

---

# 17. Visualização da Peça

Quando houver foto cadastrada, mostrar:

* Foto.
* Nome.
* Especificação.
* Compatibilidade.
* Motivo da recomendação.

Exemplo:

```text
┌────────────────────────┐
│                        │
│      FOTO DA PEÇA      │
│                        │
└────────────────────────┘

Bico de envase
250 mm

Compatibilidade:
Ideal

Compatível com:
Máquina A
Linha 01
```

---

# 18. Peça Alternativa

A alternativa deve aparecer associada à peça principal.

Exemplo:

```text
Peça principal

Bico 250 mm
Ideal

Se esta peça estiver indisponível:

Alternativa recomendada
Bico 300 mm
Condicional

⚠ Requer ajuste adicional.
```

O sistema deve deixar claro que a alternativa não é necessariamente equivalente.

---

# 19. Falta de Peça Alternativa

Se não existir alternativa:

```text
Nenhuma peça alternativa compatível encontrada.
```

O usuário deve poder:

```text
[ Selecionar outra peça ]
```

ou:

```text
[ Continuar sem alternativa ]
```

O sistema não deve inventar uma alternativa.

---

# 20. Seleção Manual de Peça

Quando o usuário escolher manualmente uma peça:

```text
Origem:
Seleção manual
```

A seleção deve ser marcada internamente.

Exemplo:

```ts
{
  partId: "part-123",
  role: "primary",
  source: "manual"
}
```

Se o usuário utilizar uma recomendação:

```ts
{
  partId: "part-123",
  role: "primary",
  source: "recommended"
}
```

---

# 21. Revisão do Fluxo

Antes de salvar, o sistema deve apresentar uma tela completa de revisão.

Estrutura:

```text
Revisar fluxo

Máquina
Máquina A

Linha
Linha 01

Produto
Shampoo Hidratante

Código
SHP-250

Volumetria
250 ml

Formato
Frasco cilíndrico

Peças
Bico 250 mm
Guia F9-F10
Estrela X

Alternativas
Bico 300 mm
Guia F11-F12
```

---

# 22. Edição Durante a Revisão

Cada seção deve permitir editar.

Exemplo:

```text
Máquina e linha
[ Editar ]

Produto
[ Editar ]

Formato
[ Editar ]

Peças
[ Editar ]
```

Ao editar uma informação que afeta recomendações, recalcular os dados dependentes.

Exemplo:

```text
Alterou volumetria
    ↓
Recalcular formato
    ↓
Recalcular peças
    ↓
Recalcular alternativas
```

Não manter recomendações antigas quando o contexto mudou.

---

# 23. Dependências entre Etapas

As dependências devem ser respeitadas.

```text
Máquina + Linha
    ↓
Produto
    ↓
Formato
    ↓
Peças
```

Se o usuário alterar:

```text
Máquina
```

invalidar:

```text
Linha
Formato
Peças
```

Se alterar:

```text
Linha
```

invalidar:

```text
Formato
Peças
```

Se alterar:

```text
Produto
```

invalidar:

```text
Formato
Peças
```

Se alterar:

```text
Formato
```

invalidar:

```text
Peças
```

---

# 24. Confirmação Final

Na revisão, utilizar uma ação principal clara:

```text
[ Criar fluxo ]
```

Antes de salvar, validar:

```text
Máquina
✓

Linha
✓

Produto
✓

Formato
✓

Peças
✓
```

Se existirem avisos:

```text
⚠ Existem peças com compatibilidade condicional.
```

O usuário deve confirmar conscientemente.

---

# 25. Geração do Nome do Fluxo

Após a confirmação, gerar o nome automaticamente.

Formato:

```text
{ITEM} - {NOME_PRODUTO} - {VERSAO_FLUXO}
```

Exemplo:

```text
SHP-250 - SHAMPOO HIDRATANTE - V1
```

Onde:

```text
ITEM
=
Código do produto

NOME_PRODUTO
=
Nome do produto

VERSAO_FLUXO
=
Versão inicial do fluxo
```

A primeira versão deve ser:

```text
V1
```

---

# 26. Normalização do Nome

O nome deve ser gerado de forma consistente.

Regras:

* Remover espaços duplicados.
* Remover espaços no início e fim.
* Normalizar separadores.
* Manter o código do produto.
* Manter o nome do produto.
* Utilizar versão no formato `V1`, `V2`, etc.

Exemplo:

```text
SHP-250 - SHAMPOO HIDRATANTE - V1
```

Evitar:

```text
SHP-250--Shampoo  Hidratante--v1
```

---

# 27. Data de Criação

A data de criação deve ser registrada automaticamente.

Exemplo:

```ts
createdAt: new Date().toISOString()
```

Não permitir que o usuário informe manualmente a data de criação.

A interface pode exibir:

```text
Criado em:
24/07/2026
```

---

# 28. Criador

O criador deve ser obtido do usuário autenticado.

Exemplo:

```ts
createdBy: currentUser.id
```

A interface pode exibir:

```text
Criado por:
Bruno
```

O usuário não deve digitar o próprio nome.

---

# 29. Status Inicial

Ao criar um fluxo, o status inicial deve ser:

```text
Ativo
```

Exemplo:

```ts
status: "active"
```

Estados futuros podem incluir:

```text
active
inactive
archived
draft
```

Não criar status adicionais sem necessidade.

---

# 30. Persistência

O fluxo só deve ser persistido após:

```text
Revisão
    ↓
Confirmação
    ↓
Validação
    ↓
Salvamento
```

Durante o wizard, os dados são temporários.

Após salvar:

```text
SetupDraft
    ↓
Validation
    ↓
SetupFlow
    ↓
Persistence
```

---

# 31. Feedback de Sucesso

Após salvar, mostrar um estado de sucesso.

Exemplo:

```text
✓ Fluxo criado com sucesso

SHP-250 - SHAMPOO HIDRATANTE - V1

O fluxo foi salvo e está pronto para ser utilizado.
```

Ações:

```text
[ Ver lista de fluxos ]

[ Criar novo fluxo ]
```

O feedback deve ser apresentado como uma etapa final clara.

---

# 32. Ação "Ver Lista de Fluxos"

Ao clicar:

```text
Ver lista de fluxos
```

Navegar para a lista de fluxos.

O novo fluxo deve aparecer imediatamente.

Idealmente:

```text
Novo fluxo criado
    ↓
Lista de fluxos
    ↓
Novo item destacado
```

---

# 33. Ação "Criar Novo Fluxo"

Ao clicar:

```text
Criar novo fluxo
```

Iniciar um novo wizard vazio.

Não reutilizar automaticamente os dados anteriores.

A máquina, linha, produto, formato e peças devem ser selecionados novamente.

---

# 34. Cadastro de Nova Peça

O fluxo de nova peça é independente do wizard de setup.

Fluxo:

```text
Nova peça
    ↓
Nome
    ↓
Especificação
    ↓
Máquinas compatíveis
    ↓
Foto
    ↓
Criador automático
    ↓
Data automática
    ↓
Revisão
    ↓
Salvar
```

Campos:

```text
Nome da peça
Especificação
Máquinas compatíveis
Foto
```

Não incluir:

```text
Quantidade
Estoque
Localização
```

Esses dados não fazem parte do escopo atual.

---

# 35. Especificação da Peça

A especificação deve aceitar texto.

Exemplos:

```text
250 mm
350 mm
F9-F10
A12-B13
```

Não limitar a entrada exclusivamente a números.

A especificação representa uma referência técnica que pode variar de acordo com a peça.

---

# 36. Máquina Compatível

O cadastro de peça deve permitir selecionar uma ou mais máquinas compatíveis.

Exemplo:

```text
Máquinas compatíveis

☑ Máquina A
☑ Máquina B
☐ Máquina C
```

Pelo menos uma máquina deve ser selecionada.

---

# 37. Foto da Peça

A foto deve ser opcional ou obrigatória conforme a regra definida pelo produto.

Se existir:

```text
Upload
Preview
Replace
Remove
```

A foto deve ser associada à peça.

Não armazenar dados de imagem diretamente no componente visual.

---

# 38. Criador e Data da Peça

Esses campos devem ser automáticos.

```text
createdBy
createdAt
```

O usuário não deve preencher manualmente.

---

# 39. Validação de Nova Peça

Validar:

```text
Nome obrigatório
Especificação obrigatória
Pelo menos uma máquina compatível
Foto válida, quando fornecida
```

Após salvar:

```text
Peça criada com sucesso.
```

---

# 40. Fluxo de Produto

Cadastro de produto:

```text
Novo produto
    ↓
Nome
    ↓
Código
    ↓
Volumetria
    ↓
Unidade
    ↓
Validação
    ↓
Salvar
```

Campos:

```text
Nome
Código
Volumetria
Unidade
```

O código deve ser único.

---

# 41. Edição de Dados

Ao editar uma entidade utilizada em fluxos existentes, considerar o impacto histórico.

Não modificar silenciosamente dados históricos de setups já salvos.

Exemplo:

```text
Produto
V1
    ↓
Fluxo salvo
    ↓
Produto editado
```

O fluxo histórico deve continuar representando o contexto original.

Para isso, considerar snapshots ou versionamento quando necessário.

---

# 42. Regra de Integridade

Não permitir que um fluxo salvo possua referências inválidas.

Exemplo:

```text
Fluxo
    ↓
Produto inexistente
```

Isso deve ser evitado.

Antes de salvar:

```text
Validar referências
```

---

# 43. Navegação

O usuário deve poder navegar entre etapas anteriores.

Exemplo:

```text
Peças
← Voltar para Formato
```

Ao voltar sem modificar dados:

```text
Manter estado.
```

Ao modificar uma dependência:

```text
Recalcular dados dependentes.
```

---

# 44. Cancelamento

O usuário deve poder cancelar o wizard.

Antes de sair, se houver dados preenchidos:

```text
Descartar fluxo?

As informações preenchidas serão perdidas.

[ Continuar editando ]

[ Descartar ]
```

Não descartar silenciosamente.

---

# 45. Rascunho

A funcionalidade de rascunho pode ser implementada futuramente.

Não implementar automaticamente como parte do fluxo principal sem requisito explícito.

A arquitetura deve permitir:

```text
Draft
    ↓
Review
    ↓
Active
```

Mas o MVP pode trabalhar apenas com:

```text
Wizard temporário
    ↓
Salvar
    ↓
Active
```

---

# 46. Regras de Dependência

Sempre que um dado fundamental mudar, recalcular as recomendações dependentes.

Tabela:

| Alteração   | Recalcular                     |
| ----------- | ------------------------------ |
| Máquina     | Linha, Formato, Peças          |
| Linha       | Formato, Peças                 |
| Produto     | Formato, Peças                 |
| Volumetria  | Formato, Peças                 |
| Formato     | Peças                          |
| Peça manual | Não recalcular automaticamente |

---

# 47. Estados do Fluxo

O wizard deve possuir estados claros:

```text
idle
loading
ready
calculating
reviewing
saving
success
error
```

Exemplo:

```text
Calculando recomendações...
```

Durante o cálculo, evitar permitir ações conflitantes.

---

# 48. Erros

Erros devem ser apresentados de forma compreensível.

Evitar:

```text
Error 500
```

Preferir:

```text
Não foi possível carregar as recomendações de peças.

Tente novamente.
```

Quando possível, oferecer:

```text
[ Tentar novamente ]
```

---

# 49. Falha ao Salvar

Se o salvamento falhar:

```text
Não foi possível criar o fluxo.

Os dados preenchidos foram preservados.
```

Ações:

```text
[ Tentar novamente ]

[ Voltar para revisão ]
```

Não apagar o estado do wizard.

---

# 50. Regra de UX

O usuário deve sempre saber:

```text
Onde estou?
O que já fiz?
O que falta?
Por que o sistema recomendou isso?
O que acontecerá ao clicar?
```

---

# 51. Checklist do Novo Fluxo

Antes de concluir a implementação:

```text
[ ] Máquina selecionada
[ ] Linha filtrada pela máquina
[ ] Produto existente ou novo
[ ] Cadastro de produto não perde contexto
[ ] Formato recomendado
[ ] Formato confirmado
[ ] Peças recomendadas
[ ] Alternativas recomendadas
[ ] Recomendações explicadas
[ ] Seleção manual identificada
[ ] Revisão completa
[ ] Edição disponível
[ ] Dependências recalculadas
[ ] Nome gerado automaticamente
[ ] Versão criada
[ ] Data automática
[ ] Criador automático
[ ] Status inicial correto
[ ] Fluxo persistido
[ ] Feedback de sucesso
[ ] Opção de lista
[ ] Opção de novo fluxo
```

---

# 52. Diretriz Final

Todos os fluxos devem seguir uma experiência previsível:

```text
INICIAR
    ↓
INFORMAR
    ↓
RECEBER RECOMENDAÇÕES
    ↓
REVISAR
    ↓
CONFIRMAR
    ↓
SALVAR
    ↓
RECEBER FEEDBACK
```

O **Novo Fluxo de Setup** deve ser o fluxo principal e mais guiado do sistema.

Cadastros auxiliares, como **Produto** e **Peça**, devem ser rápidos e objetivos.

A complexidade deve estar no sistema de recomendações e nas regras de compatibilidade, e não na quantidade de informações que o usuário precisa fornecer manualmente.
