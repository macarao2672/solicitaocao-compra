import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useData } from './DataContext';

export interface ExtractionTask {
  id: string;
  fileBase64: string;
  mimeType: string;
  fileName: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  extractedData?: any;
  error?: string;
}

interface ExtractionQueueContextType {
  tasks: ExtractionTask[];
  addTask: (fileBase64: string, mimeType: string, fileName: string) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
  applyTaskData: (id: string) => void; // Turn completed task into a draft
}

const ExtractionQueueContext = createContext<ExtractionQueueContextType | undefined>(undefined);

export const ExtractionQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<ExtractionTask[]>([]);
  const { createRequest, addToast } = useData();

  const addTask = useCallback((fileBase64: string, mimeType: string, fileName: string) => {
    const newTask: ExtractionTask = {
      id: 'task_' + Date.now() + Math.random().toString(36).substring(2, 9),
      fileBase64,
      mimeType,
      fileName,
      status: 'queued',
    };
    setTasks((prev) => [...prev, newTask]);
    addToast({ type: 'info', title: 'Adicionado à Fila', message: `O arquivo ${fileName} está na fila para processamento.` });
  }, [addToast]);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status !== 'completed'));
  }, []);

  const applyTaskData = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.status !== 'completed' || !task.extractedData) return;

    const extracted = task.extractedData;
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
      justificativa: 'Solicitação registrada a partir de documento em lote',
      itens: [],
      anexos: task.fileBase64 ? [
        {
          id: `att_${Date.now()}`,
          nome: task.fileName || `Doc_${extracted.numero_solicitacao || 'Anexo'}.jpg`,
          tipo: task.mimeType || 'image/jpeg',
          data_url: task.fileBase64,
          data_upload: new Date().toISOString(),
        }
      ] : [],
    };

    createRequest(newReqDraft);
    addToast({ type: 'success', title: 'Rascunho Criado', message: 'Solicitação criada a partir da imagem.' });
    removeTask(id);
  }, [tasks, createRequest, addToast, removeTask]);

  // Worker effect to process queue
  useEffect(() => {
    const pendingTask = tasks.find(t => t.status === 'queued');
    if (!pendingTask) return;

    // We found a task to process
    const processTask = async () => {
      // Mark as processing
      setTasks(prev => prev.map(t => t.id === pendingTask.id ? { ...t, status: 'processing' } : t));

      try {
        const base64Data = pendingTask.fileBase64.split(',')[1] || pendingTask.fileBase64;
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: pendingTask.mimeType
          })
        });

        let result: any = null;
        let rawText = '';

        try {
          const cloned = response.clone ? response.clone() : null;
          try {
            rawText = await response.text();
          } catch (streamErr) {
            if (cloned) {
              rawText = await cloned.text();
            } else {
              throw streamErr;
            }
          }
        } catch (err: any) {
          console.warn('Erro ao ler stream de resposta na fila:', err);
        }

        try {
          result = rawText ? JSON.parse(rawText) : null;
        } catch {
          result = null;
        }

        if (!response.ok) {
          throw new Error(result?.error || (rawText ? `Erro ${response.status}: ${rawText.substring(0, 120)}` : `Erro ${response.status} na API`));
        }

        if (!result?.data) {
          throw new Error(result?.error || 'Nenhum dado retornado pela IA.');
        }

        // Auto-create the request
        const extracted = result.data;
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
          justificativa: 'Solicitação registrada a partir de documento em lote',
          itens: [],
          anexos: pendingTask.fileBase64 ? [
            {
              id: `att_${Date.now()}`,
              nome: pendingTask.fileName || `Doc_${extracted.numero_solicitacao || 'Anexo'}.jpg`,
              tipo: pendingTask.mimeType || 'image/jpeg',
              data_url: pendingTask.fileBase64,
              data_upload: new Date().toISOString(),
            }
          ] : [],
        };

        createRequest(newReqDraft);

        // Success
        setTasks(prev => prev.map(t => t.id === pendingTask.id ? { ...t, status: 'completed', extractedData: result.data } : t));
        addToast({ type: 'success', title: 'Solicitação Criada', message: `O documento ${pendingTask.fileName} foi importado com sucesso.` });
      } catch (err: any) {
        setTasks(prev => prev.map(t => t.id === pendingTask.id ? { ...t, status: 'error', error: err.message } : t));
        addToast({ type: 'error', title: 'Erro de Leitura', message: `Falha ao processar ${pendingTask.fileName}.` });
      }
    };

    processTask();

  }, [tasks, addToast, createRequest]);

  return (
    <ExtractionQueueContext.Provider value={{ tasks, addTask, removeTask, clearCompleted, applyTaskData }}>
      {children}
    </ExtractionQueueContext.Provider>
  );
};

export const useExtractionQueue = () => {
  const context = useContext(ExtractionQueueContext);
  if (context === undefined) {
    throw new Error('useExtractionQueue must be used within an ExtractionQueueProvider');
  }
  return context;
};
