// Database.gs — Esquema das abas, criação do banco e dados iniciais.

var DATABASE_NAME = 'Controle de Setup - Banco de Dados';
var DATABASE_KEY = 'CS_DATABASE_ID';
var DATABASE_VERSION = 2;

// Esquema base do PRD + colunas operacionais usadas pelo frontend atual
// (máquinas/linhas, características do motor de compatibilidade, etc.).
var DATABASE_SCHEMA = [
  {
    name: 'usuarios',
    headers: ['id', 'nome', 'email', 'cargo', 'ativo', 'created_at', 'updated_at'],
  },
  {
    name: 'maquinas',
    headers: ['id', 'nome', 'uo', 'linha', 'linhas', 'tipo', 'outils', 'categorias_ferramentais', 'imagem', 'notas', 'ativo', 'created_by', 'created_at', 'updated_at'],
  },
  {
    name: 'linhas',
    headers: ['id', 'nome', 'descricao', 'created_at', 'updated_at'],
  },
  {
    name: 'maquina_linha',
    headers: ['id', 'machine_id', 'line_id'],
  },
  {
    name: 'produtos',
    headers: ['id', 'codigo', 'nome', 'categoria', 'familia', 'volumetria', 'unidade', 'diametro', 'tipo_selagem', 'embalagem', 'peso', 'imagem', 'tipo_formato', 'notas', 'ativo', 'created_by', 'created_at', 'updated_at'],
  },
  {
    name: 'formatos',
    headers: ['id', 'nome', 'produto_id', 'maquina_id', 'tipo', 'volume', 'volume_min', 'volume_max', 'diametro', 'tipo_selagem', 'categoria', 'uo', 'peca_ids', 'pecas_alternativas', 'descricao', 'created_by', 'created_at', 'updated_by', 'updated_at'],
  },
  {
    name: 'categorias_pecas',
    headers: ['id', 'nome', 'descricao'],
  },
  {
    name: 'pecas',
    headers: ['id', 'codigo', 'nome', 'categoria_id', 'categoria', 'referencia', 'compat', 'maquinas', 'localizacao', 'estoque', 'estoque_minimo', 'unidade', 'selagem', 'diametro_min', 'diametro_max', 'imagem', 'created_by', 'created_at', 'updated_at'],
  },
  {
    name: 'compatibilidade_selagem',
    headers: ['id', 'machine_id', 'tipo_selagem', 'faca_id', 'mordente_id', 'bico_ar_id'],
  },
  {
    name: 'compatibilidade_dimensional',
    headers: ['id', 'machine_id', 'diametro', 'volume_min', 'volume_max', 'copo_id', 'bico_envase_id', 'ponteira_id', 'berco_id'],
  },
  {
    name: 'compatibilidade_bico_ar',
    headers: ['id', 'machine_id', 'tipo_selagem', 'diametro', 'bico_ar_id'],
  },
  {
    name: 'fluxos',
    headers: ['id', 'nome', 'maquina', 'machine_id', 'linha', 'produto', 'product_id', 'codigo', 'vol', 'data', 'format_id', 'formato_nome', 'version', 'status', 'pecas_primarias', 'pecas_alternativas', 'ferramentais', 'created_by', 'created_at', 'updated_by', 'updated_at'],
  },
  {
    name: 'fluxo_pecas',
    headers: ['id', 'flow_id', 'part_id', 'tipo', 'obrigatoria', 'alternativa', 'observacao'],
  },
  {
    name: 'configuracoes',
    headers: ['id', 'chave', 'valor', 'descricao'],
  },
];

var SEED_CATEGORIES = [
  'FACA',
  'MORDENTE',
  'COPO',
  'BICO_ENVASE',
  'PONTEIRA',
  'BERCO',
  'BICO_AR_QUENTE',
];

// Cria uma nova planilha com o esquema completo e retorna { spreadsheetId, url }.
function createDatabase() {
  var ss = SpreadsheetApp.create(DATABASE_NAME);
  Sheets.setSpreadsheetId(ss.getId());
  Sheets.buildSchema(ss, { renameFirst: true });
  seedDatabase();
  return { spreadsheetId: ss.getId(), url: ss.getUrl(), version: DATABASE_VERSION };
}

// Aplica o esquema na planilha à qual o script está vinculado (container-bound).
function setupBoundDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new ApiError('NO_ACTIVE_SPREADSHEET', 'Nenhuma planilha ativa encontrada.');
  Sheets.setSpreadsheetId(ss.getId());
  Sheets.buildSchema(ss, { renameFirst: false });
  seedDatabase();
  return { spreadsheetId: ss.getId(), url: ss.getUrl(), version: DATABASE_VERSION };
}

function seedDatabase() {
  seedUsers();
  seedCategories();
  seedConfig();
}

function seedUsers() {
  if (Sheets.listRows('usuarios').length > 0) return;
  var now = nowISO();
  Sheets.appendRow('usuarios', { id: 'USR0001', nome: 'Administrador', email: 'admin@controle.local', cargo: 'ADMINISTRADOR', ativo: true, created_at: now, updated_at: now });
  Sheets.appendRow('usuarios', { id: 'USR0002', nome: 'Operador', email: 'operador@controle.local', cargo: 'OPERADOR', ativo: true, created_at: now, updated_at: now });
}

function seedCategories() {
  if (Sheets.listRows('categorias_pecas').length > 0) return;
  SEED_CATEGORIES.forEach(function (nome, index) {
    Sheets.appendRow('categorias_pecas', {
      id: 'CAT' + padId(index + 1, 4),
      nome: nome,
      descricao: '',
    });
  });
}

function seedConfig() {
  if (Sheets.listRows('configuracoes').length > 0) return;
  Sheets.appendRow('configuracoes', { id: 'CFG0001', chave: 'db_version', valor: String(DATABASE_VERSION), descricao: 'Versão do esquema do banco.' });
  Sheets.appendRow('configuracoes', { id: 'CFG0002', chave: 'fluxo_status_inicial', valor: 'ATIVO', descricao: 'Status inicial de um novo fluxo.' });
}

// Limpa todas as abas, mantendo os cabeçalhos.
function resetDatabase() {
  DATABASE_SCHEMA.forEach(function (spec) {
    Sheets.clearRows(spec.name);
  });
  return true;
}
