// Api.gs — Roteamento por ação (entity + action) e respostas padronizadas.

function handleRequest(e, method) {
  try {
    var params = e.parameter || {};
    var entity = params.entity;
    var action = params.action;

    if (!action) return errorResponse('MISSING_ACTION', 'Parâmetro "action" é obrigatório.');

    if (action === 'stats') return okResponse(getStats());
    if (action === 'seed') { seedDatabase(); return okResponse({ seeded: true }); }
    if (action === 'reset') { resetDatabase(); return okResponse({ reset: true }); }

    if (!entity) return errorResponse('MISSING_ENTITY', 'Parâmetro "entity" é obrigatório.');
    if (!ENTITIES[entity]) return errorResponse('UNKNOWN_ENTITY', 'Entidade desconhecida: "' + entity + '".');

    var body = {};
    if (method === 'POST' && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (err) {
        return errorResponse('INVALID_JSON', 'Corpo da requisição não é um JSON válido.');
      }
    }

    switch (action) {
      case 'list':
        return okResponse(Sheets.listRows(entity));

      case 'get':
        if (!params.id) return errorResponse('MISSING_ID', 'Parâmetro "id" é obrigatório.');
        return okResponse(Sheets.getById(entity, params.id));

      case 'create':
        return okResponse(createEntity(entity, body));

      case 'update':
        if (!params.id) return errorResponse('MISSING_ID', 'Parâmetro "id" é obrigatório.');
        return okResponse(updateEntity(entity, params.id, body));

      case 'delete':
        if (!params.id) return errorResponse('MISSING_ID', 'Parâmetro "id" é obrigatório.');
        return okResponse(deleteEntity(entity, params.id));

      default:
        return errorResponse('UNKNOWN_ACTION', 'Ação desconhecida: "' + action + '".');
    }
  } catch (err) {
    if (err && err.code) return errorResponse(err.code, err.message);
    var msg = err && err.message ? err.message : String(err);
    return errorResponse('INTERNAL_ERROR', 'Erro interno: ' + msg);
  }
}

function okResponse(data) {
  return textResponse({ success: true, data: data });
}

function errorResponse(code, message) {
  return textResponse({ success: false, error: { code: code, message: message } });
}

function textResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
