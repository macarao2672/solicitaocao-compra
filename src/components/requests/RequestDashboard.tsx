import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PurchaseRequest, PurchaseRequestStatus } from '../../types';
import { RequestFormModal } from './RequestFormModal';
import { RequestDetailModal } from './RequestDetailModal';
import { ImportImageModal } from './ImportImageModal';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  PackageCheck, 
  Ban, 
  Eye, 
  Edit3, 
  Trash2, 
  FileSpreadsheet,
  Layers,
  Camera,
  Sparkles,
  User,
  Hash
} from 'lucide-react';

export const RequestDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { requests, deleteRequest, addToast, createRequest } = useData();

  // Estados de Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImageImportModalOpen, setIsImageImportModalOpen] = useState(false);
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<PurchaseRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null);

  // Estados de Filtros e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PurchaseRequestStatus>('ALL');
  const [sortBy, setSortBy] = useState<'RECENT' | 'OLDEST'>('RECENT');

  // Métricas do Dashboard
  const metrics = useMemo(() => {
    const totalCount = requests.length;
    const aguardandoCount = requests.filter((r) => r.status === 'Aguardando').length;
    const compraRealizadaCount = requests.filter((r) => r.status === 'Compra realizada').length;
    const entregueCount = requests.filter((r) => r.status === 'Entregue').length;

    return {
      totalCount,
      aguardandoCount,
      compraRealizadaCount,
      entregueCount,
    };
  }, [requests]);

  // Lista Filtrada e Ordenada
  const filteredRequests = useMemo(() => {
    return requests
      .filter((req) => {
        // Busca textual
        const term = searchTerm.toLowerCase();
        const matchesTerm =
          (req.numero_solicitacao || '').toLowerCase().includes(term) ||
          (req.requerente || '').toLowerCase().includes(term) ||
          (req.observacoes || '').toLowerCase().includes(term);

        // Filtro por Status
        const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;

        return matchesTerm && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'RECENT') {
          return new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime();
        }
        if (sortBy === 'OLDEST') {
          return new Date(a.data_criacao).getTime() - new Date(b.data_criacao).getTime();
        }
        return 0;
      });
  }, [requests, searchTerm, statusFilter, sortBy]);

  // Aplicar dados da imagem criando diretamente ou abrindo formulário
  const handleApplyExtractedFromImage = (extracted: any, originalImageBase64?: string, autoSave?: boolean) => {
    
    // Abrir o modal com os dados pré-carregados ou salvar direto
    const newReqDraft: any = {
      numero_solicitacao: extracted.numero_solicitacao ? String(extracted.numero_solicitacao).trim() : '',
      requerente: extracted.requerente ? String(extracted.requerente).trim() : '',
      solicitante_nome: '',
      para_onde_pedido: '',
      local_entrega: '',
      data_limite: '',
      prioridade: 'Média',
      centro_custo: '',
      observacoes: extracted.observacoes ? String(extracted.observacoes).trim() : '',
      justificativa: 'Solicitação registrada a partir de imagem',
      itens: [],
      anexos: originalImageBase64 ? [
        {
          id: `att_${Date.now()}`,
          nome: `Solicitacao_${extracted.numero_solicitacao || 'Doc'}.jpg`,
          tipo: 'image/jpeg',
          data_url: originalImageBase64,
          data_upload: new Date().toISOString(),
        }
      ] : [],
    };

    if (autoSave) {
       createRequest(newReqDraft);
    } else {
       setEditingRequest(newReqDraft);
       setIsCreateModalOpen(true);
    }
  };

  // Exportação CSV
  const handleExportCSV = () => {
    if (filteredRequests.length === 0) {
      addToast({ type: 'warning', title: 'Sem registros', message: 'Nenhuma solicitação para exportar.' });
      return;
    }

    const headers = [
      'Numero_Solicitacao',
      'Requerente',
      'Status',
      'Data_Criacao'
    ];

    const rows = filteredRequests.map((r) => [
      `"${r.numero_solicitacao}"`,
      `"${r.requerente || ''}"`,
      `"${r.status}"`,
      `"${new Date(r.data_criacao).toLocaleDateString('pt-BR')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Solicitacoes_Compras_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({ type: 'success', title: 'Relatório Exportado', message: 'O arquivo CSV foi gerado com sucesso.' });
  };

  const getStatusBadge = (status: PurchaseRequestStatus) => {
    const config = {
      'Aguardando': {
        bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        icon: <Clock className="w-3.5 h-3.5" />,
      },
      'Compra realizada': {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      },
      'Entregue': {
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: <PackageCheck className="w-3.5 h-3.5" />,
      },
      'Cancelada': {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        icon: <Ban className="w-3.5 h-3.5" />,
      },
    };
    const c = config[status] || config['Aguardando'];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg}`}>
        {c.icon}
        {status}
      </span>
    );
  };

  return (
    <div id="request-dashboard" className="space-y-8 animate-in fade-in duration-300">
      
      {/* Cabeçalho do Módulo & Ações Primárias */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
                Solicitações de Compras
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Controle de solicitações simplificado
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão Importar Imagem (Substitui Importar JSON) */}
          <button
            type="button"
            id="btn-import-image-open"
            onClick={() => setIsImageImportModalOpen(true)}
            className="px-3.5 py-2.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/35 text-orange-400 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
            title="Tirar foto ou enviar imagem para extração automática com IA"
          >
            <Camera className="w-4 h-4 text-orange-400" />
            <span>Importar Imagem</span>
            <Sparkles className="w-3.5 h-3.5 text-orange-300 animate-pulse" />
          </button>
          
          <button
            type="button"
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exportar dados para planilha CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Exportar</span> CSV
          </button>

          <button
            type="button"
            id="btn-open-new-request"
            onClick={() => {
              setEditingRequest(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Solicitação</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            <Layers className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-100 font-mono">
            {metrics.totalCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">Registros na base</span>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-orange-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Aguardando</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400 font-mono">
            {metrics.aguardandoCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">Em cotação / aprovação</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Comprado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {metrics.compraRealizadaCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">Pedido emitido</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Entregue</span>
            <PackageCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {metrics.entregueCount}
          </div>
          <span className="text-[11px] text-zinc-500 mt-0.5 block">Concluído</span>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-requests-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número, requerente ou observações..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950 transition-all"
            />
          </div>

          {/* Filtro Status */}
          <div>
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950"
            >
              <option value="ALL">Todos os Status</option>
              <option value="Aguardando">Apenas Aguardando</option>
              <option value="Compra realizada">Apenas Compra realizada</option>
              <option value="Entregue">Apenas Entregue</option>
              <option value="Cancelada">Apenas Cancelada</option>
            </select>
          </div>

          {/* Ordenação */}
          <div>
            <select
              id="sort-requests-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950"
            >
              <option value="RECENT">Mais Recentes Primeiro</option>
              <option value="OLDEST">Mais Antigas Primeiro</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
          <span>Mostrando <strong>{filteredRequests.length}</strong> de <strong>{requests.length}</strong> solicitações</span>
          {(searchTerm || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
              className="text-orange-400 hover:text-orange-300 font-semibold cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* TABELA DE SOLICITAÇÕES (Desktop) */}
      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-6">Nº Solicitação</th>
                <th className="py-3.5 px-4">Requerente</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-zinc-800/40 transition-colors group">
                  {/* Número da Solicitação */}
                  <td className="py-4 px-6">
                    <div className="font-bold text-zinc-100 font-mono text-sm flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-orange-400" />
                      {req.numero_solicitacao}
                    </div>
                  </td>
                  
                  {/* Requerente & Solicitante Real */}
                  <td className="py-4 px-4">
                    {req.requerente && (
                      <div className="font-semibold text-emerald-400">
                        {req.requerente}
                      </div>
                    )}
                    <div className="text-[10px] text-zinc-500 mt-1">
                      {new Date(req.data_criacao).toLocaleDateString('pt-BR')}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <div>{getStatusBadge(req.status)}</div>
                  </td>
                  
                  {/* Ações */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        id={`btn-view-request-${req.id}`}
                        onClick={() => setSelectedDetailRequest(req)}
                        className="p-1.5 text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Ver Detalhes e Histórico"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        id={`btn-edit-request-${req.id}`}
                        onClick={() => {
                          setEditingRequest(req);
                          setIsCreateModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar Solicitação"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {currentUser?.role === 'ADMIN' && (
                        <button
                          type="button"
                          id={`btn-delete-request-${req.id}`}
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir a solicitação ${req.numero_solicitacao}?`)) {
                              deleteRequest(req.id);
                            }
                          }}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Excluir (Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-500 font-medium">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CARDS RESPONSIVOS (Mobile / Tablet) */}
      <div className="md:hidden space-y-3">
        {filteredRequests.map((req) => (
          <div
            key={req.id}
            onClick={() => setSelectedDetailRequest(req)}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 shadow-xs space-y-3 active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-100 font-mono text-sm flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-orange-400" />
                  {req.numero_solicitacao}
                </span>
              </div>
              {getStatusBadge(req.status)}
            </div>
            
            <div>
              {req.requerente && (
                <div className="text-[11px] text-zinc-400">
                  Req: <span className="text-zinc-200 font-medium">{req.requerente}</span>
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between mt-1">
              <span className="text-[10px] text-zinc-500">
                Criada em {new Date(req.data_criacao).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        ))}
        {filteredRequests.length === 0 && (
          <div className="p-8 text-center border border-zinc-800 border-dashed rounded-2xl bg-zinc-900 text-zinc-500 text-sm font-medium">
            Nenhum registro encontrado
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {(isCreateModalOpen || editingRequest) && (
        <RequestFormModal
          isOpen={isCreateModalOpen}
          initialData={editingRequest}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingRequest(null);
          }}
        />
      )}

      {/* MODAL DE IMPORTAÇÃO DE IMAGEM */}
      <ImportImageModal
        isOpen={isImageImportModalOpen}
        onClose={() => setIsImageImportModalOpen(false)}
        onApplyData={(data, b64) => {
          setIsImageImportModalOpen(false);
          handleApplyExtractedFromImage(data, b64, false);
        }}
      />

      {/* MODAL DE DETALHES & AUDITORIA */}
      {selectedDetailRequest && (
        <RequestDetailModal
          request={selectedDetailRequest}
          isOpen={!!selectedDetailRequest}
          onClose={() => setSelectedDetailRequest(null)}
          onEdit={(req) => {
            setSelectedDetailRequest(null);
            setEditingRequest(req);
            setIsCreateModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
