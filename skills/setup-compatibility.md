# Setup Compatibility Skill

## Identidade

Você é um agente especializado na implementação do **motor de compatibilidade do Controle de Setup**.

O motor de compatibilidade é responsável por determinar:

* Quais formatos são compatíveis com um produto.
* Qual formato deve ser recomendado.
* Quais peças podem ser utilizadas em determinado setup.
* Qual peça deve ser recomendada como principal.
* Quais peças podem atuar como alternativas.
* Qual o nível de compatibilidade de cada recomendação.
* Por que uma peça foi recomendada.
* Por que uma peça não é compatível.

O motor de compatibilidade é uma parte central do domínio do sistema.

Sua implementação deve ser:

* Determinística.
* Explicável.
* Testável.
* Extensível.
* Independente da interface.
* Independente dos componentes React.

---

# 1. Princípio Fundamental

A regra principal é:

> **O sistema recomenda com base em regras conhecidas. O usuário valida a recomendação.**

O sistema não deve simplesmente listar todas as peças cadastradas.

Ele deve filtrar e classificar as peças de acordo com o contexto do setup.

---

# 2. Contexto de Compatibilidade

A compatibilidade de um setup deve considerar o máximo de informações disponíveis.

Contexto mínimo:

```ts
type CompatibilityContext = {
  machineId: string;
  lineId: string;
  productId: string;
  formatId: string;
  volumetry: number;
  volumetryUnit: "ml" | "g";
};
```

Dependendo do tipo de regra, o contexto pode ser expandido.

Exemplo:

```ts
type CompatibilityContext = {
  machineId: string;
  lineId: string;
  productId: string;
  formatId: string;
  volumetry: number;
  volumetryUnit: "ml" | "g";
  partType?: string;
};
```

O contexto deve ser imutável durante uma operação de recomendação.

---

# 3. Hierarquia de Compatibilidade

O mecanismo deve seguir uma hierarquia lógica:

```text
MÁQUINA
    ↓
LINHA
    ↓
PRODUTO
    ↓
VOLUMETRIA
    ↓
FORMATO
    ↓
TIPO DE PEÇA
    ↓
PEÇA
```

A máquina é o primeiro filtro.

A linha restringe o contexto da máquina.

O produto fornece características.

A volumetria influencia a seleção.

O formato define características físicas.

O tipo de peça define o componente necessário.

A peça é o resultado final da recomendação.

---

# 4. Compatibilidade de Máquina

Uma peça deve possuir uma lista de máquinas compatíveis.

Exemplo:

```ts
compatibleMachineIds: [
  "machine-001",
  "machine-002"
]
```

Uma peça incompatível com a máquina selecionada não deve ser recomendada.

Regra:

```text
Se peça não é compatível com máquina
→ excluir da recomendação
```

Essa regra deve ser aplicada antes das regras mais específicas.

---

# 5. Compatibilidade de Linha

Uma peça pode ser compatível com uma máquina, mas não necessariamente com todas as linhas daquela máquina.

Quando existirem regras específicas de linha, elas devem possuir prioridade sobre regras genéricas da máquina.

Exemplo:

```text
Máquina A
├── Linha 01
└── Linha 02
```

Uma peça pode ser:

```text
Máquina A
Linha 01
✓ Compatível
```

Mas:

```text
Máquina A
Linha 02
✗ Incompatível
```

Portanto:

```text
Compatibilidade de Linha
    >
Compatibilidade Genérica de Máquina
```

Caso não exista regra específica para linha, utilizar a compatibilidade da máquina como fallback.

---

# 6. Compatibilidade de Formato

O formato deve ser determinado considerando:

```text
Máquina
+
Linha
+
Produto
+
Volumetria
```

O sistema deve buscar formatos compatíveis.

Exemplo:

```text
Produto:
Shampoo

Volumetria:
250 ml

Máquina:
Máquina A

Linha:
Linha 01
```

Resultado:

```text
Frasco cilíndrico 250 ml
→ Alta compatibilidade

Frasco oval 250 ml
→ Média compatibilidade

Frasco cilíndrico 500 ml
→ Incompatível
```

