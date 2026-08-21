import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Attachment, PurchaseRequest } from '../../types';
import { 
  X, 
  Trash2, 
  FileText, 
  Paperclip, 
  Sparkles, 
  Camera, 
  User, 
  Hash, 
  ShoppingCart
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import { ImportImageModal } from './ImportImageModal';

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PurchaseRequest | null;
}

export const RequestFormModal: React.FC<RequestFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { createRequest, updateRequest, addToast } = useData();
  const isEditing = !!initialData && !!initialData.id;

  // Campos Principais do Formulário
  const [numeroSolicitacao, setNumeroSolicitacao] = useState(
    initialData?.numero_solicitacao || ''
  );
  const [requerente, setRequerente] = useState(initialData?.requerente || '');
  const [observacoes, setObservacoes] = useState(initialData?.observacoes || '');
  const [motivoEdicao, setMotivoEdicao] = useState('');

  // Anexos
  const [anexos, setAnexos] = useState<Attachment[]>(initialData?.anexos || []);
  const [isUploading, setIsUploading] = useState(false);

  // Modais Auxiliares
  const [isImageImportOpen, setIsImageImportOpen] = useState(false);

  if (!isOpen) return null;

  // Aplicar dados extraídos diretamente da imagem/foto via Gemini
  const handleApplyExtractedData = (extracted: any, originalImageBase64?: string, autoSave?: boolean) => {
    if (extracted.numero_solicitacao) {
      setNumeroSolicitacao(String(extracted.numero_solicitacao).trim());
    }
    if (extracted.requerente) {
      setRequerente(extracted.requerente.trim());
    }
    if (extracted.observacoes) {
      setObservacoes(extracted.observacoes.trim());
    }

    // Se tiver a imagem original, adicionar como anexo da solicitação
    if (originalImageBase64) {
      const docAttachment: Attachment = {
        id: `att_${Date.now()}`,
        nome: `Documento_Solicitacao_${extracted.numero_solicitacao || 'Foto'}.jpg`,
        tipo: 'image/jpeg',
        data_url: originalImageBase64,
        data_upload: new Date().toISOString(),
      };
      setAnexos((prev) => [docAttachment, ...prev]);
    }

    addToast({
      type: 'success',
      title: 'Dados Preenchidos',
      message: 'As informações da foto foram inseridas no formulário com sucesso!'
    });

    if (autoSave) {
      setTimeout(() => {
        const form = document.getElementById('request-form-element') as HTMLFormElement;
        if (form) form.requestSubmit();
      }, 300); // Aguarda a renderização do React atualizar os estados antes de salvar
    }
  };

  // Upload de Anexos
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const file = files[0];
      const isImage = file.type.startsWith('image/');
      
      let finalDataUrl = '';
      if (isImage) {
        finalDataUrl = await compressImage(file, 800, 800, 0.7);
      } else {
        const reader = new FileReader();
        finalDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const newAttachment: Attachment = {
        id: `att_${Date.now()}`,
        nome: file.name,
        tipo: file.type,
        data_url: finalDataUrl,
        data_upload: new Date().toISOString(),
      };

      setAnexos([...anexos, newAttachment]);
      addToast({ type: 'success', title: 'Anexo adicionado', message: file.name });
    } catch (err) {
      console.error('Erro ao processar anexo:', err);
      addToast({ type: 'error', title: 'Erro no Upload', message: 'Não foi possível carregar o anexo.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAnexos(anexos.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && initialData) {
      const ok = updateRequest(initialData.id, {
        numero_solicitacao: numeroSolicitacao.trim() || undefined,
        requerente,
        observacoes,
        anexos,
        motivoEdicao: motivoEdicao || 'Atualização de campos da solicitação.',
      });
      if (ok) onClose();
    } else {
      const created = createRequest({
        numero_solicitacao: numeroSolicitacao.trim() || undefined,
        requerente,
        observacoes,
        solicitante_nome: '',
        para_onde_pedido: '',
        local_entrega: '',
        data_limite: '',
        prioridade: 'Média',
        centro_custo: '',
        justificativa: 'Solicitação registrada simplificada',
        itens: [],
        anexos,
      });
      if (created) onClose();
    }
  };

  return (
    <div 
      id="modal-request-form" 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header do Modal */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-100">
                  {isEditing ? `Editar Solicitação: ${initialData?.numero_solicitacao}` : 'Nova Solicitação de Compra'}
                </h2>
              </div>
              <p className="text-xs text-zinc-400">
                {isEditing ? 'Atualize os dados e registre a justificativa da alteração' : 'Preencha os campos abaixo ou extraia direto de uma foto com IA'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botão Importar Imagem com IA */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsImageImportOpen(true)}
                className="px-3 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Importar Imagem (IA)</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-zinc-300" />
            </button>
          </div>
        </div>

        {/* Corpo do Formulário */}
        <form id="request-form-element" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-zinc-100">
          
          {/* Seção 1: Identificação e Cabeçalho do Documento */}
          <div className="p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Dados da Solicitação
              </span>
              {!isEditing && (
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  Dica: use "Importar Imagem" para preencher tudo em 1 toque
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Número da Solicitação */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Número da Solicitação *
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-orange-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={numeroSolicitacao}
                    onChange={(e) => setNumeroSolicitacao(e.target.value)}
                    placeholder="Ex: 139312"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-750 rounded-xl text-sm font-mono font-bold text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Requerente */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Requerente *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={requerente}
                    onChange={(e) => setRequerente(e.target.value)}
                    placeholder="Ex: FLAVIO.SILVA"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-750 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Observações da Solicitação */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
              Observações
            </label>
            <textarea
              rows={4}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva as informações adicionais da solicitação..."
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Justificativa da Alteração (Se estiver editando) */}
          {isEditing && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5">
              <label className="block text-xs font-bold text-amber-400 uppercase">
                Motivo da Alteração (Auditoria) *
              </label>
              <input
                type="text"
                value={motivoEdicao}
                onChange={(e) => setMotivoEdicao(e.target.value)}
                placeholder="Ex: Correção no número da solicitação..."
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>
          )}

          {/* Anexos */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase text-zinc-400">
                Anexos & Imagens ({anexos.length})
              </label>
              <label className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                <Paperclip className="w-3.5 h-3.5 text-orange-400" />
                <span>{isUploading ? 'Processando...' : 'Adicionar Anexo'}</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
            
            {anexos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {anexos.map((att) => (
                  <div
                    key={att.id}
                    className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {att.tipo.startsWith('image/') ? (
                        <img
                          src={att.data_url}
                          alt={att.nome}
                          className="w-7 h-7 object-cover rounded-lg border border-zinc-700 shrink-0"
                        />
                      ) : (
                        <FileText className="w-5 h-5 text-orange-400 shrink-0" />
                      )}
                      <span className="truncate text-zinc-200 font-medium">{att.nome}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Solicitação'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Importação de Imagem com IA */}
      <ImportImageModal
        isOpen={isImageImportOpen}
        onClose={() => setIsImageImportOpen(false)}
        onApplyData={handleApplyExtractedData}
      />
    </div>
  );
};
