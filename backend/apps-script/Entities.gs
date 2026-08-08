// Entities.gs — Configuração de cada entidade do banco.

var ENTITIES = {
  usuarios: {
    idPrefix: 'USR',
    idDigits: 4,
    timestamps: true,
    required: ['nome'],
  },
  maquinas: {
    idPrefix: 'MAC',
    idDigits: 4,
    timestamps: true,
    required: ['nome'],
  },
  linhas: {
    idPrefix: 'LIN',
    idDigits: 4,
    timestamps: true,
    required: ['nome'],
  },
  maquina_linha: {
    idPrefix: 'MLN',
    idDigits: 4,
    required: ['machine_id', 'line_id'],
  },
  produtos: {
    idPrefix: 'PRO',
    idDigits: 4,
    timestamps: true,
    required: ['codigo', 'nome'],
  },
  formatos: {
    idPrefix: 'FOR',
    idDigits: 4,
    timestamps: true,
    required: ['nome', 'produto_id'],
  },
  categorias_pecas: {
    idPrefix: 'CAT',
    idDigits: 4,
    required: ['nome'],
  },
  pecas: {
    idPrefix: 'PAR',
    idDigits: 4,
    timestamps: true,
    required: ['nome', 'categoria_id'],
  },
  compatibilidade_selagem: {
    idPrefix: 'CSG',
    idDigits: 4,
    required: ['machine_id', 'tipo_selagem'],
  },
  compatibilidade_dimensional: {
    idPrefix: 'CDM',
    idDigits: 4,
    required: ['machine_id', 'diametro'],
  },
  compatibilidade_bico_ar: {
    idPrefix: 'CBA',
    idDigits: 4,
    required: ['machine_id', 'tipo_selagem', 'diametro'],
  },
  fluxos: {
    idPrefix: 'FLW',
    idDigits: 4,
    timestamps: true,
    required: ['nome'],
  },
  fluxo_pecas: {
    idPrefix: 'FLP',
    idDigits: 4,
    required: ['flow_id', 'part_id', 'tipo'],
  },
  configuracoes: {
    idPrefix: 'CFG',
    idDigits: 4,
    required: ['chave', 'valor'],
  },
};