---

# 7. Recomendação de Formato

O motor deve retornar recomendações ordenadas.

Exemplo:

```ts
type FormatRecommendation = {
  formatId: string;
  compatibility: CompatibilityLevel;
  score: number;
  reasons: string[];
};
```

Níveis:

```ts
type CompatibilityLevel =
  | "ideal"
  | "high"
  | "medium"
  | "conditional"
  | "incompatible";
```

O formato com maior compatibilidade deve ser apresentado como recomendado.

Exemplo:

```text
Formato recomendado
Frasco cilíndrico 250 ml

Compatibilidade:
Ideal

Motivos:
- Compatível com a máquina.
- Compatível com a linha.
- Volumetria correspondente.
- Existem peças de setup disponíveis.
```

---

# 8. Sistema de Pontuação

Quando existirem múltiplos formatos compatíveis, utilizar uma pontuação para ordenar os resultados.

Exemplo conceitual:

```text
Máquina compatível
+30

Linha compatível
+25

Volumetria exata
+25

Formato compatível
+15

Peças disponíveis
+5
```

Total:

```text
100 pontos
```

A pontuação deve ser usada para classificação, não como substituto das regras de incompatibilidade.

Uma incompatibilidade crítica deve excluir o item mesmo que a pontuação seja alta.

Exemplo:

```text
Máquina incompatível
→ INCOMPATÍVEL
→ Não recomendar
```

---

# 9. Regras de Hard Constraint

Algumas regras são obrigatórias.

Se uma delas falhar, o item deve ser eliminado.

Exemplos:

```text
Máquina incompatível
Linha incompatível
Formato fisicamente incompatível
Volumetria não suportada
Tipo de peça incompatível
```

Modelo:

```ts
type CompatibilityResult = {
  compatible: boolean;
  level: CompatibilityLevel;
  score: number;
  reasons: string[];
};
```

Regra:

```text
Hard Constraint falhou
    ↓
compatible = false
    ↓
Não recomendar
```

---

# 10. Regras de Soft Constraint

Algumas regras podem reduzir a prioridade sem eliminar a opção.

Exemplos:

```text
Peça alternativa
Volumetria próxima
Compatibilidade condicional
Necessidade de ajuste
```

Exemplo:

```text
Peça principal
→ Score 100
→ Ideal

Peça alternativa
→ Score 75
→ Alta

Peça condicional
→ Score 50
→ Condicional
```

---

# 11. Compatibilidade de Peças

Após determinar o formato, buscar peças compatíveis.

Entrada:

```ts
type PartRecommendationInput = {
  machineId: string;
  lineId: string;
  formatId: string;
  volumetry: number;
  volumetryUnit: "ml" | "g";
};
```

Resultado:

```ts
type PartRecommendation = {
  partId: string;
  partType: string;
  role: "primary" | "alternative";
  compatibility: CompatibilityLevel;
  score: number;
  reasons: string[];
};
```

---

# 12. Tipo de Peça

O sistema deve diferenciar os tipos de peças.

Exemplos:

```text
Bico de envase
Guia
Estrela
Transportador
Alimentador
```

Cada tipo pode possuir regras específicas.

Exemplo:

```text
Bico de envase
→ Regra baseada em volumetria

Guia
→ Regra baseada em formato

Estrela
→ Regra baseada em formato e dimensão

Transportador
→ Regra baseada em máquina e linha
```

Não assumir que todas as peças utilizam os mesmos critérios de compatibilidade.

---

# 13. Peça Principal

A peça principal é aquela que melhor atende ao contexto do setup.

Prioridade:

```text
1. Máquina compatível
2. Linha compatível
3. Formato compatível
4. Volumetria exata
5. Tipo de peça correto
6. Disponibilidade operacional, quando existir
```

A peça principal deve ser aquela com maior nível de compatibilidade.

Exemplo:

```text
Bico 250 mm
→ Máquina A ✓
→ Linha 01 ✓
→ Formato ✓
→ Volumetria 250 ml ✓
→ Ideal
```

---

# 14. Peça Alternativa

A peça alternativa deve ser calculada separadamente da peça principal.

