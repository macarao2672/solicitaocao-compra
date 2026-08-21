import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  Camera, 
  Loader2, 
  Package, 
  Calendar, 
  Hash, 
  ArrowRight,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { RequestPriority } from '../../types';
import { useData } from '../../context/DataContext';
import { firestoreService } from '../../services/firestoreService';

interface ExtractedData {
  numero_solicitacao?: string;
  requerente?: string;
  comprador?: string;
  local_entrega?: string;
  data_emissao?: string;
  data_limite?: string;
  prioridade?: RequestPriority;
  centro_custo?: string;
  observacoes?: string;
  solicitante?: string;
  para_onde_pedido?: string;
  itens?: Array<{
    codigo: string;
    descricao: string;
    cod_fabricante?: string;
    marca?: string;
    unidade: string;
    quantidade: number;
    destino?: string;
    valor_unitario_estimado?: number;
  }>;
}

interface ImportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: ExtractedData, originalImageBase64?: string, autoSave?: boolean) => void;
}

// Utilitário para redimensionar e otimizar imagens antes de enviar para a API
const optimizeImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const ImportImageModal: React.FC<ImportImageModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
}) => {
  const { addToast } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', title: 'Formato inválido', message: 'Por favor, selecione uma imagem (JPG, PNG, WEBP).' });
      return;
    }

    setMimeType('image/jpeg');
    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      // Otimizar resolução e tamanho do arquivo para agilizar o processamento pela IA
      const optimized = await optimizeImage(rawBase64);
      setImagePreview(optimized);
      processImageWithLocalOCR(optimized, 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const processImageWithLocalOCR = async (base64Data: string, type: string) => {
    setIsExtracting(true);
    setErrorMessage(null);
    setExtractedData(null);
    
    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: type,
        }),
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('A imagem é muito grande para o servidor processar.');
        }
        const errText = await response.text();
        let errMsg = `Erro HTTP ${response.status}`;
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.error || errMsg;
        } catch {
          errMsg = errText.length > 100 ? errText.substring(0, 100) + '...' : errText;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Falha na extração de OCR via Gemini.');
      }

      setExtractedData(data.data);
      addToast({ type: 'success', title: 'Leitura Inteligente Concluída', message: 'A IA do Gemini extraiu os dados com sucesso!' });

    } catch (err: any) {
      console.error('Erro na extração Gemini OCR:', err);
      const msg = err.message || 'Falha ao processar imagem via inteligência artificial.';
      setErrorMessage(msg);
      addToast({ type: 'error', title: 'Erro de Leitura', message: msg });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmImport = (autoSave = false) => {
    if (!extractedData) return;
    onApplyData(extractedData, imagePreview || undefined, autoSave);
    onClose();
  };

  const handleReset = () => {
    setImagePreview(null);
    setExtractedData(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Importar Solicitação por Imagem
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Camera className="w-2.5 h-2.5" /> OCR Local
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Tire uma foto ou envie o arquivo da solicitação impressa para extração automática
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Se nenhuma imagem foi selecionada */}
          {!imagePreview && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-750 hover:border-orange-500/60 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all bg-zinc-950/40 hover:bg-zinc-950/80 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-zinc-850 border border-zinc-750 group-hover:scale-105 group-hover:border-orange-500/40 text-orange-400 flex items-center justify-center mb-4 transition-all shadow-lg">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200 group-hover:text-white mb-1">
                Tirar foto ou selecionar imagem do documento
              </h3>
              <p className="text-xs text-zinc-400 max-w-md">
                Envie a foto da solicitação (ex: Condomínio Três Coqueiros). O sistema irá identificar automaticamente o número da solicitação, requerente, solicitante, para onde foi pedido, itens e prazos.
              </p>
            </div>
          )}

          {/* Processando ou Resultados */}
          {imagePreview && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Miniatura da Imagem */}
              <div className="md:col-span-4 space-y-3">
                <div className="text-xs font-bold text-zinc-400 uppercase flex items-center justify-between">
                  <span>Documento Original</span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-orange-400 hover:text-orange-300 text-[11px] font-normal flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Trocar Foto
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 max-h-72 flex items-center justify-center relative group">
                  <img
                    src={imagePreview}
                    alt="Documento"
                    className="w-full h-full object-contain max-h-72"
                  />
                  {isExtracting && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-center p-3">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                      <p className="text-xs font-bold text-zinc-200">Lendo texto da imagem...</p>
                      <p className="text-[10px] text-zinc-400">Pode levar alguns segundos no primeiro uso.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dados Extraídos */}
              <div className="md:col-span-8 space-y-4">
                {isExtracting ? (
                  <div className="h-64 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200">Convertendo imagem em texto (OCR)</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        O processo local pode demorar no primeiro carregamento do idioma.
                      </p>
                    </div>
                  </div>
                ) : errorMessage ? (
                  <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 space-y-3">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Falha na leitura da imagem</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{errorMessage}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => imagePreview && processImageWithLocalOCR(imagePreview, mimeType)}
                        className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Tentar Novamente</span>
                      </button>
                    </div>
                  </div>
                ) : extractedData ? (
                  <div className="space-y-4">
                    {/* Cartão de Informações Gerais */}
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                        <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" />
                          Nº Solicitação: {extractedData.numero_solicitacao || 'Não detectado'}
                        </span>
                        {extractedData.data_limite && (
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-orange-400" />
                            Limite: {extractedData.data_limite}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Requerente</span>
                          <span className="text-zinc-200 font-medium">{extractedData.requerente || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Solicitante (Real)</span>
                          <span className="text-emerald-400 font-bold">{extractedData.solicitante || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Para Onde Foi Pedido</span>
                          <span className="text-orange-400 font-bold">{extractedData.para_onde_pedido || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Local de Entrega</span>
                          <span className="text-zinc-200 font-medium">{extractedData.local_entrega || '—'}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Centro de Custo / Resultado</span>
                          <span className="text-zinc-300 font-medium">{extractedData.centro_custo || '—'}</span>
                        </div>
                        {extractedData.observacoes && (
                          <div className="sm:col-span-2 pt-1 border-t border-zinc-900">
                            <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Observação Completa</span>
                            <span className="text-[11px] text-zinc-400 italic block">{extractedData.observacoes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tabela de Itens Identificados */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-orange-400" />
                          Itens Identificados ({extractedData.itens?.length || 0})
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {extractedData.itens && extractedData.itens.length > 0 ? (
                          extractedData.itens.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-[11px] font-bold text-orange-400 bg-orange-950/40 border border-orange-800/40 px-1.5 py-0.2 rounded">
                                    {item.codigo}
                                  </span>
                                  {item.cod_fabricante && (
                                    <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded">
                                      Fab: {item.cod_fabricante}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold text-zinc-300 bg-zinc-850 px-1.5 py-0.2 rounded">
                                    {item.quantidade} {item.unidade}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-zinc-200 truncate mt-1">
                                  {item.descricao}
                                </p>
                                {item.destino && (
                                  <p className="text-[10px] text-zinc-400 mt-0.5">
                                    Destino: {item.destino}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-xs text-zinc-500 bg-zinc-950 rounded-lg">
                            Nenhum item na tabela da imagem.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {extractedData && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleConfirmImport(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer hidden sm:block"
              >
                Preencher e Revisar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmImport(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <span>Salvar Direto</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
