import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PurchaseRequest, PurchaseRequestStatus } from '../../types';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  PackageCheck, 
  Ban, 
  Printer, 
  FileText, 
  User, 
  History, 
  Download, 
  Calendar,
  Truck,
  MapPin,
  Hash,
  Package,
  Layers,
  Edit3
} from 'lucide-react';

interface RequestDetailModalProps {
  request: PurchaseRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (req: PurchaseRequest) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { currentUser } = useAuth();
  const { updateRequestStatus, addToast } = useData();

  const [newStatus, setNewStatus] = useState<PurchaseRequestStatus>('Aguardando');
  const [statusReason, setStatusReason] = useState('');
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  if (!isOpen || !request) return null;

  const statusConfig = {
    'Aguardando': {
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      icon: <Clock className="w-4 h-4 text-orange-400" />,
    },
    'Compra realizada': {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
    'Entregue': {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: <PackageCheck className="w-4 h-4 text-blue-400" />,
    },
    'Cancelada': {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: <Ban className="w-4 h-4 text-rose-400" />,
    },
  };

  const priorityConfig = {
    'Baixa': 'bg-zinc-800 text-zinc-300 border-zinc-700',
    'Média': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    'Alta': 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-semibold',
    'Urgente': 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold animate-pulse',
  };

  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatus === request.status) {
      addToast({ type: 'info', title: 'Mesmo Status', message: 'Selecione um status diferente para atualizar.' });
      return;
    }