Não selecionar simplesmente a segunda peça da lista.

A alternativa deve satisfazer os requisitos mínimos de compatibilidade.

Exemplo:

```text
Peça principal
Bico 250 mm
Compatibilidade: Ideal

Peça alternativa
Bico 300 mm
Compatibilidade: Condicional
```

A alternativa deve possuir uma justificativa.

Exemplo:

```text
reason:
"Compatível com a máquina e formato,
mas requer ajuste de configuração para volumetria."
```

---

# 15. Hierarquia de Alternativas

Priorizar alternativas nesta ordem:

```text
1. Mesma máquina
2. Mesma linha
3. Mesmo formato
4. Mesma função
5. Volumetria próxima
6. Menor necessidade de ajuste
```

Quanto mais critérios forem mantidos, maior deve ser a prioridade.

---

# 16. Limite de Alternativas

Não apresentar uma quantidade excessiva de alternativas.

Por padrão:

```text
1 peça principal
+
1 alternativa recomendada
```

Se necessário:

```text
1 peça principal
+
até 3 alternativas
```

Alternativas adicionais podem ser acessadas através de:

```text
Ver outras opções
```

---

# 17. Ausência de Alternativa

Se nenhuma alternativa válida existir:

```text
Nenhuma alternativa compatível encontrada.
```

Não inventar ou sugerir peças sem regra.

O usuário pode:

```text
Selecionar manualmente
```

ou:

```text
Revisar configuração
```

---

# 18. Seleção Manual

O sistema deve permitir seleção manual quando necessário.

Porém, uma seleção manual deve ser identificada.

Exemplo:

```ts
type SetupPartSelection = {
  partId: string;
  role: "primary" | "alternative";
  source: "recommended" | "manual";
};
```

Isso permite saber:

```text
Recomendado pelo sistema
```

ou:

```text
Selecionado manualmente pelo usuário
```

---

# 19. Compatibilidade Condicional

Uma peça condicional pode ser apresentada, mas deve possuir aviso claro.

Exemplo:

```text
⚠ Compatibilidade condicional

Bico 300 mm

Pode ser utilizado neste setup,
mas requer ajuste adicional.
```

O sistema não deve apresentar uma peça condicional como equivalente à peça ideal.

---

# 20. Explicabilidade

Toda recomendação deve possuir uma justificativa.

Exemplo:

```text
Bico 250 mm
✓ Recomendado

Por quê?

- Compatível com a Máquina A.
- Compatível com a Linha 01.
- Compatível com o formato selecionado.
- Possui volumetria correspondente de 250 ml.
```

A justificativa deve ser gerada a partir das regras aplicadas.

Evitar textos genéricos como:

```text
"Esta peça parece ser compatível."
```

---

# 21. Regras Configuráveis

Sempre que possível, as regras devem ser armazenadas como dados.

Evitar:

```ts
if (volume === 250) {
  return "part-001";
}
```

Preferir:

```ts
{
  partId: "part-001",
  formatId: "format-001",
  volumetry: 250,
  volumetryUnit: "ml",
  machineId: "machine-001"
}
```

A lógica deve interpretar os dados.

Isso permite adicionar novas combinações sem alterar código.

---

# 22. Modelo de Regra de Compatibilidade

Estrutura conceitual:

```ts
type CompatibilityRule = {
  id: string;

  machineId?: string;

  lineId?: string;

  productId?: string;

  formatId?: string;

  partType?: string;

  volumetryMin?: number;

  volumetryMax?: number;

  volumetryUnit?: "ml" | "g";

  partId: string;

  role: "primary" | "alternative";

  compatibility: CompatibilityLevel;

  score: number;

  reason?: string;
};
```

Campos opcionais permitem regras genéricas ou específicas.

---

# 23. Especificidade das Regras

Quanto mais específica uma regra, maior sua prioridade.

Exemplo:

```text
Regra A
Máquina

Regra B
Máquina + Linha

Regra C
Máquina + Linha + Formato

Regra D
Máquina + Linha + Formato + Volumetria
```

Prioridade:

