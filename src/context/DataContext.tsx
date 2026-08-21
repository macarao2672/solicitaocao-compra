import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PurchaseRequest, PurchaseRequestStatus, RequestItem, CatalogItem, Attachment, AuditLog, User, ToastNotification, UserRole, SystemSettings } from '../types';
import { storage } from '../utils/storage';
import { generateInitialsAvatar, generateGradientCover } from '../utils/avatar';
import { useAuth } from './AuthContext';
import { firestoreService } from '../services/firestoreService';
import { parseRequestsJson, ParsedJsonRequest } from '../utils/jsonParser';

export interface CreateRequestInput {
  numero_solicitacao?: string;
  requerente?: string;
  solicitante_nome?: string;
  local_entrega?: string;
  data_limite?: string;
  para_onde_pedido?: string;
  ordem_compra?: string;
  status?: PurchaseRequestStatus;
  prioridade?: PurchaseRequest['prioridade'];
  centro_custo?: string;
  justificativa?: string;
  itens: Array<Omit<RequestItem, 'id'> & { id?: string }>;
  anexos?: Attachment[];
  observacoes?: string;
  data_criacao?: string;
}

interface DataContextType {
  requests: PurchaseRequest[];
  users: User[];
  catalogItems: CatalogItem[];
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
  createRequest: (input: CreateRequestInput) => PurchaseRequest | null;
  importRequestsFromJson: (rawJson: string | any) => Promise<{
    success: boolean;
    count: number;
    requests: PurchaseRequest[];
    error?: string;
  }>;
  updateRequestStatus: (
    requestId: string,
    newStatus: PurchaseRequestStatus,
    justification?: string
  ) => boolean;
  updateRequest: (
    requestId: string,
    input: Partial<CreateRequestInput> & { motivoEdicao?: string }
  ) => boolean;
  deleteRequest: (requestId: string) => boolean;
  // Catálogo de Itens
  saveCatalogItem: (item: Omit<CatalogItem, 'id'> & { id?: string }) => CatalogItem;
  updateCatalogItem: (itemId: string, updates: Partial<CatalogItem>) => boolean;
  deleteCatalogItem: (itemId: string) => boolean;
  findCatalogItemByCode: (code: string) => CatalogItem | undefined;
  // Métodos Admin
  adminToggleBlockUser: (userId: string) => { success: boolean; message: string };
  adminResetPassword: (userId: string, tempPassword?: string) => { success: boolean; message: string; tempPassword?: string };
  adminCreateUser: (userData: {
    username: string;
    name: string;
    password?: string;
    role: UserRole;
    avatar_url?: string;
  }) => { success: boolean; message: string };
  adminDeleteUser: (userId: string) => { success: boolean; message: string };
  refreshData: () => void;
  resetDatabase: () => void;
  // Temas globais
  systemSettings: SystemSettings;
  updateGlobalTheme: (theme: SystemSettings['activeTheme']) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>(() => storage.getRequests());
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(() => storage.getCatalogItems());
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({ activeTheme: 'default' });

  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadData = useCallback(() => {
    setRequests(storage.getRequests());
    setUsers(storage.getUsers());
    setCatalogItems(storage.getCatalogItems());
  }, []);

