import { useState, useRef, useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';
import { Icon } from '../components/Icon';
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

  return (
    <div className="p-6 max-w-xl">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        aria-label="Selecionar arquivo para importar"
        className={`flex flex-col items-center justify-center text-center py-14 border-2 border-dashed rounded-[8px] cursor-pointer transition-all ${drag ? 'border-[var(--fg)] bg-[var(--accent-muted)]' : 'border-[var(--border)] hover:border-[var(--fg-muted)] bg-[var(--surface)]'}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="w-12 h-12 rounded-[8px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--fg-secondary)]">
          <Icon name="upload" size={24} />
        </div>
        <p className="text-[14px] font-medium text-[var(--fg)] mb-1">Arraste um arquivo aqui</p>
        <p className="text-[12px] text-[var(--fg-secondary)] mb-3">ou clique para selecionar</p>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-[4px] border border-[var(--border)] text-[11px] text-[var(--fg-muted)] font-mono">.json .xml</span>
        <input ref={inputRef} type="file" accept=".json,.xml" className="hidden" onChange={handleFileSelect} />
      </div>

      {conflicts.length > 0 && (
        <div className="mt-6 p-5 border border-[var(--border)] rounded-[8px] bg-[var(--surface)]">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="alert" size={16} />
            <span className="text-[14px] font-semibold text-[var(--fg)]">{conflicts.length} fluxo{conflicts.length !== 1 ? 's' : ''} duplicado{conflicts.length !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-[12px] text-[var(--fg-secondary)] mb-4">Renomeie os fluxos conflitantes ou confirme para usar os nomes alterados.</p>
          <div className="space-y-3 mb-4">
            {conflicts.map(c => (
              <div key={c.index} className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] border border-[var(--border)] bg-[var(--bg)]">
                <span className="text-[12px] text-[var(--fg-secondary)] shrink-0">{c.name} →</span>
                <Input value={renamedMap[c.index] || ''} onChange={e => setRenamedMap(prev => ({ ...prev, [c.index]: e.target.value }))} className="flex-1 min-h-[32px] text-[12px]" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setConflicts([]); setPendingData(null); setRenamedMap({}); }}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={() => finalizeImport(pendingData)}>Importar {conflicts.length} fluxo{conflicts.length !== 1 ? 's' : ''}</Button>
          </div>
        </div>
      )}

      {result && (
        <div className={`mt-4 px-4 py-3 rounded-[6px] border flex items-center gap-2.5 text-[13px] ${
          result.type === 'success' ? 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]' : 'border-[var(--danger)] bg-[var(--danger-muted)] text-[var(--danger)]'
        }`}>
          <Icon name={result.type === 'success' ? 'check-circle' : 'alert'} size={18} />
          <span className="font-medium">{result.msg}</span>
        </div>
      )}
    </div>
  );
}
