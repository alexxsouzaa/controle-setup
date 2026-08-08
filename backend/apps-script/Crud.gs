// Crud.gs — CRUD genérico, validação e geração de IDs.

function ApiError(code, message) {
  this.code = code;
  this.message = message;
}

function nowISO() {
  return new Date().toISOString();
}

function padId(value, digits) {
  var str = String(value);
  while (str.length < digits) str = '0' + str;
  return str;
}

// Mantém somente os campos que existem como coluna na aba.
function sanitize(entity, data) {
  var headers = Sheets.getHeaders(Sheets.getSheet(entity));
  var clean = {};
  headers.forEach(function (h) {
    if (data[h] !== undefined && data[h] !== null) clean[h] = data[h];
  });
  return clean;
}

function nextId(entity, config) {
  var rows = Sheets.listRows(entity);
  var max = 0;
  rows.forEach(function (r) {
    var m = /(\d+)\s*$/.exec(String(r.id || ''));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return config.idPrefix + padId(max + 1, config.idDigits);
}

function validateRequired(config, clean) {
  var missing = (config.required || []).filter(function (key) {
    var v = clean[key];
    return v === undefined || v === null || String(v) === '';
  });
  if (missing.length > 0) {
    throw new ApiError('VALIDATION_ERROR', 'Campos obrigatórios ausentes: ' + missing.join(', ') + '.');
  }
}

function createEntity(entity, data) {
  var config = ENTITIES[entity];
  var clean = sanitize(entity, data || {});
  validateRequired(config, clean);
  if (!clean.id) clean.id = nextId(entity, config);
  if (config.timestamps) {
    var now = nowISO();
    if (!clean.created_at) clean.created_at = now;
    clean.updated_at = now;
  }
  Sheets.appendRow(entity, clean);
  return Sheets.getById(entity, clean.id);
}

function updateEntity(entity, id, data) {
  var config = ENTITIES[entity];
  var clean = sanitize(entity, data || {});
  if (config.timestamps) clean.updated_at = nowISO();
  Sheets.updateRow(entity, id, clean);
  return Sheets.getById(entity, id);
}

function deleteEntity(entity, id) {
  Sheets.deleteRow(entity, id);
  return { id: id, deleted: true };
}

function getStats() {
  var counts = {};
  Object.keys(ENTITIES).forEach(function (entity) {
    counts[entity] = Sheets.listRows(entity).length;
  });
  return { counts: counts, version: DATABASE_VERSION };
}
