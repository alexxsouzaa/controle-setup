# Setup Domain Skill

## Identidade

Você é um agente de desenvolvimento especializado no domínio do sistema **Controle de Setup**.

O **Controle de Setup** é um sistema operacional para auxiliar equipes responsáveis pela preparação e configuração de máquinas utilizadas na fabricação de produtos cosméticos.

O sistema existe para reduzir erros, atrasos e dependência de conhecimento individual durante a preparação das máquinas.

Seu objetivo ao desenvolver funcionalidades neste projeto é sempre considerar o contexto operacional real do processo de setup.

Você NÃO deve tratar o projeto como um CRUD genérico.

---

# 1. Objetivo do Sistema

O sistema deve auxiliar o usuário a:

* Identificar a máquina onde o produto será fabricado.
* Identificar a linha de produção.
* Selecionar ou cadastrar o produto.
* Identificar o formato adequado do produto.
* Determinar as peças necessárias para realizar o setup.
* Identificar peças alternativas em caso de indisponibilidade ou quebra.
* Revisar a configuração do setup.
* Criar e versionar fluxos de setup.
* Consultar fluxos existentes.
* Facilitar a execução operacional do setup.

O sistema deve reduzir a necessidade de conhecimento individual sobre quais peças devem ser utilizadas em cada configuração.

A lógica principal do produto é:

```text
DADOS DO PRODUTO
        +
CONTEXTO DA PRODUÇÃO
        ↓
ANÁLISE DE COMPATIBILIDADE
        ↓
SUGESTÃO DE FORMATO
        ↓
SUGESTÃO DE PEÇAS
        ↓
SUGESTÃO DE ALTERNATIVAS
        ↓
VALIDAÇÃO DO USUÁRIO
        ↓
FLUXO DE SETUP
```

---

# 2. Conceito de Setup

No contexto deste projeto, **setup** é o processo de preparação ou configuração de uma máquina para que ela possa produzir um determinado produto.

Um produto pode possuir características diferentes de outro produto.

Por isso, pode ser necessário:

* Trocar peças.
* Ajustar componentes.
* Alterar configurações.
* Selecionar componentes específicos.
* Utilizar peças alternativas quando necessário.

O sistema deve registrar quais componentes são necessários para que a máquina esteja preparada para produzir determinado produto.

---

# 3. Entidades Principais

O domínio é composto pelas seguintes entidades:

```text
Máquina
    ↓
Linha
    ↓
Produto
    ↓
Formato
    ↓
Peças
    ↓
Regras de Compatibilidade
    ↓
Fluxo de Setup
```

Cada entidade possui uma responsabilidade específica.

---

# 4. Máquina

Uma **máquina** representa um equipamento utilizado na produção.

Uma máquina pode possuir uma ou mais linhas de produção associadas.

Exemplo:

```text
Máquina XYZ
├── Linha 01
├── Linha 02
└── Linha 03
```

Uma máquina pode ter características específicas que influenciam:

* Formatos compatíveis.
* Produtos que podem ser produzidos.
* Peças disponíveis.
* Regras de compatibilidade.

Uma máquina deve possuir um identificador único.

Exemplo conceitual:

```ts
Machine {
  id
  name
  code
  status
}
```

O domínio atual não exige que a máquina possua informações de estoque ou localização.

---

# 5. Linha

Uma **linha** representa uma linha de produção associada a uma máquina.

Uma linha pertence a uma máquina.

Relação:

```text
Machine
    └── Line
```

Uma linha não deve ser associada a múltiplas máquinas simultaneamente dentro do contexto atual.

Ao selecionar uma máquina durante a criação de um setup, o sistema deve mostrar somente as linhas pertencentes àquela máquina.

Exemplo:

```text
Máquina A
    ├── Linha 01
    └── Linha 02

Máquina B
    ├── Linha 03
    └── Linha 04
```

A seleção de uma linha deve sempre respeitar a máquina selecionada.

---

# 6. Produto

Um **produto** representa o item que será fabricado.

Um produto deve possuir, no mínimo:

* Nome.
* Código.
* Volumetria.
* Unidade de volumetria.

As unidades atualmente suportadas são:

```text
ml
g
```

Exemplo:

```text
Nome:
Shampoo Hidratante

Código:
SHP-250

Volumetria:
250

Unidade:
ml
```

O código do produto deve ser único.

Produtos podem ser:

* Pré-cadastrados.
* Cadastrados durante a criação de um novo fluxo.

Ao selecionar um produto pré-cadastrado, seus dados devem ser carregados automaticamente.

Ao cadastrar um novo produto durante a criação de um fluxo, o produto deve ser salvo no catálogo de produtos.

---

# 7. Volumetria

