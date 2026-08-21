import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  Camera, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  Hash
} from 'lucide-react';
import { RequestPriority } from '../../types';
import { useData } from '../../context/DataContext';

interface ExtractedData {
  numero_solicitacao?: string;
  requerente?: string;
  observacoes?: string;
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

  const handleReset = () => {
    setImagePreview(null);
    setExtractedData(null);
    setErrorMessage(null);
    setIsExtracting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', title: 'Formato Inválido', message: 'Selecione apenas arquivos de imagem (JPG, PNG).' });
      return;
    }

    setMimeType(file.type);
    setIsExtracting(true);
    setErrorMessage(null);
    setExtractedData(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      
      try {
        const optimizedImage = await optimizeImage(base64, 800, 800, 0.7);
        setImagePreview(optimizedImage);
        await processImageWithLocalOCR(optimizedImage, file.type);
      } catch (err) {
        console.error('Erro na otimização:', err);
        setErrorMessage('Falha ao processar imagem para envio.');
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const processImageWithLocalOCR = async (imageBase64: string, type: string) => {
    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro desconhecido na API local');
      }

      const result = await response.json();
      
      if (!result.data) {
        throw new Error('Nenhum dado retornado pela inteligência artificial.');
      }

      setExtractedData(result.data);
      addToast({ type: 'success', title: 'Leitura Concluída', message: 'Os dados foram extraídos com sucesso.' });
      
    } catch (err: any) {
      console.error("Erro OCR:", err);
      setErrorMessage(
        err.message?.includes('Network') ? 'Servidor local não está respondendo. Verifique o console.' :
        `Falha ao analisar a imagem: ${err.message}`
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmImport = (autoSave: boolean) => {
    if (!extractedData) return;
    onApplyData(extractedData, imagePreview || undefined, autoSave);
    handleReset();
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Leitura Automática de Solicitação
              </h2>
              <p className="text-xs text-zinc-400">
                Tire uma foto do documento para preencher o formulário automaticamente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Seletor de Arquivo Vazio */}
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
                Tirar foto ou selecionar imagem
              </h3>
              <p className="text-xs text-zinc-400 max-w-md">
                Envie a foto da solicitação. O sistema extrairá o número, requerente e observações.
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
                      <h4 className="text-sm font-bold text-zinc-200">Extraindo informações</h4>
                    </div>
                  </div>
                ) : errorMessage ? (
                  <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 space-y-3">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                      <AlertCircle className="w-4 h-4" />
                      <span>Falha na leitura</span>
                    </div>
                    <p className="text-xs text-zinc-300">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => imagePreview && processImageWithLocalOCR(imagePreview, mimeType)}
                      className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tentar Novamente
                    </button>
                  </div>
                ) : extractedData ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                        <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5" />
                          Nº Solicitação: {extractedData.numero_solicitacao || 'Não detectado'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Requerente</span>
                          <span className="text-zinc-200 font-medium">{extractedData.requerente || '—'}</span>
                        </div>
                        {extractedData.observacoes && (
                          <div className="pt-1 border-t border-zinc-900">
                            <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Observações</span>
                            <span className="text-[11px] text-zinc-400 italic block">{extractedData.observacoes}</span>
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
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <span>Preencher Formulário</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
