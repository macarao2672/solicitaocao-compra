import React, { useState } from 'react';
import { useExtractionQueue, ExtractionTask } from '../../context/ExtractionQueueContext';
import { Loader2, FileText, CheckCircle2, AlertCircle, X, ChevronUp, ChevronDown, Check } from 'lucide-react';

export const ExtractionQueueWidget: React.FC = () => {
  const { tasks, removeTask, clearCompleted, applyTaskData } = useExtractionQueue();
  const [isExpanded, setIsExpanded] = useState(true);

  if (tasks.length === 0) return null;

  const pendingCount = tasks.filter(t => t.status === 'queued' || t.status === 'processing').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const errorCount = tasks.filter(t => t.status === 'error').length;

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
      {/* Cabeçalho */}
      <div 
        className="px-4 py-3 bg-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-700/80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {pendingCount > 0 ? (
            <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
          ) : errorCount > 0 ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
          <span className="text-sm font-semibold text-zinc-100">
            {pendingCount > 0 ? `Processando ${pendingCount} arquivo(s)...` : 'Fila concluída'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-zinc-400" />}
        </div>
      </div>

      {/* Corpo (Lista de Tasks) */}
      {isExpanded && (
        <div className="max-h-72 overflow-y-auto p-2 space-y-2 bg-zinc-900/50">
          {tasks.map((task) => (
            <div key={task.id} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-800 flex gap-3 relative">
              <button 
                onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                title="Remover da fila"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                {task.fileBase64.startsWith('data:image') ? (
                  <img src={task.fileBase64} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-5 h-5 text-zinc-500" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <p className="text-xs font-medium text-zinc-200 truncate" title={task.fileName}>{task.fileName}</p>
                
                {task.status === 'queued' && <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">Na fila...</p>}
                
                {task.status === 'processing' && (
                  <p className="text-[10px] text-orange-400 mt-0.5 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Extraindo dados...
                  </p>
                )}
                
                {task.status === 'error' && (
                  <p className="text-[10px] text-red-400 mt-0.5 line-clamp-2 leading-tight" title={task.error}>
                    Falha: {task.error}
                  </p>
                )}
                
                {task.status === 'completed' && (
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Extraído e Adicionado
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {completedCount > 0 && pendingCount === 0 && (
            <button
              onClick={clearCompleted}
              className="w-full mt-2 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Limpar Concluídos
            </button>
          )}
        </div>
      )}
    </div>
  );
};