```text
Regra D
    >
Regra C
    >
Regra B
    >
Regra A
```

Uma regra mais específica deve sobrescrever ou complementar uma regra genérica, conforme o tipo de regra.

---

# 24. Conflitos entre Regras

Se duas regras conflitarem, priorizar:

```text
1. Regra mais específica
2. Regra mais recente, se houver versionamento
3. Regra explicitamente prioritária
```

Nunca resolver conflitos aleatoriamente.

Se o conflito não puder ser resolvido automaticamente, sinalizar o problema.

---

# 25. Separar Motor de Compatibilidade da UI

O motor deve poder ser executado sem React.

Exemplo:

```ts
const result =
  compatibilityService.recommendParts(context);
```

A interface apenas apresenta:

```text
result.recommendations
```

Isso permite:

* Testes unitários.
* Uso em API.
* Uso em diferentes telas.
* Uso futuro em aplicações mobile.
* Uso futuro em processos automatizados.

---

# 26. API Conceitual

O módulo de compatibilidade deve expor operações semelhantes a:

```ts
compatibilityService.recommendFormats(context)

compatibilityService.recommendParts(context)

compatibilityService.findAlternatives({
  context,
  primaryPartId
})

compatibilityService.explainRecommendation({
  context,
  partId
})
```

Esses nomes são conceituais.

Adaptar à arquitetura real do projeto.

---

# 27. Fluxo de Recomendação

O fluxo completo deve ser:

```text
Contexto
    ↓
Validar máquina
    ↓
Validar linha
    ↓
Identificar produto
    ↓
Analisar volumetria
    ↓
Recomendar formato
    ↓
Usuário confirma formato
    ↓
Buscar regras de peças
    ↓
Aplicar Hard Constraints
    ↓
Aplicar Soft Constraints
    ↓
Calcular score
    ↓
Ordenar resultados
    ↓
Selecionar peça principal
    ↓
Buscar alternativas
    ↓
Gerar justificativas
    ↓
Retornar recomendações
```

---

# 28. Fluxo de Criação de Setup

O motor deve se integrar ao wizard:

```text
Etapa 1
Máquina + Linha
    ↓
Etapa 2
Produto
    ↓
Etapa 3
Formato
    ↓
Compatibility Engine
    ↓
Etapa 4
Peças recomendadas
    ↓
Alternativas
    ↓
Etapa 5
Revisão
```

O motor não deve controlar a navegação do wizard.

Ele apenas fornece dados e recomendações.

---

# 29. Recomendação de Formato sem Resultado

Se nenhum formato for encontrado:

```text
Nenhum formato compatível encontrado.
```

Informar:

* Máquina selecionada.
* Linha selecionada.
* Produto.
* Volumetria.

Permitir:

```text
Revisar dados
```

Não selecionar um formato arbitrariamente.

---

# 30. Recomendação de Peças sem Resultado

Se o formato existir, mas nenhuma peça for encontrada:

```text
Nenhuma peça compatível encontrada para este setup.
```

O usuário deve poder:

```text
Revisar formato
```

ou:

```text
Selecionar peça manualmente
```

O sistema não deve impedir o usuário de prosseguir sem fornecer uma alternativa para resolver a situação.

---

# 31. Status de Compatibilidade

Utilizar estados claros:

```text
IDEAL
```

Peça ou formato recomendado.

```text
ALTA
```

Compatível e boa alternativa.

```text
MÉDIA
```

Compatível, mas possui alguma limitação.

```text
CONDICIONAL
```

Pode ser utilizado sob determinadas condições.

```text
INCOMPATÍVEL
```

Não pode ser utilizado.

---

# 32. Não Confundir Compatibilidade com Disponibilidade

Compatibilidade e disponibilidade são conceitos diferentes.

Exemplo:

```text
Peça A
Compatibilidade: Ideal
Disponibilidade: Indisponível
```

Isso não significa que a peça deixou de ser compatível.

Significa apenas que não está disponível para uso naquele momento.

O motor de compatibilidade deve continuar tratando-a como compatível.

Se o sistema possuir informações de disponibilidade no futuro, elas devem ser aplicadas em uma camada separada.

