// Code.gs — Entradas do Web App (doGet / doPost).

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}