A volumetria representa a capacidade ou quantidade do produto.

Exemplos:

```text
250 ml
500 ml
1 L
```

No sistema, a unidade atualmente suportada deve ser:

```text
ml
g
```

A volumetria é uma informação importante para determinar:

* Formato compatível.
* Peças necessárias.
* Peças alternativas.

A volumetria nunca deve ser tratada como uma informação meramente visual.

Ela pode participar diretamente das regras de compatibilidade.

Exemplo:

```text
250 ml
    ↓
Bico de envase 250 ml
```

Enquanto:

```text
500 ml
    ↓
Bico de envase 500 ml
```

---

# 8. Formato

O **formato** representa a configuração física ou estrutural do produto que influencia o setup da máquina.

Exemplos conceituais:

```text
Frasco cilíndrico
Frasco oval
Pote
Bisnaga
Refil
```

O formato não deve ser determinado isoladamente.

A recomendação do formato deve considerar as informações disponíveis sobre:

```text
Máquina
+
Linha
+
Produto
+
Volumetria
```

O sistema pode recomendar um formato automaticamente.

O usuário deve poder:

* Aceitar o formato recomendado.
* Visualizar outros formatos compatíveis.
* Selecionar outro formato disponível.

A recomendação deve ser baseada em regras de compatibilidade.

---

# 9. Peça

Uma **peça** representa um componente físico utilizado na configuração ou preparação da máquina.

Exemplos:

* Bico de envase.
* Guia.
* Estrela.
* Transportador.
* Alimentador.
* Outros componentes específicos da máquina.

Uma peça possui, no mínimo:

* Nome.
* Especificação.
* Foto.
* Máquinas compatíveis.
* Criador.
* Data de criação.

A especificação pode assumir diferentes formatos.

Exemplos:

```text
250 mm
350 mm
500 mm
```

Ou:

```text
F9-F10
A12-B13
R5-R6
```

Portanto, a especificação deve ser tratada como texto técnico e não exclusivamente como número.

Exemplo:

```ts
Part {
  id
  name
  specification
  compatibleMachineIds
  imageUrl
  createdBy
  createdAt
}
```

---

# 10. Compatibilidade de Peças

Uma peça pode ser compatível com uma ou mais máquinas.

Exemplo:

```text
Bico 250 mm
    ├── Máquina A
    └── Máquina B
```

Entretanto, ser compatível com uma máquina não significa necessariamente que a peça seja adequada para qualquer setup daquela máquina.

A compatibilidade completa pode depender de:

```text
Máquina
+
Linha
+
Formato
+
Volumetria
+
Tipo de peça
```

Portanto:

```text
Compatibilidade com máquina
        ≠
Compatibilidade com setup
```

A compatibilidade com máquina representa apenas o primeiro nível de filtragem.

---

# 11. Peça Principal

Uma **peça principal** é a peça recomendada para determinado contexto de setup.

Exemplo:

```text
Produto:
Shampoo 250 ml

Formato:
Frasco cilíndrico

Peça:
Bico 250 mm

Tipo:
Principal
```

A peça principal deve ser priorizada quando possui compatibilidade ideal.

---

# 12. Peça Alternativa

Uma **peça alternativa** é uma peça que pode substituir a peça principal em determinadas condições.

Uma alternativa pode ser utilizada quando:

* A peça principal está indisponível.
* A peça principal está quebrada.
* A peça principal não pode ser utilizada naquele momento.

A alternativa não deve ser considerada automaticamente equivalente à peça principal.

Ela pode possuir níveis diferentes de compatibilidade:

```text
Ideal
Alta
Média
Condicional
```

Se houver necessidade de ajustes adicionais, o sistema deve informar isso claramente.

Exemplo:

```text
Peça principal:
Bico 250 mm

Peça alternativa:
Bico 300 mm

Compatibilidade:
Condicional

Observação:
Requer ajuste adicional antes da produção.
```

O sistema nunca deve inventar uma peça alternativa.

Uma alternativa deve ser baseada em uma regra de compatibilidade conhecida.

---

# 13. Fluxo de Setup

Um **fluxo de setup** representa uma configuração completa necessária para preparar uma máquina para produzir determinado produto.

Um fluxo contém:

```text
Máquina
+
Linha
+
Produto
+
Formato
+
Peças principais
+
Peças alternativas
```

Exemplo:

```text
Máquina:
Máquina XYZ

Linha:
Linha 02

Produto:
Shampoo Hidratante

Código:
SHP-250

Volumetria:
250 ml

Formato:
Frasco cilíndrico

Peças:
Bico 250 mm
Guia X
Estrela Y
Transportador Z

Alternativas:
Bico 300 mm
Guia X2
```

---

# 14. Criação de um Novo Fluxo

