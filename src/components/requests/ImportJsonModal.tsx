import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { parseRequestsJson, ParsedJsonRequest, JSON_EXAMPLE_TEMPLATE } from '../../utils/jsonParser';
import { 
  X, 
  Upload, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  FileJson, 
  Download, 
  Copy, 
  Check, 
  Package, 
  Layers, 
  Clock, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportJsonModal: React.FC<ImportJsonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { importRequestsFromJson, addToast } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedJsonRequest[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);

  if (!isOpen) return null;

  const handleValidateAndPreview = (content: string, name?: string) => {
    setParseError(null);
    setFileName(name || null);

    if (!content.trim()) {
      setParsedPreview(null);
      return;
    }

    const result = parseRequestsJson(content);
    if (result.valid && result.requests.length > 0) {
      setParsedPreview(result.requests);
      setParseError(null);
    } else {
      setParsedPreview(null);
      setParseError(result.error || 'JSON inválido.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      handleValidateAndPreview(content, file.name);
    };
    reader.onerror = () => {
      setParseError('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      addToast({ type: 'warning', title: 'Arquivo não suportado', message: 'Por favor, selecione um arquivo com extensão .json.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      handleValidateAndPreview(content, file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (val: string) => {
    setJsonText(val);
    handleValidateAndPreview(val);
  };

  const handleLoadExample = () => {
    setJsonText(JSON_EXAMPLE_TEMPLATE);
    handleValidateAndPreview(JSON_EXAMPLE_TEMPLATE, 'exemplo_solicitacao.json');
    setActiveTab('paste');
    addToast({ type: 'info', title: 'Exemplo Carregado', message: 'Modelo JSON preenchido na tela.' });
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON_EXAMPLE_TEMPLATE], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_solicitacao.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Download Concluído', message: 'Arquivo modelo_solicitacao.json salvo.' });
  };

  const handleCopyExample = () => {
    navigator.clipboard.writeText(JSON_EXAMPLE_TEMPLATE);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
    addToast({ type: 'info', title: 'Copiado', message: 'JSON de exemplo copiado para a área de transferência.' });
  };

  const handleImportSubmit = async () => {
    if (!jsonText.trim()) {
      addToast({ type: 'warning', title: 'Atenção', message: 'Forneça um arquivo .json ou cole o código JSON.' });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await importRequestsFromJson(jsonText);
      if (res.success) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const totalItemsCount = parsedPreview?.reduce((acc, req) => acc + (req.itens?.length || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* CABEÇALHO */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>Importar Solicitação via JSON</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20">
                  Geração Automática
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Envie um arquivo <code className="text-orange-300 font-mono bg-zinc-800 px-1 py-0.5 rounded">.json</code> com os itens para criar a solicitação instantaneamente
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-json-modal"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO MODAL */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* ABAS DE ENTRADA & AÇÕES RÁPIDAS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
              <button
                type="button"
                id="tab-json-upload"
                onClick={() => setActiveTab('upload')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload de Arquivo</span>
              </button>
              <button
                type="button"
                id="tab-json-paste"
                onClick={() => setActiveTab('paste')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Colar Código JSON</span>
              </button>
            </div>

            {/* Ações de Apoio (Modelo & Exemplo) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-load-example-json"
                onClick={handleLoadExample}
                className="px-2.5 py-1.5 text-xs text-orange-400 hover:bg-orange-950/20 border border-orange-500/20 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Carregar o exemplo com trator e peças"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Usar Exemplo</span>
              </button>
              <button
                type="button"
                id="btn-download-json-template"
                onClick={handleDownloadTemplate}
                className="px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 border border-zinc-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Baixar arquivo modelo .json"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Modelo</span>
              </button>
            </div>
          </div>

          {/* ÁREA DE UPLOAD */}
          {activeTab === 'upload' ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-orange-500/60 bg-zinc-950/60 hover:bg-zinc-950 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="input-json-file"
              />
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 group-hover:bg-orange-500/10 border border-zinc-800 group-hover:border-orange-500/30 text-zinc-400 group-hover:text-orange-400 flex items-center justify-center transition-colors shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">
                  {fileName ? (
                    <span className="text-orange-400 font-mono flex items-center justify-center gap-1.5">
                      <FileJson className="w-4 h-4" /> {fileName}
                    </span>
                  ) : (
                    'Clique para selecionar ou arraste o arquivo .json aqui'
                  )}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Formatos aceitos: arquivos estruturados JSON (máx. 5MB)
                </p>
              </div>
            </div>
          ) : (
            /* ÁREA DE COLAR TEXTO JSON */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <label htmlFor="textarea-json" className="font-semibold">
                  Cole o conteúdo do arquivo JSON:
                </label>
                <button
                  type="button"
                  onClick={handleCopyExample}
                  className="text-[11px] text-zinc-400 hover:text-orange-400 flex items-center gap-1 cursor-pointer"
                >
                  {copiedExample ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedExample ? 'Copiado!' : 'Copiar modelo'}</span>
                </button>
              </div>
              <textarea
                id="textarea-json"
                rows={9}
                value={jsonText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={JSON_EXAMPLE_TEMPLATE}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl p-3.5 text-xs text-zinc-200 font-mono leading-relaxed outline-hidden resize-y"
              />
            </div>
          )}

          {/* ERRO DE PARSING */}
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Falha ao processar o JSON:</div>
                <div className="text-rose-200/90 mt-0.5">{parseError}</div>
              </div>
            </div>
          )}

          {/* PRÉ-VISUALIZAÇÃO DOS DADOS ENCONTRADOS */}
          {parsedPreview && parsedPreview.length > 0 && (
            <div className="space-y-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Dados Identificados com Sucesso ({parsedPreview.length} solicitação{parsedPreview.length > 1 ? 'ões' : ''})
                  </span>
                </div>
                <span className="text-xs text-zinc-400">
                  Total de Itens: <strong className="text-orange-400">{totalItemsCount}</strong>
                </span>
              </div>

              {parsedPreview.map((req, reqIdx) => (
                <div key={reqIdx} className="space-y-3 pt-2">
                  {/* METADADOS DA SOLICITAÇÃO */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800/80 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Nº Solicitação</span>
                      <span className="font-mono font-bold text-orange-400">
                        {req.numero_solicitacao || 'Auto-gerado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Ordem de Compra</span>
                      <span className="font-mono font-semibold text-zinc-200">
                        {req.ordem_compra || 'Auto-gerada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Status Inicial</span>
                      <span className="font-semibold text-zinc-200">
                        {req.status || 'Aguardando'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Prioridade</span>
                      <span className="font-semibold text-amber-400">
                        {req.prioridade || 'Média'}
                      </span>
                    </div>
                  </div>

                  {/* OBSERVAÇÃO / JUSTIFICATIVA */}
                  {req.observacoes && (
                    <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/60 text-xs">
                      <span className="text-zinc-500 font-semibold text-[10px] uppercase block mb-0.5">Observações:</span>
                      <p className="text-zinc-300 italic">{req.observacoes}</p>
                    </div>
                  )}

                  {/* TABELA DE ITENS EXTRAÍDOS */}
                  <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                        <tr>
                          <th className="py-2 px-3">Código</th>
                          <th className="py-2 px-3">Descrição do Item</th>
                          <th className="py-2 px-3 text-center">Qtd</th>
                          <th className="py-2 px-3 text-center">Unidade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {req.itens.map((it, itIdx) => (
                          <tr key={itIdx} className="hover:bg-zinc-900/40">
                            <td className="py-2 px-3 font-mono text-[11px] text-orange-300">
                              {it.codigo}
                            </td>
                            <td className="py-2 px-3 font-medium text-zinc-200">
                              {it.descricao}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-zinc-100 font-mono">
                              {it.quantidade}
                            </td>
                            <td className="py-2 px-3 text-center uppercase font-mono text-zinc-400">
                              {it.unidade}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* RODAPÉ & BOTÕES */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/90 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer text-center"
          >
            Cancelar
          </button>

          <button
            type="button"
            id="btn-confirm-json-import"
            disabled={!parsedPreview || parsedPreview.length === 0 || isProcessing}
            onClick={handleImportSubmit}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              parsedPreview && parsedPreview.length > 0 && !isProcessing
                ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-orange-500/25 hover:scale-[1.02]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gerando Solicitação...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  Gerar Solicitação Automaticamente {parsedPreview && parsedPreview.length > 1 ? `(${parsedPreview.length})` : ''}
                </span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