    const success = updateRequestStatus(request.id, newStatus, statusReason);
    if (success) {
      setIsChangingStatus(false);
      setStatusReason('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="modal-request-detail" 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-zinc-950 print:static"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none text-zinc-100">
        {/* Header do Modal */}
        <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 text-white flex items-center justify-between shrink-0 print:bg-zinc-950 print:text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-mono font-bold shadow-md shadow-orange-500/20">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono tracking-tight text-zinc-100">
                  Solicitação {request.numero_solicitacao}
                </h2>
              </div>
              <p className="text-xs text-zinc-400">
                Criada em {new Date(request.data_criacao).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(request)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                <span>Editar</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Imprimir Relatório"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-100">
          {/* Status & Prioridade Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Status Atual:</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[request.status].bg}`}>
                {statusConfig[request.status].icon}
                {request.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Prioridade:</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${priorityConfig[request.prioridade]}`}>
                {request.prioridade}
              </span>
            </div>

            {request.data_limite && (
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-zinc-400">Data Limite:</span>
                <span className="font-bold text-zinc-200">{request.data_limite}</span>
              </div>
            )}
          </div>

          {/* Dados Principais da Solicitação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Requerente */}
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Requerente
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold text-zinc-200 truncate">
                  {request.requerente || '—'}
                </span>
              </div>
            </div>

            {/* Solicitante Real */}
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Solicitante (Real)
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                <User className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 truncate">
                  {request.solicitante_nome}
                </span>
              </div>
            </div>

            {/* Para Onde Foi Pedido */}
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Para Onde Foi Pedido
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                <Truck className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-xs font-bold text-orange-300 truncate">
                  {request.para_onde_pedido || '—'}
                </span>
              </div>
            </div>

            {/* Local de Entrega */}
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Local de Entrega
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-xs font-semibold text-zinc-200 truncate">
                  {request.local_entrega || 'GNT - MAURO'}
                </span>
              </div>
            </div>
          </div>

          {/* Centro de Custo */}
          <div className="p-3 bg-zinc-950/40 border border-zinc-850 rounded-xl flex items-center justify-between text-xs">
            <span className="text-zinc-400">Centro de Resultado / Custo:</span>
            <span className="font-semibold text-zinc-200">{request.centro_custo}</span>
          </div>

          {/* ITENS ESTRUTURADOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-400" />
                Itens da Solicitação ({request.itens.length})
              </h3>
              <span className="text-xs text-zinc-400">Valores em Reais (BRL)</span>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-4">Código</th>
                    <th className="py-2.5 px-4">Descrição</th>
                    <th className="py-2.5 px-3">Destino do Item</th>
                    <th className="py-2.5 px-3 text-center">Qtd.</th>
                    <th className="py-2.5 px-3 text-center">Unid.</th>
                    <th className="py-2.5 px-4 text-right">Vlr. Unitário</th>
                    <th className="py-2.5 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {request.itens.map((item, idx) => {
                    const subtotal = item.quantidade * item.valor_unitario_estimado;
                    return (
                      <tr key={item.id || idx} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-orange-400">
                          {item.codigo}
                          {item.cod_fabricante && (
                            <span className="block text-[10px] text-zinc-500 font-normal">
                              Fab: {item.cod_fabricante}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-zinc-100">{item.descricao}</div>
                          {item.observacao && (
                            <div className="text-[11px] text-zinc-400 italic mt-0.5">{item.observacao}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-400">
                          {item.destino || '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-zinc-200">{item.quantidade}</td>
                        <td className="py-3 px-3 text-center text-zinc-400 font-mono font-bold">{item.unidade}</td>
                        <td className="py-3 px-4 text-right font-mono text-zinc-300">
                          R$ {item.valor_unitario_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-zinc-100">
                          R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-950 border-t border-zinc-800 text-white font-bold">
                    <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-[11px] text-zinc-400">
                      Total Estimado da Solicitação:
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-right font-mono text-emerald-400 text-sm">
                      R$ {request.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observações Gerais */}
          {request.observacoes && (
            <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 space-y-1">
              <span className="font-bold text-zinc-200 block text-[11px] uppercase tracking-wider">
                Observações do Documento:
              </span>
              <p className="font-mono text-zinc-400 text-[11px] leading-relaxed">
                {request.observacoes}
              </p>
            </div>
          )}

          {/* Anexos */}
          {request.anexos && request.anexos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Anexos & Imagens ({request.anexos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {request.anexos.map((anexo) => (
                  <a
                    key={anexo.id}
                    href={anexo.data_url}
                    download={anexo.nome}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-orange-500/50 rounded-xl flex items-center justify-between gap-3 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-orange-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-medium text-zinc-200 group-hover:text-orange-400 truncate">
                          {anexo.nome}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          Enviado em {new Date(anexo.data_upload).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-zinc-400 group-hover:text-orange-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AUDITORIA E HISTÓRICO */}
          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                  Histórico de Auditoria ({request.historico_auditoria?.length || 0} registros)
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsChangingStatus(!isChangingStatus)}
                className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-semibold transition-colors cursor-pointer print:hidden"
              >
                {isChangingStatus ? 'Cancelar Alteração' : 'Alterar Status'}
              </button>
            </div>

            {/* Painel de Alteração de Status */}
            {isChangingStatus && (
              <form onSubmit={handleUpdateStatusSubmit} className="p-4 bg-zinc-950 border border-orange-500/30 rounded-xl space-y-3 print:hidden">
                <span className="text-xs font-bold text-zinc-200 uppercase block">
                  Atualizar Status da Solicitação
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                      Novo Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as PurchaseRequestStatus)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="Aguardando">Aguardando</option>
                      <option value="Compra realizada">Compra realizada</option>
                      <option value="Entregue">Entregue</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                      Justificativa / Observação do Status
                    </label>
                    <input
                      type="text"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Ex: Cotação aprovada pela gerência..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-750 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirmar Alteração
                  </button>
                </div>
              </form>
            )}

            {/* Linha do Tempo da Auditoria */}
            <div className="space-y-3">
              {request.historico_auditoria?.map((audit, idx) => (
                <div
                  key={audit.id || idx}
                  className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-bold text-zinc-200">{audit.acao}</span>
                    <span className="font-mono text-[11px]">
                      {new Date(audit.data_hora).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                    <span>Por:</span>
                    <strong className="text-zinc-300">{audit.usuario_nome}</strong>
                    <span className="text-zinc-500">(@{audit.usuario_username})</span>
                  </div>
                  {audit.detalhes && (
                    <p className="text-zinc-300 font-mono text-[11px] whitespace-pre-wrap pt-1 border-t border-zinc-900">
                      {audit.detalhes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between print:hidden">
          <span className="text-xs text-zinc-500 font-mono">
            ID: {request.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
