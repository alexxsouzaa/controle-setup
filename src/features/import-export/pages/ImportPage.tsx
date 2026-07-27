import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { useFlows, useImportData, useLogAction } from '../../../queries';

const ENTITY_INFO = [
  { key: 'machines', label: 'Máquinas', icon: 'box' },
  { key: 'products', label: 'Produtos', icon: 'grid-3x3' },
  { key: 'pieces', label: 'Peças', icon: 'box' },
  { key: 'flows', label: 'Fluxos', icon: 'file' },
  { key: 'formatos', label: 'Formatos', icon: 'grid-3x3' },
] as const;

interface ConflictItem {
  index: number;
  name: string;
}

interface FileInfo {
  name: string;
  size: string;
}

interface ImportResult {
  type: string;
  msg: string;
}

interface ParsedData {
  flows?: { name: string; [key: string]: string | undefined }[];
  [key: string]: unknown;
}

export function ImportPage() {
  const navigate = useNavigate();
  const { data: flows = [] } = useFlows();
  const { mutateAsync: importData } = useImportData();
  const { mutate: logAction } = useLogAction();
  const [drag, setDrag] = useState<boolean>(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pendingData, setPendingData] = useState<ParsedData | null>(null);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [renamedMap, setRenamedMap] = useState<Record<number, string>>({});
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = (text: string, fileName: string): ParsedData => {
    const isXML = fileName.toLowerCase().endsWith('.xml');
    if (isXML) {
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const errorNode = xml.querySelector('parsererror');
      if (errorNode) throw new Error('XML inválido');
      const flowNodes = xml.querySelectorAll('flow');
      const parsedFlows: { name: string; machine: string; product: string; code: string; vol: string; status: string }[] = [];
      flowNodes.forEach(f => parsedFlows.push({
        name: f.querySelector('name')?.textContent || '',
        machine: f.querySelector('machine')?.textContent || '',
        product: f.querySelector('product')?.textContent || '',
        code: f.querySelector('code')?.textContent || '',
        vol: f.querySelector('volumetry')?.textContent || '',
        status: 'Importado',
      }));
      return { flows: parsedFlows };
    }
    return JSON.parse(text);
  };

  const processFile = (file: File | null) => {
    if (!file) return;
    setResult(null);
    setConflicts([]);
    setPendingData(null);
    setRenamedMap({});
    setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) });

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = parseFile(e.target?.result as string, file.name);
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
          const initial: Record<number, string> = {};
          duplicates.forEach(d => { initial[d.index] = `${d.name} (importado)`; });
          setRenamedMap(initial);
        } else {
          finalizeImport(data);
        }
      } catch (err) {
        setResult({ type: 'error', msg: `Erro ao processar arquivo: ${(err as Error).message}` });
      }
    };
    reader.readAsText(file);
  };

  const finalizeImport = async (data: ParsedData) => {
    if (Object.keys(renamedMap).length > 0 && data.flows) {
      data = JSON.parse(JSON.stringify(data));
      Object.entries(renamedMap).forEach(([index, newName]) => {
        if (data.flows![parseInt(index)]) data.flows![parseInt(index)].name = newName;
      });
    }
    const importedNames = (data.flows || []).map(f => f.name).filter(Boolean);
    const count = (await importData(data)) as number;
    setConflicts([]);
    setPendingData(null);
    setRenamedMap({});
    if (count > 0) {
      logAction({ type: 'import', entity: 'Fluxo', detail: `${count} fluxo${count !== 1 ? 's' : ''} importado${count !== 1 ? 's' : ''}` });
      sessionStorage.setItem('cs-imported-flows', JSON.stringify(importedNames));
      navigate('/fluxos');
    } else {
      setResult({ type: 'error', msg: 'Nenhum dado novo encontrado no arquivo.' });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDrag(false); processFile(e.dataTransfer.files[0]); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { processFile(e.target.files?.[0] || null); e.target.value = ''; };
  const reset = () => { setResult(null); setConflicts([]); setPendingData(null); setRenamedMap({}); setFileInfo(null); };

  return (
    <div className="p-6 pb-16">
      <div className="max-w-xl">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
          className={`flex flex-col items-center justify-center text-center py-14 border-2 border-dashed rounded-[8px] cursor-pointer transition-all ${drag ? 'border-[var(--fg)] bg-[var(--accent-muted)]' : 'border-[var(--border)] hover:border-[var(--fg-muted)] bg-[var(--surface)]'}`}
          onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-12 h-12 rounded-[8px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mb-4 text-[var(--fg-secondary)]">
            <Icon name="upload" size={24} />
          </div>
          <p className="text-[14px] font-medium text-[var(--fg)] mb-1">Arraste um arquivo aqui</p>
          <p className="text-[12px] text-[var(--fg-secondary)] mb-4">ou clique para selecionar</p>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-[4px] border border-[var(--border)] text-[11px] text-[var(--fg-muted)] font-mono">.json .xml</span>
          <input ref={inputRef} type="file" accept=".json,.xml" className="hidden" onChange={handleFileSelect} />
        </div>

        {fileInfo && !conflicts.length && !result && (
          <div className="mt-4 px-4 py-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3">
            <Icon name="file" size={18} />
            <span className="text-[13px] text-[var(--fg)] flex-1 truncate">{fileInfo.name}</span>
            <span className="text-[11px] text-[var(--fg-muted)] font-mono">{fileInfo.size} KB</span>
            <button type="button" onClick={reset} className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--danger)] transition-colors">Remover</button>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="mt-6 border border-[var(--border)] rounded-[8px] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center gap-2">
              <Icon name="alert" size={16} />
              <span className="text-[13px] font-semibold text-[var(--fg)]">{conflicts.length} fluxo{conflicts.length !== 1 ? 's' : ''} duplicado{conflicts.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[12px] text-[var(--fg-secondary)]">Os fluxos abaixo já existem no sistema. Renomeie os novos ou confirme para manter os nomes alterados.</p>
              <div className="space-y-2">
                {conflicts.map(c => (
                  <div key={c.index} className="flex items-center gap-3 px-3 py-2 rounded-[6px] border border-[var(--border)]">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] text-[var(--fg-secondary)] truncate">{c.name}</div>
                      <Input value={renamedMap[c.index] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenamedMap(prev => ({ ...prev, [c.index]: e.target.value }))} className="mt-1 min-h-[30px] text-[12px]" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="ghost" size="sm" onClick={reset}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={() => finalizeImport(pendingData!)}>Importar</Button>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className={`mt-4 px-4 py-3 rounded-[6px] border flex items-center gap-2.5 text-[13px] ${
            result.type === 'success' ? 'border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]' : 'border-[var(--danger)] bg-[var(--danger-muted)] text-[var(--danger)]'
          }`}>
            <Icon name={result.type === 'success' ? 'check-circle' : 'alert'} size={18} />
            <span className="font-medium flex-1">{result.msg}</span>
            {result.type === 'error' && <button type="button" onClick={reset} className="text-[12px] underline">Ok</button>}
          </div>
        )}

        <div className="mt-8 border border-[var(--border)] rounded-[8px] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <h3 className="text-[13px] font-semibold text-[var(--fg)]">Entidades suportadas</h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {ENTITY_INFO.map(e => (
                <div key={e.key} className="flex items-center gap-2 px-3 py-2 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-[12px]">
                  <Icon name={e.icon} size={14} />
                  <span>{e.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[var(--fg-muted)] mt-3">Formatos aceitos: JSON estruturado ou XML com tags <code className="font-mono text-[var(--fg)]">&lt;flow&gt;</code>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
