// SheetsService.gs — Utilidades de leitura/escrita nas planilhas.

var Sheets = {
  getSpreadsheetId: function () {
    return PropertiesService.getScriptProperties().getProperty(DATABASE_KEY);
  },

  setSpreadsheetId: function (id) {
    PropertiesService.getScriptProperties().setProperty(DATABASE_KEY, id);
  },

  getSpreadsheet: function () {
    var id = this.getSpreadsheetId();
    if (!id) throw new ApiError('DATABASE_NOT_INITIALIZED', 'Banco não inicializado. Execute createDatabase() ou setupBoundDatabase().');
    return SpreadsheetApp.openById(id);
  },

  getSheet: function (name) {
    var sheet = this.getSpreadsheet().getSheetByName(name);
    if (!sheet) throw new ApiError('SHEET_NOT_FOUND', 'Aba "' + name + '" não encontrada.');
    return sheet;
  },

  getHeaders: function (sheet) {
    if (sheet.getLastColumn() === 0) return [];
    return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  },

  // Constrói as abas conforme DATABASE_SCHEMA (adiciona colunas faltantes sem apagar dados).
  buildSchema: function (ss, opts) {
    var renameFirst = opts && opts.renameFirst;
    var first = true;
    var self = this;
    DATABASE_SCHEMA.forEach(function (spec) {
      var sheet = ss.getSheetByName(spec.name);
      if (!sheet) {
        if (first && renameFirst) {
          sheet = ss.getSheets()[0];
          sheet.setName(spec.name);
        } else {
          sheet = ss.insertSheet(spec.name);
        }
      }
      var headers = self.getHeaders(sheet);
      if (headers.length === 0) {
        sheet.getRange(1, 1, 1, spec.headers.length).setValues([spec.headers]);
        sheet.setFrozenRows(1);
        sheet.setRowHeight(1, 26);
      } else {
        var missing = spec.headers.filter(function (h) { return headers.indexOf(h) === -1; });
        if (missing.length > 0) {
          sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
        }
      }
      first = false;
    });
  },

  // Converte cada linha de uma aba em objeto usando o cabeçalho.
  listRows: function (entity) {
    var sheet = this.getSheet(entity);
    var headers = this.getHeaders(sheet);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2 || headers.length === 0) return [];
    var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    return values
      .map(function (row) { return toObject(headers, row); })
      .filter(function (obj) { return obj.id !== null && obj.id !== undefined && String(obj.id) !== ''; });
  },

  getById: function (entity, id) {
    var row = this.listRows(entity).filter(function (r) { return String(r.id) === String(id); })[0];
    if (!row) throw new ApiError('NOT_FOUND', 'Registro "' + id + '" não encontrado em "' + entity + '".');
    return row;
  },

  findRowIndex: function (sheet, columnName, value) {
    var headers = this.getHeaders(sheet);
    var col = headers.indexOf(columnName);
    if (col < 0 || sheet.getLastRow() < 2) return null;
    var values = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0]) === String(value)) return i + 2;
    }
    return null;
  },

  appendRow: function (entity, obj) {
    var sheet = this.getSheet(entity);
    var headers = this.getHeaders(sheet);
    var row = headers.map(function (h) {
      var v = obj[h];
      return v === undefined || v === null ? '' : v;
    });
    sheet.appendRow(row);
  },

  updateRow: function (entity, id, obj) {
    var sheet = this.getSheet(entity);
    var headers = this.getHeaders(sheet);
    var rowIndex = this.findRowIndex(sheet, 'id', id);
    if (!rowIndex) throw new ApiError('NOT_FOUND', 'Registro "' + id + '" não encontrado em "' + entity + '".');
    Object.keys(obj).forEach(function (key) {
      var col = headers.indexOf(key);
      if (col >= 0) sheet.getRange(rowIndex, col + 1).setValue(obj[key]);
    });
  },

  deleteRow: function (entity, id) {
    var sheet = this.getSheet(entity);
    var rowIndex = this.findRowIndex(sheet, 'id', id);
    if (!rowIndex) throw new ApiError('NOT_FOUND', 'Registro "' + id + '" não encontrado em "' + entity + '".');
    sheet.deleteRow(rowIndex);
  },

  clearRows: function (entity) {
    var sheet = this.getSheet(entity);
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  },
};

function toObject(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = row[i] === '' ? null : row[i];
  }
  return obj;
}
