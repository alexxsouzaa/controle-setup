import { useState, useRef, useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function ImportPage({ navigate }) {
  const { flows, importData, logAction } = useContext(AppDataContext);
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingData, setPendingData] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [renamedMap, setRenamedMap] = useState({});
  const inputRef = useRef(null);

  const parseFile = (text, fileName) => {
    const isXML = fileName.toLowerCase().endsWith('.xml');
    if (isXML) {
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const errorNode = xml.querySelector('parsererror');
      if (errorNode) throw new Error('XML inválido');
      const flowNodes = xml.querySelectorAll('flow');
      const parsedFlows = [];
      flowNodes.forEach(f => {
        parsedFlows.push({
          name: f.querySelector('name')?.textContent || '',
          machine: f.querySelector('machine')?.textContent || '',
          product: f.querySelector('product')?.textContent || '',
          code: f.querySelector('code')?.textContent || '',
          vol: f.querySelector('volumetry')?.textContent || '',
          status: 'Importado',
        });
      });
      return { flows: parsedFlows };
    }
    return JSON.parse(text);
  };

  const processFile = (file) => {
    if (!file) return;
    setResult(null);
    setConflicts([]);
    setPendingData(null);
    setRenamedMap({});

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = parseFile(e.target.result, file.name);
        const existingNames = new Set(flows.map(f => f.name));
        const incomingFlows = data.flows || [];

        if (incomingFlows.length === 0) {
          setResult({ type: 'error', msg: 'Nenhum fluxo encontrado no arquivo.' });
          return;
        }

        const duplicates = incomingFlows
          .map((f, i) => ({ index: i, name: f.name }))
          .filter(f => existingNames.has(f.name));

        if (duplicates.length > 0) {
          setPendingData(data);
          setConflicts(duplicates);
          const initial = {};
          duplicates.forEach(d => { initial[d.index] = `${d.name} (importado)`; });
          setRenamedMap(initial);
        } else {
          finalizeImport(data);
        }
      } catch (err) {
        setResult({ type: 'error', msg: `Erro ao processar arquivo: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  const finalizeImport = (data) => {
    if (Object.keys(renamedMap).length > 0 && data.flows) {
      data = JSON.parse(JSON.stringify(data));
      Object.entries(renamedMap).forEach(([index, newName]) => {
        if (data.flows[parseInt(index)]) {
          data.flows[parseInt(index)].name = newName;
        }
      });
    }
    const importedNames = (data.flows || []).map(f => f.name).filter(Boolean);
    const count = importData(data);
    setConflicts([]);
    setPendingData(null);
    setRenamedMap({});
    if (count > 0) {
      logAction('import', 'Fluxo', `${count} fluxo${count !== 1 ? 's' : ''} importado${count !== 1 ? 's' : ''}`);
      sessionStorage.setItem('cs-imported-flows', JSON.stringify(importedNames));
      navigate('/fluxos');
    } else {
      setResult({ type: 'error', msg: 'Nenhum dado novo encontrado no arquivo.' });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e) => {
    processFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold tracking-tight mb-1">Importar</h2>
      <p className="text-sm text-[var(--fg-secondary)] mb-6">Selecione um arquivo JSON ou XML exportado anteriormente.</p>
      <div
        role="button"
        tabIndex={0}
        aria-label="Selecione um arquivo para importar"
        className={`flex flex-col items-center justify-center text-center py-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150 ${drag ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface)]'}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Icon name="upload" size={28} /></div>
        <h3 className="text-base font-semibold mb-1">Arraste um arquivo aqui</h3>
        <p className="text-sm text-[var(--fg-secondary)]">ou clique para selecionar</p>
        <p className="text-xs text-[var(--fg-secondary)] mt-3">Formatos aceitos: .json, .xml</p>
        <input ref={inputRef} type="file" accept=".json,.xml" className="hidden" onChange={handleFileSelect} />
      </div>

      {conflicts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onKeyDown={e => e.key === 'Escape' && setConflicts([])}>
          <div className="absolute inset-0 bg-[var(--overlay)]" />
          <div role="dialog" aria-modal="true" aria-label="Conflitos de importação" className="relative bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 z-10">
            <h3 className="text-base font-semibold mb-1">Fluxos duplicados</h3>
            <p className="text-xs text-[var(--fg-secondary)] mb-4">
              {conflicts.length} fluxo{conflicts.length !== 1 ? 's' : ''} já existente{conflicts.length !== 1 ? 's' : ''}. Renomeie abaixo ou confirme para sobrescrever com o nome original.
            </p>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {conflicts.map(c => (
                <div key={c.index} className="p-3 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
                  <div className="text-xs text-[var(--fg-secondary)] mb-1">Original: <span className="font-medium text-[var(--fg)]">{c.name}</span></div>
                  <label className="text-xs font-medium text-[var(--fg)] mb-0.5 block">Novo nome:</label>
                  <input className="shad-input text-sm" value={renamedMap[c.index] || ''} onChange={e => setRenamedMap(prev => ({ ...prev, [c.index]: e.target.value }))} aria-label={`Novo nome para ${c.name}`} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setConflicts([]); setPendingData(null); setRenamedMap({}); }}>Cancelar</Button>
              <Button variant="primary" onClick={() => finalizeImport(pendingData)}>Confirmar Importação</Button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className={`mt-4 p-4 rounded-lg border flex items-center gap-3 ${result.type === 'success' ? 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]' : 'border-[var(--danger)] bg-[var(--danger-muted)] text-[var(--danger)]'}`}>
          <Icon name={result.type === 'success' ? 'check-circle' : 'alert'} size={20} />
          <span className="text-sm font-medium">{result.msg}</span>
        </div>
      )}
      <div className="mt-8 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Formatos suportados:</h3>
        <div className="space-y-2 text-xs text-[var(--fg-secondary)]">
          <div className="flex items-center gap-2"><Badge variant="info">JSON</Badge><code className="font-mono text-xs">{'{ "machines": [...], "products": [...], "pieces": [...], "flows": [...], "formatos": [...] }'}</code></div>
          <div className="flex items-center gap-2"><Badge variant="info">XML</Badge><code className="font-mono text-xs">{'<flows><flow><name>...</name><machine>...</machine></flow></flows>'}</code></div>
        </div>
      </div>
    </div>
  );
}
