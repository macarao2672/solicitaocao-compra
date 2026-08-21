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
  Hash, 
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
          
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Status Atual:</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[request.status].bg}`}>
                {statusConfig[request.status].icon}
                {request.status}
              </span>
            </div>
            
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'USER') && (
              <button
                type="button"
                onClick={() => setIsChangingStatus(!isChangingStatus)}
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors print:hidden cursor-pointer"
              >
                {isChangingStatus ? 'Cancelar Alteração' : 'Alterar Status'}
              </button>
            )}
          </div>

          {/* Área de Alteração de Status (Visível apenas se clicado) */}
          {isChangingStatus && (
            <form onSubmit={handleUpdateStatusSubmit} className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 print:hidden">
              <h4 className="text-sm font-bold text-orange-400">Atualizar Status da Solicitação</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Novo Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as PurchaseRequestStatus)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Aguardando">Aguardando</option>
                    <option value="Compra realizada">Compra realizada</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Justificativa / Observação (Opcional)</label>
                  <input
                    type="text"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Ex: Produto recebido pelo almoxarifado"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Confirmar Alteração
                </button>
              </div>
            </form>
          )}

          {/* Painel de Informações */}
          <div className="grid grid-cols-1 gap-4">
            
            {/* Bloco 1: Dados Gerais */}
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850 pb-2">
                <FileText className="w-4 h-4" />
                Dados Principais
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-[11px] font-bold text-zinc-500 uppercase mb-0.5">Requerente</span>
                  <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    {request.requerente || '—'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Bloco Observações */}
            {request.observacoes && (
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">
                  Observações Gerais
                </h3>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                  {request.observacoes}
                </p>
              </div>
            )}
          </div>

          {/* Anexos */}
          {request.anexos && request.anexos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                Anexos ({request.anexos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {request.anexos.map((att) => (
                  <div key={att.id} className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {att.tipo.startsWith('image/') ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-black">
                          <img src={att.data_url} alt={att.nome} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{att.nome}</p>
                        <p className="text-[10px] text-zinc-500">{new Date(att.data_upload).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a
                      href={att.data_url}
                      download={att.nome}
                      className="p-2 text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Baixar Arquivo"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Histórico de Auditoria */}
          {request.historico_auditoria && request.historico_auditoria.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-zinc-800/80">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-orange-400" />
                Histórico e Auditoria
              </h3>
              <div className="space-y-3">
                {request.historico_auditoria.map((log) => (
                  <div key={log.id} className="text-xs flex gap-3 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                    <div className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-orange-500/50" />
                    <div>
                      <p className="font-semibold text-zinc-200">
                        {log.usuario_nome} <span className="text-zinc-500 font-normal">({log.usuario_username})</span>
                      </p>
                      <p className="text-zinc-400 mt-0.5">{log.acao}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {new Date(log.data_hora).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