```text
Compatibilidade
        ↓
Disponibilidade
        ↓
Recomendação operacional
```

Não misturar esses conceitos na entidade básica de peça.

---

# 33. Não Criar Estoque Artificial

O motor de compatibilidade não deve assumir que existe controle de estoque.

Atualmente, uma peça possui:

```text
Existe no catálogo
```

Não necessariamente:

```text
Existe fisicamente em estoque
```

Não implementar regras de disponibilidade física sem que exista uma fonte de dados confiável.

---

# 34. Testabilidade

Toda regra de compatibilidade deve ser testável isoladamente.

Testar cenários como:

```text
Máquina compatível
Máquina incompatível
Linha compatível
Linha incompatível
Volumetria exata
Volumetria diferente
Formato compatível
Formato incompatível
Peça principal encontrada
Alternativa encontrada
Nenhuma alternativa encontrada
Regra conflitante
Regra específica sobrepondo regra genérica
```

Exemplo:

```ts
describe("part compatibility", () => {
  it("should recommend exact volumetry part", () => {
    ...
  });

  it("should not recommend incompatible machine part", () => {
    ...
  });

  it("should find alternative part", () => {
    ...
  });
});
```

---

# 35. Regra Contra Hardcode

Não criar regras como:

```ts
if (machine === "Máquina A") {
  ...
}
```

ou:

```ts
if (volume === 250) {
  ...
}
```

Espalhadas pelo código.

As regras devem ser representadas por dados estruturados ou por módulos de regras claramente definidos.

Hardcode só é aceitável para:

* Constantes do domínio.
* Regras realmente imutáveis.
* Configurações técnicas.

---

# 36. Evolução Futura

O motor deve permitir evolução para:

```text
Compatibilidade básica
        ↓
Matriz de compatibilidade
        ↓
Regras por máquina
        ↓
Regras por linha
        ↓
Regras por formato
        ↓
Regras por volumetria
        ↓
Regras por tipo de peça
        ↓
Regras de alternativas
        ↓
Versionamento de regras
        ↓
Histórico de recomendações
```

Não implementar todas essas funcionalidades antecipadamente.

A arquitetura deve apenas evitar que elas sejam impossíveis de adicionar futuramente.

---

# 37. Checklist de Implementação

Antes de concluir qualquer funcionalidade relacionada à compatibilidade:

```text
[ ] A regra está documentada?
[ ] A regra é determinística?
[ ] A regra pode ser testada?
[ ] A regra está separada da UI?
[ ] Máquina foi considerada?
[ ] Linha foi considerada quando necessário?
[ ] Formato foi considerado?
[ ] Volumetria foi considerada?
[ ] Tipo de peça foi considerado?
[ ] Peça principal foi diferenciada da alternativa?
[ ] Alternativa possui justificativa?
[ ] Incompatibilidades críticas são bloqueadas?
[ ] Regras conflitantes são resolvidas?
[ ] Não existe hardcode desnecessário?
[ ] O resultado é explicável ao usuário?
```

---

# 38. Regra Principal

O motor de compatibilidade deve responder sempre a três perguntas:

```text
1. É compatível?
```

```text
2. Qual é a melhor opção?
```

```text
3. Por que essa opção foi recomendada?
```

O resultado esperado é:

```text
CONTEXTO
    ↓
REGRAS
    ↓
COMPATIBILIDADE
    ↓
RANKING
    ↓
RECOMENDAÇÃO
    ↓
JUSTIFICATIVA
```

A interface deve apresentar o resultado de forma clara.

O motor deve permanecer independente da interface.

---

# 39. Diretriz Final

O **Setup Compatibility Engine** deve ser tratado como uma camada de domínio central do Controle de Setup.

A arquitetura deve permitir que o sistema evolua de:

```text
Peças compatíveis com máquinas
```

para:

```text
Motor completo de configuração de setup
```

Sem precisar reescrever as funcionalidades existentes.

A regra fundamental é:

> **Nunca recomendar uma peça apenas porque ela existe. Recomendar somente quando houver uma justificativa de compatibilidade baseada nos dados e regras disponíveis.**
