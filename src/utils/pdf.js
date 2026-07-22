/**
 * PDF Generator — Template padronizado para impressão
 * Uso: gera HTML formatado → window.open() → window.print()
 *
 * Exemplo:
 *   import { printPDF } from '../utils/pdf';
 *   printPDF('Meu Documento', [
 *     { type: 'header', content: 'Relatório' },
 *     { type: 'field', label: 'Nome', value: 'Produto A' },
 *     { type: 'divider' },
 *     { type: 'table', headers: ['#', 'Item'], rows: [[1, 'Peça X']] },
 *   ]);
 */

const STYLE = `
body {
  font-family: -apple-system, system-ui, sans-serif;
  color: #09090b;
  margin: 0;
  padding: 32px;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
h1 {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}
.meta {
  color: #71717a;
  font-size: 13px;
  margin-bottom: 24px;
}
.section {
  margin-bottom: 20px;
}
.section h2 {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #71717a;
  margin: 0 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #e4e4e7;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
}
.grid .label {
  font-size: 12px;
  color: #71717a;
}
.grid .value {
  font-weight: 500;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}
th {
  padding: 8px 10px;
  border: 1px solid #ddd;
  background: #f4f4f5;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #71717a;
  text-align: left;
}
td {
  padding: 6px 10px;
  border: 1px solid #ddd;
  font-size: 13px;
}
.footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #e4e4e7;
  font-size: 11px;
  color: #a1a1aa;
  text-align: center;
}
@media print {
  body { padding: 16px; }
}
`;

function renderBlock(block) {
  switch (block.type) {
    case 'header':
      return `<h1>${block.content}</h1>`;
    case 'meta':
      return `<div class="meta">${block.content}</div>`;
    case 'section':
      return `<h2>${block.content}</h2>`;
    case 'text':
      return `<p style="font-size:14px;margin:0 0 12px">${block.content}</p>`;
    case 'field':
      return `<div><div class="label">${block.label}</div><div class="value">${block.value ?? '—'}</div></div>`;
    case 'grid-start':
      return `<div class="section"><h2>${block.title || ''}</h2><div class="grid">`;
    case 'grid-end':
      return `</div></div>`;
    case 'table': {
      const thead = block.headers.map(h => `<th>${h}</th>`).join('');
      const tbody = (block.rows || []).map(r =>
        `<tr>${r.map(c => `<td>${c ?? '—'}</td>`).join('')}</tr>`
      ).join('');
      return `<div class="section"><h2>${block.title || 'Dados'}</h2><table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>`;
    }
    case 'divider':
      return `<div style="height:1px;background:#e4e4e7;margin:16px 0"></div>`;
    default:
      return '';
  }
}

export function buildPDF(title, blocks) {
  const date = new Date().toLocaleDateString('pt-BR');
  const body = blocks.map(renderBlock).join('\n');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>${STYLE}</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">Gerado em ${date}</div>
  ${body}
  <div class="footer">Controle de Setup — Documento gerado automaticamente</div>
  <script>window.print();</script>
</body>
</html>`;
}

export function printPDF(title, blocks, toast) {
  const html = buildPDF(title, blocks);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  } else if (toast) {
    toast('Permita pop-ups para exportar o PDF.', 'warning');
  }
}