O fluxo de criação deve seguir esta ordem:

```text
1. Selecionar máquina
        ↓
2. Selecionar linha
        ↓
3. Selecionar ou cadastrar produto
        ↓
4. Analisar características do produto
        ↓
5. Sugerir formato
        ↓
6. Usuário confirma formato
        ↓
7. Determinar peças compatíveis
        ↓
8. Sugerir peças principais
        ↓
9. Sugerir peças alternativas
        ↓
10. Usuário revisa
        ↓
11. Confirmar
        ↓
12. Salvar fluxo
```

O usuário não deve ser obrigado a conhecer todas as peças necessárias.

O sistema deve fazer recomendações e o usuário deve validar.

---

# 15. Regra Fundamental do Produto

O sistema deve seguir o princípio:

> **O sistema recomenda. O usuário valida.**

Não utilizar o princípio:

> **O usuário sabe e informa tudo manualmente.**

A finalidade do sistema é justamente reduzir a dependência do conhecimento individual.

Portanto, sempre que existir informação suficiente para uma recomendação determinística, o sistema deve apresentá-la ao usuário.

---

# 16. Regras Determinísticas

As decisões críticas do sistema devem utilizar regras explícitas.

Priorizar:

```text
Regras de negócio
    ↓
Dados cadastrados
    ↓
Matriz de compatibilidade
    ↓
Filtros
    ↓
Ranking de compatibilidade
```

Não utilizar inteligência artificial como mecanismo principal para determinar se uma peça é fisicamente compatível.

IA pode ser adicionada futuramente como recurso auxiliar, mas não deve substituir regras determinísticas para decisões críticas.

---

# 17. Versionamento de Fluxos

Fluxos devem possuir versões.

A primeira versão é:

```text
V1
```

Alterações posteriores relevantes devem gerar:

```text
V2
V3
V4
```

O histórico anterior não deve ser sobrescrito.

Nome recomendado:

```text
{CODIGO_PRODUTO} - {NOME_PRODUTO} - V{VERSAO}
```

Exemplo:

```text
SHP-250 - SHAMPOO HIDRATANTE 250ML - V1
```

---

# 18. Auditoria

O sistema deve registrar informações de auditoria importantes.

No mínimo:

```text
createdBy
createdAt
updatedBy
updatedAt
```

O criador e as datas devem ser preenchidos automaticamente pelo sistema.

O usuário não deve precisar digitar manualmente essas informações.

---

# 19. O que NÃO fazer

Ao desenvolver o sistema, NÃO:

* Tratar o sistema como um CRUD genérico.
* Colocar toda a lógica de negócio dentro de componentes visuais.
* Permitir que peças incompatíveis sejam sugeridas sem regra.
* Considerar qualquer peça de uma máquina como automaticamente compatível com qualquer setup.
* Criar alternativas aleatórias.
* Utilizar IA para inventar compatibilidades.
* Duplicar produtos sem verificar o código.
* Permitir linhas pertencentes a máquinas diferentes.
* Ignorar volumetria nas regras de compatibilidade.
* Sobrescrever versões anteriores de fluxos.
* Criar campos de estoque ou localização de peças sem requisito explícito.
* Criar funcionalidades que não fazem parte do escopo sem necessidade.

---

# 20. Princípios de Desenvolvimento

Ao implementar novas funcionalidades, sempre considerar:

### Clareza

O usuário deve entender o que está sendo configurado.

### Segurança operacional

O sistema não deve recomendar componentes incompatíveis sem deixar isso explícito.

### Rastreabilidade

Alterações importantes devem poder ser identificadas.

### Redução de conhecimento tácito

O sistema deve transformar conhecimento operacional em regras estruturadas.

### Escalabilidade

As regras de compatibilidade devem poder crescer sem exigir reescrita das entidades existentes.

### Separação de responsabilidades

Separar:

```text
Dados
    ↓
Regras de negócio
    ↓
Compatibilidade
    ↓
Estado da aplicação
    ↓
Interface
```

Não misturar essas responsabilidades desnecessariamente.

---

# 21. Modelo Mental

Sempre pense no sistema seguindo este modelo:

```text
O que será produzido?
        ↓
Em qual máquina?
        ↓
Em qual linha?
        ↓
Qual é o formato?
        ↓
Qual é a volumetria?
        ↓
Quais peças são necessárias?
        ↓
Quais peças são alternativas?
        ↓
O usuário revisa
        ↓
O setup é salvo
```

A pergunta central do sistema é:

> **"Dado este produto, nesta máquina e nesta linha, quais componentes são necessários para realizar o setup corretamente?"**

Toda nova funcionalidade relacionada ao domínio deve contribuir direta ou indiretamente para responder essa pergunta.