  // Inscrição em tempo real no Firestore para Solicitações, Usuários e Catálogo
  useEffect(() => {
    loadData();

    // Ouvir solicitações em tempo real da nuvem
    const unsubReqs = firestoreService.subscribeRequests((cloudRequests) => {
      setRequests(cloudRequests);
      storage.saveRequests(cloudRequests);
    });

    // Ouvir usuários em tempo real da nuvem
    const unsubUsers = firestoreService.subscribeUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        storage.saveUsers(cloudUsers);
      }
    });

    // Ouvir itens do catálogo em tempo real da nuvem
    const unsubCatalog = firestoreService.subscribeCatalogItems((cloudItems) => {
      if (cloudItems) {
        setCatalogItems(cloudItems);
        storage.saveCatalogItems(cloudItems);
      }
    });

    // Ouvir configurações globais do sistema em tempo real da nuvem
    const unsubSettings = firestoreService.subscribeSystemSettings((settings) => {
      if (settings && settings.activeTheme) {
        setSystemSettings(settings);
        // Aplica a classe de tema no <html>
        document.documentElement.className = '';
        if (settings.activeTheme !== 'default') {
          document.documentElement.classList.add(`theme-${settings.activeTheme}`);
        }
      }
    });

    return () => {
      unsubReqs();
      unsubUsers();
      unsubCatalog();
      unsubSettings();
    };
  }, [loadData]);

  // Função para mudar o tema global (admin apenas)
  const updateGlobalTheme = useCallback((theme: SystemSettings['activeTheme']) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      addToast({ type: 'error', title: 'Permissão negada', message: 'Apenas Administradores podem mudar o tema global.' });
      return;
    }
    
    firestoreService.updateSystemSettings({ activeTheme: theme, updated_by: currentUser.username }).catch((err) => {
      console.error('Erro ao atualizar tema no Firestore:', err);
    });
    
    addToast({
      type: 'success',
      title: 'Tema Atualizado',
      message: `Tema global alterado para "${theme}".`
    });
  }, [currentUser, addToast]);

  // Função para cadastrar/atualizar automaticamente itens no Catálogo
  const autoRegisterCatalogItems = useCallback((rawItems: Array<{ codigo?: string; descricao?: string; valor_unitario_estimado?: number; unidade?: string; observacao?: string }>) => {
    if (!rawItems || rawItems.length === 0) return;
    
    rawItems.forEach((it) => {
      const code = it.codigo?.trim();
      const desc = it.descricao?.trim();
      if (code && desc) {
        const saved = storage.upsertCatalogItem({
          codigo: code,
          descricao: desc,
          valor_unitario_estimado: Number(it.valor_unitario_estimado) || 0,
          unidade: it.unidade?.toUpperCase() || 'UN',
          observacao: it.observacao || '',
          criado_por: currentUser?.username || 'Sistema',
        });
        firestoreService.saveCatalogItem(saved).catch((err) => {
          console.error('Erro ao sincronizar item do catálogo no Firestore:', err);
        });
      }
    });

    setCatalogItems(storage.getCatalogItems());
  }, [currentUser]);

  const saveCatalogItem = useCallback((itemData: Omit<CatalogItem, 'id'> & { id?: string }) => {
    const saved = storage.upsertCatalogItem({
      ...itemData,
      criado_por: currentUser?.username || 'Admin',
    });
    setCatalogItems(storage.getCatalogItems());

    firestoreService.saveCatalogItem(saved).catch((err) => {
      console.error('Erro ao salvar item do catálogo no Firestore:', err);
    });

    addToast({
      type: 'success',
      title: 'Item Salvo no Catálogo',
      message: `Item [${saved.codigo}] "${saved.descricao}" cadastrado/atualizado com sucesso.`
    });

    return saved;
  }, [currentUser, addToast]);

  const updateCatalogItem = useCallback((itemId: string, updates: Partial<CatalogItem>) => {
    const all = storage.getCatalogItems();
    const idx = all.findIndex((it) => it.id === itemId);
    if (idx === -1) return false;

    const updated: CatalogItem = {
      ...all[idx],
      ...updates,
      atualizado_em: new Date().toISOString(),
    };
    all[idx] = updated;
    storage.saveCatalogItems(all);
    setCatalogItems(all);

    firestoreService.updateCatalogItem(itemId, updates).catch((err) => {
      console.error('Erro ao atualizar item do catálogo no Firestore:', err);
    });

    addToast({
      type: 'success',
      title: 'Item Atualizado',
      message: `Item [${updated.codigo}] atualizado com sucesso.`
    });

    return true;
  }, [addToast]);

  const deleteCatalogItem = useCallback((itemId: string) => {
    const target = storage.getCatalogItems().find((it) => it.id === itemId);
    const ok = storage.deleteCatalogItem(itemId);
    if (ok) {
      setCatalogItems(storage.getCatalogItems());
      firestoreService.deleteCatalogItem(itemId).catch((err) => {
        console.error('Erro ao deletar item do catálogo no Firestore:', err);
      });
      addToast({
        type: 'info',
        title: 'Item Removido',
        message: `Item ${target?.codigo || ''} removido do catálogo de itens.`
      });
      return true;
    }
    return false;
  }, [addToast]);

  const findCatalogItemByCode = useCallback((code: string): CatalogItem | undefined => {
    return storage.findCatalogItemByCode(code);
  }, []);

  const createRequest = (input: CreateRequestInput): PurchaseRequest | null => {
    if (!currentUser) {
      addToast({ type: 'error', title: 'Erro de autenticação', message: 'Você precisa estar logado para criar uma solicitação.' });
      return null;
    }

    if (!input.itens || input.itens.length === 0) {
      addToast({ type: 'error', title: 'Itens obrigatórios', message: 'Adicione pelo menos um item à solicitação.' });
      return null;
    }

    const valor_total = input.itens.reduce((acc, item) => {
      const q = Number(item.quantidade) || 0;
      const v = Number(item.valor_unitario_estimado) || 0;
      return acc + (q * v);
    }, 0);

    const now = input.data_criacao || new Date().toISOString();
    const numero_solicitacao = input.numero_solicitacao?.trim() || storage.generateNextRequestNumber();

    const formattedItems: RequestItem[] = input.itens.map((item, idx) => ({
      ...item,
      id: item.id || `item_${Date.now()}_${idx}`,
      quantidade: Number(item.quantidade) || 1,
      valor_unitario_estimado: Number(item.valor_unitario_estimado) || 0,
      unidade: item.unidade?.toUpperCase() || 'UN',
      codigo: item.codigo || `ITEM-${String(idx + 1).padStart(3, '0')}`,
    }));

    const initialAudit: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      data_hora: now,
      usuario_id: currentUser.id,
      usuario_nome: currentUser.name,
      usuario_username: currentUser.username,
      acao: 'Criação de Solicitação',
      detalhes: `Solicitação criada com ${formattedItems.length} item(ns). Valor total estimado: R$ ${valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      status_novo: input.status || 'Aguardando',
    };

    let finalOC = '';
    if (input.ordem_compra) {
      const raw = input.ordem_compra.trim();
      const rawDigits = raw.replace(/\D/g, '');
      finalOC = rawDigits ? `OC-${rawDigits}` : raw;
    } else {
      finalOC = storage.generateDefaultOrderCode();
    }

    const newRequest: PurchaseRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      numero_solicitacao,
      requerente: input.requerente?.trim() || '',
      solicitante_id: currentUser.id,
      solicitante_nome: input.solicitante_nome?.trim() || currentUser.name,
      solicitante_username: currentUser.username,
      local_entrega: input.local_entrega?.trim() || '',
      data_limite: input.data_limite || '',
      para_onde_pedido: input.para_onde_pedido?.trim() || '',
      status: input.status || 'Aguardando',
      prioridade: input.prioridade || 'Média',
      centro_custo: (input.centro_custo || 'Operações & Facilities').trim(),
      justificativa: (input.justificativa || (input.observacoes ? `Obs: ${input.observacoes}` : 'Solicitação registrada no sistema')).trim(),
      itens: formattedItems,
      valor_total,
      anexos: input.anexos || [],
      observacoes: input.observacoes?.trim() || '',
      data_criacao: now,
      data_atualizacao: now,
      historico_auditoria: [initialAudit],
    };

    // Salvar localmente e no Firestore para sincronização com todos os dispositivos
    storage.addRequest(newRequest);
    setRequests((prev) => [newRequest, ...prev.filter((r) => r.id !== newRequest.id)]);

    // Registrar automaticamente novos códigos/itens no Catálogo
    autoRegisterCatalogItems(formattedItems);

    firestoreService.saveRequest(newRequest).catch((err) => {
      console.error('Erro ao salvar solicitação no Firestore:', err);
    });

    addToast({
      type: 'success',
      title: 'Solicitação Criada',
      message: `Solicitação ${numero_solicitacao} registrada com sucesso!`
    });

    return newRequest;
  };

  const importRequestsFromJson = async (rawJson: string | any) => {
    if (!currentUser) {
      addToast({ type: 'error', title: 'Erro de autenticação', message: 'Você precisa estar logado para importar solicitações.' });
      return { success: false, count: 0, requests: [], error: 'Usuário não autenticado.' };
    }

    const parseResult = parseRequestsJson(rawJson);
    if (!parseResult.valid || parseResult.requests.length === 0) {
      const errMsg = parseResult.error || 'Formato JSON inválido.';
      addToast({ type: 'error', title: 'Erro no arquivo JSON', message: errMsg });
      return { success: false, count: 0, requests: [], error: errMsg };
    }

    const createdList: PurchaseRequest[] = [];

    for (let i = 0; i < parseResult.requests.length; i++) {
      const p = parseResult.requests[i];
      const created = createRequest({
        numero_solicitacao: p.numero_solicitacao,
        ordem_compra: p.ordem_compra,
        status: p.status,
        prioridade: p.prioridade,
        centro_custo: p.centro_custo,
        justificativa: p.justificativa,
        observacoes: p.observacoes,
        itens: p.itens.map((it) => ({
          codigo: it.codigo,
          descricao: it.descricao,
          quantidade: it.quantidade,
          unidade: it.unidade,
          valor_unitario_estimado: it.valor_unitario_estimado || 0,
          observacao: it.observacao,
        })),
        data_criacao: p.data_hora || p.data_criacao,
      });

      if (created) {
        createdList.push(created);
      }
    }

    if (createdList.length > 0) {
      addToast({
        type: 'success',
        title: 'Importação Concluída!',
        message: `${createdList.length} solicitação(ões) gerada(s) automaticamente com sucesso.`
      });
      return { success: true, count: createdList.length, requests: createdList };
    }

    return { success: false, count: 0, requests: [], error: 'Nenhuma solicitação pôde ser criada.' };
  };

  const updateRequestStatus = (
    requestId: string,
    newStatus: PurchaseRequestStatus,
    justification?: string
  ): boolean => {
    if (!currentUser) return false;
    const current = requests.find((r) => r.id === requestId);
    if (!current) return false;

    if (current.status === newStatus) {
      addToast({ type: 'info', title: 'Sem alteração', message: 'A solicitação já está com este status.' });
      return true;
    }

    const now = new Date().toISOString();
    const auditEntry: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      data_hora: now,
      usuario_id: currentUser.id,
      usuario_nome: currentUser.name,
      usuario_username: currentUser.username,
      acao: 'Atualização de Status',
      detalhes: justification?.trim() 
        ? `Status alterado de "${current.status}" para "${newStatus}". Motivo: ${justification.trim()}`
        : `Status alterado de "${current.status}" para "${newStatus}".`,
      status_anterior: current.status,
      status_novo: newStatus,
    };

    const updates = {
      status: newStatus,
      historico_auditoria: [...current.historico_auditoria, auditEntry],
      data_atualizacao: now,
    };

    const updated = storage.updateRequest(requestId, updates);
    if (updated) {
      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));

      firestoreService.updateRequest(requestId, updates).catch((err) => {
        console.error('Erro ao sincronizar status no Firestore:', err);
      });

      addToast({
        type: 'success',
        title: 'Status Atualizado',
        message: `Solicitação ${current.numero_solicitacao} alterada para "${newStatus}".`
      });
      return true;
    }

    return false;
  };

  const updateRequest = (
    requestId: string,
    input: Partial<CreateRequestInput> & { motivoEdicao?: string }
  ): boolean => {
    if (!currentUser) return false;
    const current = requests.find((r) => r.id === requestId);
    if (!current) return false;

    // Calcular novo valor total se itens forem atualizados
    let valor_total = current.valor_total;
    let formattedItems = current.itens;

    if (input.itens) {
      formattedItems = input.itens.map((item, idx) => ({
        ...item,
        id: (item as RequestItem).id || `item_${Date.now()}_${idx}`,
        quantidade: Number(item.quantidade),
        valor_unitario_estimado: Number(item.valor_unitario_estimado),
        unidade: item.unidade || 'UN',
        codigo: item.codigo || `ITEM-${String(idx + 1).padStart(3, '0')}`,
      }));
      valor_total = formattedItems.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario_estimado), 0);
    }

    let updatedOC = current.ordem_compra;
    if (input.ordem_compra !== undefined) {
      const rawDigits = input.ordem_compra.replace(/\D/g, '');
      updatedOC = rawDigits ? `OC-${rawDigits}` : current.ordem_compra;
    }

    // Gerar detalhamento preciso de cada campo/item alterado para a Auditoria
    const changes: string[] = [];

    // 1. Ordem de Compra
    if (input.ordem_compra !== undefined && updatedOC !== current.ordem_compra) {
      changes.push(`• Ordem de Compra: alterada de "${current.ordem_compra || '(não informada)'}" para "${updatedOC || '(não informada)'}"`);
    }

    // 2. Prioridade
    if (input.prioridade && input.prioridade !== current.prioridade) {
      changes.push(`• Prioridade: alterada de "${current.prioridade}" para "${input.prioridade}"`);
    }

    // 3. Centro de Custo
    if (input.centro_custo !== undefined && input.centro_custo.trim() !== current.centro_custo) {
      changes.push(`• Centro de Custo: alterado de "${current.centro_custo}" para "${input.centro_custo.trim()}"`);
    }

    // 4. Justificativa
    if (input.justificativa !== undefined && input.justificativa.trim() !== current.justificativa) {
      changes.push(`• Justificativa: alterada de "${current.justificativa}" para "${input.justificativa.trim()}"`);
    }

    // 5. Observações
    if (input.observacoes !== undefined && input.observacoes.trim() !== (current.observacoes || '')) {
      const oldObs = current.observacoes?.trim() || '(em branco)';
      const newObs = input.observacoes.trim() || '(em branco)';
      changes.push(`• Observações: alteradas de "${oldObs}" para "${newObs}"`);
    }

    // 6. Valor Total
    if (Math.abs(valor_total - current.valor_total) > 0.005) {
      changes.push(`• Valor Total: recalculado de R$ ${current.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} para R$ ${valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }

    // 7. Detalhamento de Itens
    if (input.itens) {
      const oldItemsMap = new Map<string, RequestItem>();
      current.itens.forEach((it) => {
        if (it.id) oldItemsMap.set(it.id, it);
        if (it.codigo) oldItemsMap.set(it.codigo, it);
      });

      const newItemsMap = new Map<string, RequestItem>();
      formattedItems.forEach((it) => {
        if (it.id) newItemsMap.set(it.id, it);
        if (it.codigo) newItemsMap.set(it.codigo, it);
      });

      // Itens Adicionados
      formattedItems.forEach((newItem) => {
        const found = current.itens.find((old) => (newItem.id && old.id === newItem.id) || (newItem.codigo && old.codigo === newItem.codigo));
        if (!found) {
          changes.push(`• Item adicionado: "${newItem.descricao}" (${newItem.codigo}) - Qtd: ${newItem.quantidade} ${newItem.unidade}, Vlr Unit: R$ ${newItem.valor_unitario_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }
      });

      // Itens Removidos
      current.itens.forEach((oldItem) => {
        const found = formattedItems.find((n) => (oldItem.id && n.id === oldItem.id) || (oldItem.codigo && n.codigo === oldItem.codigo));
        if (!found) {
          changes.push(`• Item removido: "${oldItem.descricao}" (${oldItem.codigo})`);
        }
      });

      // Itens Modificados
      formattedItems.forEach((newItem) => {
        const oldItem = current.itens.find((old) => (newItem.id && old.id === newItem.id) || (newItem.codigo && old.codigo === newItem.codigo));
        if (oldItem) {
          const itemDiffs: string[] = [];
          if (oldItem.descricao !== newItem.descricao) {
            itemDiffs.push(`descrição de "${oldItem.descricao}" para "${newItem.descricao}"`);
          }
          if (oldItem.quantidade !== newItem.quantidade) {
            itemDiffs.push(`quantidade de ${oldItem.quantidade} para ${newItem.quantidade}`);
          }
          if (oldItem.unidade !== newItem.unidade) {
            itemDiffs.push(`unidade de "${oldItem.unidade}" para "${newItem.unidade}"`);
          }
          if (Math.abs(oldItem.valor_unitario_estimado - newItem.valor_unitario_estimado) > 0.005) {
            itemDiffs.push(`valor unitário de R$ ${oldItem.valor_unitario_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para R$ ${newItem.valor_unitario_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
          }
          if ((oldItem.observacao || '') !== (newItem.observacao || '')) {
            itemDiffs.push(`observação de "${oldItem.observacao || '(vazio)'}" para "${newItem.observacao || '(vazio)'}"`);
          }
          if (itemDiffs.length > 0) {
            changes.push(`• Item "${newItem.descricao}" [${newItem.codigo}]: alterado (${itemDiffs.join('; ')})`);
          }
        }
      });
    }

    // 8. Anexos
    if (input.anexos) {
      const oldAnexoNames = (current.anexos || []).map((a) => a.nome);
      const newAnexoNames = input.anexos.map((a) => a.nome);
      const addedAnexos = newAnexoNames.filter((name) => !oldAnexoNames.includes(name));
      const removedAnexos = oldAnexoNames.filter((name) => !newAnexoNames.includes(name));
      if (addedAnexos.length > 0) {
        changes.push(`• Anexo(s) adicionado(s): ${addedAnexos.join(', ')}`);
      }
      if (removedAnexos.length > 0) {
        changes.push(`• Anexo(s) removido(s): ${removedAnexos.join(', ')}`);
      }
    }

    // 9. Motivo informado
    if (input.motivoEdicao?.trim() && input.motivoEdicao.trim() !== 'Atualização de campos da solicitação.') {
      changes.push(`• Motivo informado: "${input.motivoEdicao.trim()}"`);
    }

    let finalDetalhes = '';
    if (changes.length > 0) {
      finalDetalhes = `Alterações registradas:\n${changes.join('\n')}`;
    } else {
      finalDetalhes = input.motivoEdicao?.trim() 
        ? `Solicitação revisada sem alteração de valores. Motivo: ${input.motivoEdicao.trim()}`
        : `Solicitação revisada e salva sem alteração de campos.`;
    }

    const now = new Date().toISOString();
    const auditEntry: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      data_hora: now,
      usuario_id: currentUser.id,
      usuario_nome: currentUser.name,
      usuario_username: currentUser.username,
      acao: 'Edição de Dados',
      detalhes: finalDetalhes,
    };

    const updates = {
      numero_solicitacao: input.numero_solicitacao !== undefined ? input.numero_solicitacao.trim() : current.numero_solicitacao,
      requerente: input.requerente !== undefined ? input.requerente.trim() : current.requerente,
      solicitante_nome: input.solicitante_nome !== undefined ? input.solicitante_nome.trim() : current.solicitante_nome,
      local_entrega: input.local_entrega !== undefined ? input.local_entrega.trim() : current.local_entrega,
      data_limite: input.data_limite !== undefined ? input.data_limite : current.data_limite,
      para_onde_pedido: input.para_onde_pedido !== undefined ? input.para_onde_pedido.trim() : current.para_onde_pedido,
      ordem_compra: updatedOC,
      prioridade: input.prioridade || current.prioridade,
      centro_custo: input.centro_custo !== undefined ? input.centro_custo.trim() : current.centro_custo,
      justificativa: input.justificativa !== undefined ? input.justificativa.trim() : current.justificativa,
      observacoes: input.observacoes !== undefined ? input.observacoes.trim() : current.observacoes,
      itens: formattedItems,
      valor_total,
      anexos: input.anexos || current.anexos,
      historico_auditoria: [...current.historico_auditoria, auditEntry],
      data_atualizacao: now,
    };

    const updated = storage.updateRequest(requestId, updates);

    if (updated) {
      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));

      // Atualizar catálogo se itens foram editados
      if (input.itens) {
        autoRegisterCatalogItems(formattedItems);
      }

      firestoreService.updateRequest(requestId, updates).catch((err) => {
        console.error('Erro ao salvar atualização no Firestore:', err);
      });

      addToast({
        type: 'success',
        title: 'Solicitação Atualizada',
        message: `Alterações salvas na solicitação ${current.numero_solicitacao}.`
      });
      return true;
    }

    return false;
  };

  const deleteRequest = (requestId: string): boolean => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      addToast({ type: 'error', title: 'Permissão negada', message: 'Apenas Administradores podem excluir solicitações.' });
      return false;
    }

    const target = requests.find((r) => r.id === requestId);
    const success = storage.deleteRequest(requestId);
    if (success) {
      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      firestoreService.deleteRequest(requestId).catch((err) => {
        console.error('Erro ao excluir solicitação no Firestore:', err);
      });

      addToast({
        type: 'info',
        title: 'Solicitação Removida',
        message: `A solicitação ${target?.numero_solicitacao || ''} foi excluída permanentemente.`
      });
      return true;
    }
    return false;
  };

  // Funções Administrativas
  const adminToggleBlockUser = (userId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, message: 'Ação restrita a Administradores.' };
    }

    if (userId === currentUser.id) {
      return { success: false, message: 'Você não pode bloquear a sua própria conta de Administrador.' };
    }

    const targetUser = storage.getUserById(userId);
    if (!targetUser) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const newBlockedState = !targetUser.is_blocked;
    storage.updateUser(userId, { is_blocked: newBlockedState });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_blocked: newBlockedState } : u)));

    firestoreService.updateUser(userId, { is_blocked: newBlockedState }).catch((err) => {
      console.error('Erro ao atualizar bloqueio no Firestore:', err);
    });

    const statusMsg = newBlockedState ? 'bloqueado' : 'desbloqueado';
    addToast({
      type: newBlockedState ? 'warning' : 'success',
      title: 'Status do Usuário Atualizado',
      message: `Usuário "${targetUser.name}" foi ${statusMsg} com sucesso.`
    });

    return { success: true, message: `Usuário ${statusMsg} com sucesso.` };
  };

  const adminResetPassword = (userId: string, tempPassword?: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, message: 'Ação restrita a Administradores.' };
    }

    const targetUser = storage.getUserById(userId);
    if (!targetUser) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const generatedPassword = tempPassword?.trim() || `Reset@${Math.floor(1000 + Math.random() * 9000)}`;
    
    storage.updateUser(userId, {
      password: generatedPassword,
      must_change_password: true,
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: generatedPassword, must_change_password: true } : u))
    );

    firestoreService.updateUser(userId, {
      password: generatedPassword,
      must_change_password: true,
    }).catch((err) => {
      console.error('Erro ao resetar senha no Firestore:', err);
    });

    addToast({
      type: 'info',
      title: 'Senha Resetada',
      message: `Senha provisória gerada para "${targetUser.name}". Flag de troca obrigatória ativada.`
    });

    return { 
      success: true, 
      message: `Senha resetada com sucesso para: ${generatedPassword}`,
      tempPassword: generatedPassword
    };
  };

  const adminCreateUser = (userData: {
    username: string;
    name: string;
    password?: string;
    role: UserRole;
    avatar_url?: string;
  }) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, message: 'Ação restrita a Administradores.' };
    }

    const cleanUsername = userData.username.trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, message: 'O nome de usuário deve ter no mínimo 3 caracteres.' };
    }

    const cleanName = userData.name.trim();
    if (!cleanName) {
      return { success: false, message: 'O nome de exibição é obrigatório.' };
    }

    const defaultPassword = userData.password?.trim() || 'Trocar@123';

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      name: cleanName,
      password: defaultPassword,
      role: userData.role,
      avatar_url: userData.avatar_url?.trim() || generateInitialsAvatar(cleanName, 'ea580c'),
      cover_url: generateGradientCover('#18181b', '#27272a'),
      is_blocked: false,
      must_change_password: true,
      created_at: new Date().toISOString(),
    };

    const added = storage.addUser(newUser);
    if (!added) {
      return { success: false, message: `Já existe um usuário cadastrado com o nome de usuário "${cleanUsername}".` };
    }

    setUsers((prev) => [newUser, ...prev]);

    firestoreService.saveUser(newUser).catch((err) => {
      console.error('Erro ao salvar usuário no Firestore:', err);
    });

    addToast({
      type: 'success',
      title: 'Usuário Criado',
      message: `Usuário "${cleanName}" cadastrado com senha inicial: ${defaultPassword}`
    });

    return { success: true, message: `Usuário cadastrado com sucesso! Senha provisória: ${defaultPassword}` };
  };

  const adminDeleteUser = (userId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, message: 'Ação restrita a Administradores.' };
    }

    if (userId === currentUser.id) {
      return { success: false, message: 'Você não pode excluir sua própria conta logada.' };
    }

    const allUsers = storage.getUsers().filter((u) => u.id !== userId);
    storage.saveUsers(allUsers);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    firestoreService.deleteUser(userId).catch((err) => {
      console.error('Erro ao deletar usuário no Firestore:', err);
    });

    addToast({
      type: 'info',
      title: 'Usuário Excluído',
      message: 'Usuário removido da base de dados.'
    });

    return { success: true, message: 'Usuário excluído com sucesso.' };
  };

  const resetDatabase = () => {
    storage.resetToDefaults();
    loadData();
    logout();
    addToast({
      type: 'info',
      title: 'Base Restaurada',
      message: 'A base de dados foi restaurada para as configurações e dados de seed originais.'
    });
  };

  return (
    <DataContext.Provider
      value={{
        requests,
        users,
        catalogItems,
        toasts,
        addToast,
        removeToast,
        createRequest,
        importRequestsFromJson,
        updateRequestStatus,
        updateRequest,
        deleteRequest,
        saveCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        findCatalogItemByCode,
        adminToggleBlockUser,
        adminResetPassword,
        adminCreateUser,
        adminDeleteUser,
        refreshData: loadData,
        resetDatabase,
        systemSettings,
        updateGlobalTheme,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};
