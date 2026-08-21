import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { RequestItem, Attachment, RequestPriority, PurchaseRequest, CatalogItem } from '../../types';
import { 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  Paperclip, 
  AlertCircle, 
  Upload, 
  Check, 
  ShoppingCart,
  DollarSign,
  Package,
  Layers,
  Database,
  Sparkles,
  Search,
  Lock,
  Camera,
  Calendar,
  MapPin,
  User,
  Truck,
  Hash,
  Info
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import { CatalogItemPickerModal } from './CatalogItemPickerModal';
import { ImportImageModal } from './ImportImageModal';

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PurchaseRequest | null;
}

const DEPARTMENTS = [
  'FROTA APOIO - GNT',
  'OPERAÇÕES & FACILITIES',
  'LOGÍSTICA & SUPRIMENTOS',
  'ALMOXARIFADO - GNT',
  'MANUTENÇÃO DE MÁQUINAS',
  'TECNOLOGIA & INOVAÇÃO',
  'FINANCEIRO & CONTROLADORIA',
  'RECURSOS HUMANOS',
  'OUTRO'
];

const UNIT_OPTIONS = ['UN', 'CX', 'KG', 'PCT', 'L', 'M', 'PAR', 'SERV', 'KIT', 'PC'];

export const RequestFormModal: React.FC<RequestFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { createRequest, updateRequest, addToast, catalogItems } = useData();

  const isEditing = !!initialData && !!initialData.id;

  // Campos Principais do Formulário
  const [numeroSolicitacao, setNumeroSolicitacao] = useState(
    initialData?.numero_solicitacao || ''
  );
  const [requerente, setRequerente] = useState(initialData?.requerente || '');
  const [solicitante, setSolicitante] = useState(initialData?.solicitante_nome || '');
  const [paraOndePedido, setParaOndePedido] = useState(initialData?.para_onde_pedido || '');
  const [localEntrega, setLocalEntrega] = useState(initialData?.local_entrega || 'GNT - MAURO');
  const [dataLimite, setDataLimite] = useState(initialData?.data_limite || '');
  const [prioridade, setPrioridade] = useState<RequestPriority>(initialData?.prioridade || 'Média');
  const [centroCusto, setCentroCusto] = useState(initialData?.centro_custo || 'FROTA APOIO - GNT');
  const [observacoes, setObservacoes] = useState(initialData?.observacoes || '');
  const [justificativa, setJustificativa] = useState(initialData?.justificativa || '');
  const [motivoEdicao, setMotivoEdicao] = useState('');

  // Itens da Solicitação
  const [itens, setItens] = useState<Array<Omit<RequestItem, 'id'> & { id?: string }>>(
    initialData?.itens || [
      {
        codigo: '',
        descricao: '',
        quantidade: 1,
        unidade: 'UN',
        destino: 'ALMOXARIFADO - GNT',
        cod_fabricante: '',
        marca: '',
        valor_unitario_estimado: 0,
      }
    ]
  );

  // Anexos
  const [anexos, setAnexos] = useState<Attachment[]>(initialData?.anexos || []);
  const [isUploading, setIsUploading] = useState(false);

  // Modais Auxiliares
  const [isImageImportOpen, setIsImageImportOpen] = useState(false);
  const [pickerItemIndex, setPickerItemIndex] = useState<number | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<{ index: number; field: 'codigo' | 'descricao' } | null>(null);

  if (!isOpen) return null;

  // Aplicar dados extraídos diretamente da imagem/foto via Gemini
  const handleApplyExtractedData = (extracted: any, originalImageBase64?: string, autoSave?: boolean) => {
    if (extracted.numero_solicitacao) {
      setNumeroSolicitacao(String(extracted.numero_solicitacao).trim());
    }
    if (extracted.requerente) {
      setRequerente(extracted.requerente.trim());
    }
    if (extracted.solicitante) {
      setSolicitante(extracted.solicitante.trim());
    }
    if (extracted.para_onde_pedido) {
      setParaOndePedido(extracted.para_onde_pedido.trim());
    }
    if (extracted.local_entrega) {
      setLocalEntrega(extracted.local_entrega.trim());
    }
    if (extracted.data_limite) {
      let d = extracted.data_limite;
      if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) {
          let year = parts[2];
          if (year.length === 2) year = "20" + year;
          d = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      setDataLimite(d);
    }
    if (extracted.prioridade) {
      setPrioridade(extracted.prioridade);
    }
    if (extracted.centro_custo) {
      setCentroCusto(extracted.centro_custo.trim());
    }
    if (extracted.observacoes) {
      setObservacoes(extracted.observacoes.trim());
    }

    if (extracted.itens && Array.isArray(extracted.itens) && extracted.itens.length > 0) {
      const mappedItens = extracted.itens.map((it: any) => {
        const cleanCode = (it.codigo || '').trim().toLowerCase();
        const matched = catalogItems.find((c) => c.codigo.trim().toLowerCase() === cleanCode);

        return {
          codigo: it.codigo || '',
          descricao: matched ? matched.descricao : (it.descricao || ''),
          quantidade: Number(it.quantidade) || 1,
          unidade: matched ? matched.unidade : (it.unidade || 'UN'),
          destino: it.destino || 'ALMOXARIFADO - GNT',
          cod_fabricante: it.cod_fabricante || '',
          marca: it.marca || '',
          valor_unitario_estimado: matched ? matched.valor_unitario_estimado : (Number(it.valor_unitario_estimado) || 0),
        };
      });
      setItens(mappedItens);
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

  // Seleção de um item do catálogo
  const handleSelectCatalogItem = (index: number, catItem: CatalogItem) => {
    const updated = [...itens];
    updated[index] = {
      ...updated[index],
      codigo: catItem.codigo,
      descricao: catItem.descricao,
      valor_unitario_estimado: catItem.valor_unitario_estimado,
      unidade: catItem.unidade || updated[index].unidade || 'UN',
    };
    setItens(updated);
    setActiveSuggestion(null);
  };

  // Manipuladores de Itens
  const handleAddItem = () => {
    setItens([
      ...itens,
      {
        codigo: '',
        descricao: '',
        quantidade: 1,
        unidade: 'UN',
        destino: localEntrega || 'ALMOXARIFADO - GNT',
        cod_fabricante: '',
        marca: '',
        valor_unitario_estimado: 0,
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (itens.length <= 1) {
      addToast({ type: 'warning', title: 'Item obrigatório', message: 'A solicitação deve conter pelo menos um item.' });
      return;
    }
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemCodeChange = (index: number, newCode: string) => {
    const updated = [...itens];
    const clean = newCode.trim();
    
    // Busca automática no catálogo cadastrado
    const matchedItem = catalogItems.find(
      (c) => c.codigo.trim().toLowerCase() === clean.toLowerCase()
    );

    if (matchedItem) {
      updated[index] = {
        ...updated[index],
        codigo: newCode,
        descricao: matchedItem.descricao,
        valor_unitario_estimado: matchedItem.valor_unitario_estimado,
        unidade: matchedItem.unidade || updated[index].unidade || 'UN',
      };
    } else {
      updated[index] = {
        ...updated[index],
        codigo: newCode,
      };
    }
    setItens(updated);
  };

  const handleItemChange = (index: number, field: keyof RequestItem, value: any) => {
    const currentItem = itens[index];
    const cleanCode = (currentItem.codigo || '').trim().toLowerCase();
    const isMatched = catalogItems.some((c) => c.codigo.trim().toLowerCase() === cleanCode);

    // Se o item já estiver cadastrado no catálogo, impede a alteração de descrição, unidade e valor unitário
    if (isMatched && (field === 'descricao' || field === 'unidade' || field === 'valor_unitario_estimado')) {
      return;
    }

    const updated = [...itens];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItens(updated);
  };

  // Upload de Anexo em Base64 com Otimização
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      addToast({ type: 'error', title: 'Arquivo muito grande', message: 'O arquivo deve ter no máximo 8MB.' });
      return;
    }

    setIsUploading(true);
    try {
      let finalDataUrl = '';
      if (file.type.startsWith('image/')) {
        finalDataUrl = await compressImage(file, 1200, 1200, 0.8);
      } else {
        finalDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const newAttachment: Attachment = {
        id: `att_${Date.now()}`,
        nome: file.name,
        tipo: file.type || 'application/octet-stream',
        tamanho: file.size,
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

  // Cálculo do Total
  const totalEstimado = itens.reduce((sum, it) => {
    const q = Number(it.quantidade) || 0;
    const v = Number(it.valor_unitario_estimado) || 0;
    return sum + (q * v);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se todos os itens possuem descrição
    const hasEmptyDescription = itens.some((it) => !it.descricao.trim());
    if (hasEmptyDescription) {
      addToast({ type: 'error', title: 'Item incompleto', message: 'Preencha a descrição de todos os itens da lista.' });
      return;
    }

    if (isEditing && initialData) {
      const ok = updateRequest(initialData.id, {
        numero_solicitacao: numeroSolicitacao.trim() || undefined,
        requerente,
        solicitante_nome: solicitante,
        para_onde_pedido: paraOndePedido,
        local_entrega: localEntrega,
        data_limite: dataLimite,
        prioridade,
        centro_custo: centroCusto,
        observacoes,
        justificativa: justificativa || (paraOndePedido ? `Uso em: ${paraOndePedido}` : 'Solicitação registrada'),
        itens: itens as any,
        anexos,
        motivoEdicao: motivoEdicao || 'Atualização de campos da solicitação.',
      });
      if (ok) onClose();
    } else {
      const created = createRequest({
        numero_solicitacao: numeroSolicitacao.trim() || undefined,
        requerente,
        solicitante_nome: solicitante,
        para_onde_pedido: paraOndePedido,
        local_entrega: localEntrega,
        data_limite: dataLimite,
        prioridade,
        centro_custo: centroCusto,
        observacoes,
        justificativa: justificativa || (paraOndePedido ? `Uso em: ${paraOndePedido}` : 'Solicitação de compra'),
        itens,
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
                title="Tirar foto ou enviar imagem para extração automática"
              >
                <Camera className="w-4 h-4 text-orange-400" />
                <span>Importar Imagem</span>
                <Sparkles className="w-3 h-3 text-orange-300" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formulário com Scroll Interno */}
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

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Número da Solicitação */}
              <div className="sm:col-span-4">
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
              <div className="sm:col-span-4">
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

              {/* Solicitante (Extraído da observação ou especificado) */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Solicitante (Real) *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={solicitante}
                    onChange={(e) => setSolicitante(e.target.value)}
                    placeholder="Ex: CLAUDIR SOARES"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-750 rounded-xl text-sm font-medium text-emerald-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Para onde foi pedido (Veículo / Frota / Aplicação) */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Para Onde Foi Pedido (Veículo / Equipamento / Destino) *
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 text-orange-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paraOndePedido}
                    onChange={(e) => setParaOndePedido(e.target.value)}
                    placeholder="Ex: CAMINHÃO DE FROTA 5097"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-750 rounded-xl text-sm font-semibold text-orange-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Local de Entrega */}
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Local de Entrega *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={localEntrega}
                    onChange={(e) => setLocalEntrega(e.target.value)}
                    placeholder="Ex: GNT - MAURO"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-750 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Data Limite */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Data Limite
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dataLimite}
                    onChange={(e) => setDataLimite(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-750 rounded-xl text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Prioridade */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Prioridade
                </label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as RequestPriority)}
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-750 rounded-xl text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>

              {/* Centro de Custo / Resultado */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">
                  Centro de Resultado / Custo
                </label>
                <input
                  type="text"
                  value={centroCusto}
                  onChange={(e) => setCentroCusto(e.target.value)}
                  placeholder="Ex: FROTA APOIO - GNT"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-750 rounded-xl text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* ITENS DA SOLICITAÇÃO (Tabela Dinâmica) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                    Itens da Solicitação ({itens.length})
                  </h3>
                  {catalogItems.length > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                      <Database className="w-3 h-3" />
                      {catalogItems.length} itens no banco
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Itens cadastrados no catálogo bloqueiam alteração de nome, unidade e valor.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {catalogItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPickerItemIndex(0)}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Buscar itens no banco cadastrado"
                  >
                    <Search className="w-3.5 h-3.5 text-orange-400" />
                    <span>Buscar no Banco</span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-add-request-item"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Item</span>
                </button>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="space-y-3">
              {itens.map((item, index) => {
                const cleanCode = (item.codigo || '').trim().toLowerCase();
                const matchedCatalog = catalogItems.find((c) => c.codigo.trim().toLowerCase() === cleanCode);
                const hasCode = !!cleanCode;

                const isSuggestionActive = activeSuggestion?.index === index;
                const filterQuery = isSuggestionActive 
                  ? (activeSuggestion.field === 'codigo' ? (item.codigo || '').trim().toLowerCase() : (item.descricao || '').trim().toLowerCase())
                  : '';

                const inlineSuggestions = (isSuggestionActive && filterQuery.length >= 1)
                  ? catalogItems.filter((c) => 
                      c.codigo.toLowerCase().includes(filterQuery) || 
                      c.descricao.toLowerCase().includes(filterQuery)
                    ).slice(0, 4)
                  : [];

                return (
                  <div
                    key={index}
                    className="p-3.5 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-2.5 relative"
                  >
                    {/* Linha 1: Código, Descrição, Cód. Fabricante, Ações */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      {/* Código */}
                      <div className="sm:col-span-3 relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                            Código do Item *
                          </label>
                          {catalogItems.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setPickerItemIndex(index)}
                              className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5 font-medium cursor-pointer"
                            >
                              <Search className="w-2.5 h-2.5" />
                              <span>Buscar</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.codigo}
                          onFocus={() => setActiveSuggestion({ index, field: 'codigo' })}
                          onChange={(e) => {
                            handleItemCodeChange(index, e.target.value);
                            setActiveSuggestion({ index, field: 'codigo' });
                          }}
                          placeholder="Ex: 58656"
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-750 text-zinc-100 placeholder-zinc-500 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                          required
                        />
                      </div>

                      {/* Descrição */}
                      <div className="sm:col-span-6 relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                            Descrição do Material / Serviço *
                          </label>
                          {matchedCatalog && (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Bloqueado (Catálogo)
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.descricao}
                          disabled={!!matchedCatalog}
                          readOnly={!!matchedCatalog}
                          onFocus={() => {
                            if (!matchedCatalog) {
                              setActiveSuggestion({ index, field: 'descricao' });
                            }
                          }}
                          onChange={(e) => {
                            if (!matchedCatalog) {
                              handleItemChange(index, 'descricao', e.target.value);
                              setActiveSuggestion({ index, field: 'descricao' });
                            }
                          }}
                          placeholder="Ex: CONJUNTO SENSOR INDUTIVO..."
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            matchedCatalog
                              ? 'bg-zinc-950/90 border border-zinc-800 text-zinc-300 cursor-not-allowed select-none font-medium'
                              : 'bg-zinc-900 border border-zinc-750 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500'
                          }`}
                          required
                        />
                      </div>

                      {/* Cód Fabricante */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                          Cód. Fabricante
                        </label>
                        <input
                          type="text"
                          value={item.cod_fabricante || ''}
                          onChange={(e) => handleItemChange(index, 'cod_fabricante', e.target.value)}
                          placeholder="Ex: CN003138"
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-750 text-zinc-200 placeholder-zinc-600 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Linha 2: Quantidade, Unidade, Destino do Item, Valor Unitário, Remover */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                      {/* Quantidade */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                          Qtd. *
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.quantidade}
                          onChange={(e) => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-750 text-zinc-100 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                          required
                        />
                      </div>

                      {/* Unidade */}
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                            Unid.
                          </label>
                          {matchedCatalog && (
                            <Lock className="w-2.5 h-2.5 text-emerald-400" title="Bloqueado pelo Catálogo" />
                          )}
                        </div>
                        <select
                          value={item.unidade}
                          disabled={!!matchedCatalog}
                          onChange={(e) => handleItemChange(index, 'unidade', e.target.value)}
                          className={`w-full px-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            matchedCatalog
                              ? 'bg-zinc-950/90 border border-zinc-800 text-zinc-300 cursor-not-allowed font-mono'
                              : 'bg-zinc-900 border border-zinc-750 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500'
                          }`}
                        >
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>

                      {/* Destino do Item */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                          Destino do Item
                        </label>
                        <input
                          type="text"
                          value={item.destino || ''}
                          onChange={(e) => handleItemChange(index, 'destino', e.target.value)}
                          placeholder="Ex: ALMOXARIFADO - GNT"
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-750 text-zinc-200 placeholder-zinc-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>

                      {/* Valor Estimado */}
                      <div className="sm:col-span-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">
                            Vlr. Unit. (R$)
                          </label>
                          {matchedCatalog && (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Fixo
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.valor_unitario_estimado}
                          disabled={!!matchedCatalog}
                          readOnly={!!matchedCatalog}
                          onChange={(e) => {
                            if (!matchedCatalog) {
                              handleItemChange(index, 'valor_unitario_estimado', parseFloat(e.target.value) || 0);
                            }
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                            matchedCatalog
                              ? 'bg-zinc-950/90 border border-zinc-800 text-emerald-400 font-bold cursor-not-allowed select-none'
                              : 'bg-zinc-900 border border-zinc-750 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500'
                          }`}
                        />
                      </div>

                      {/* Botão Remover Item */}
                      <div className="sm:col-span-1 flex justify-end items-end h-full">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remover Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sugestões inline do Catálogo */}
                    {inlineSuggestions.length > 0 && !matchedCatalog && (
                      <div className="p-2 bg-zinc-900 border border-orange-500/30 rounded-xl space-y-1.5 animate-in fade-in duration-150 shadow-lg">
                        <div className="flex items-center justify-between px-1 text-[10px] text-zinc-400 font-medium">
                          <span className="flex items-center gap-1 text-orange-400">
                            <Sparkles className="w-3 h-3" />
                            Sugestões do Banco de Itens:
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveSuggestion(null)}
                            className="text-zinc-500 hover:text-zinc-300 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {inlineSuggestions.map((sug) => (
                            <button
                              key={sug.id}
                              type="button"
                              onClick={() => handleSelectCatalogItem(index, sug)}
                              className="text-left p-2 rounded-lg bg-zinc-950 hover:bg-orange-500/10 border border-zinc-800 hover:border-orange-500/40 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] font-bold text-orange-400">
                                    {sug.codigo}
                                  </span>
                                  <span className="text-[10px] text-zinc-400">
                                    ({sug.unidade})
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-200 truncate group-hover:text-white">
                                  {sug.descricao}
                                </p>
                              </div>
                              <span className="font-mono text-[11px] font-bold text-emerald-400 shrink-0">
                                R$ {Number(sug.valor_unitario_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status do Item */}
                    {hasCode && (
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-900 text-[10px]">
                        {matchedCatalog ? (
                          <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                            Item cadastrado: dados e valor travados conforme catálogo oficial.
                          </span>
                        ) : (
                          <span className="text-amber-400/90 flex items-center gap-1.5">
                            <Database className="w-3 h-3 shrink-0" />
                            Novo código: será registrado automaticamente no banco ao salvar.
                          </span>
                        )}
                        <span className="font-mono text-zinc-400">
                          Subtotal: R$ {((item.quantidade || 0) * (item.valor_unitario_estimado || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totalizador */}
            <div className="flex justify-end pt-2">
              <div className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3">
                <span className="text-xs text-zinc-400">Valor Total Estimado:</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  R$ {totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Observações da Solicitação */}
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
              Observações
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: SOLICITACAO DE COMPRA DE PECA PARA USO NO CAMINHAO DE FROTA 5097/SOLICITANTE:CLAUDIR SOARES/REQUI:14770 FILIAL GNT"
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
                placeholder="Ex: Ajuste de código do item, correção de quantidade..."
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

      {/* Modal de Seleção do Banco de Itens */}
      {pickerItemIndex !== null && (
        <CatalogItemPickerModal
          isOpen={pickerItemIndex !== null}
          onClose={() => setPickerItemIndex(null)}
          catalogItems={catalogItems}
          currentIndex={pickerItemIndex}
          onSelectItem={(item) => {
            handleSelectCatalogItem(pickerItemIndex, item);
            setPickerItemIndex(null);
          }}
        />
      )}
    </div>
  );
};
