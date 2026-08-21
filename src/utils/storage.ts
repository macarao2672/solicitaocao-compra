import { User, PurchaseRequest, CatalogItem } from '../types';
import { generateInitialsAvatar, generateGradientCover } from './avatar';

const STORAGE_KEY_USERS = 'app_compras_users_v2';
const STORAGE_KEY_REQUESTS = 'app_compras_requests_v2';
const STORAGE_KEY_SESSION = 'app_compras_session_v2';
const STORAGE_KEY_CATALOG = 'app_compras_catalog_items_v1';

export const DEFAULT_ADMIN: User = {
  id: 'usr_admin_flavio',
  username: 'Flavio.silva',
  password: 'mlpzaq105vv',
  name: 'Flávio Silva',
  role: 'ADMIN',
  avatar_url: generateInitialsAvatar('Flávio Silva', 'ea580c'),
  cover_url: generateGradientCover('#18181b', '#27272a'),
  is_blocked: false,
  must_change_password: false,
  created_at: new Date().toISOString(),
};

const SEED_USERS: User[] = [
  DEFAULT_ADMIN
];

const SEED_REQUESTS: PurchaseRequest[] = [];

export const storage = {
  // Inicialização e Seed
  init(): void {
    // Limpeza de dados fictícios de versões legadas
    const legacyUsersKey = 'app_compras_users_v1';
    const legacyRequestsKey = 'app_compras_requests_v1';
    const legacySessionKey = 'app_compras_session_v1';

    const rawUsers = localStorage.getItem(STORAGE_KEY_USERS);
    if (!rawUsers) {
      // Verificar se há usuários reais cadastrados na versão anterior
      let initialUsers = [DEFAULT_ADMIN];
      const oldRawUsers = localStorage.getItem(legacyUsersKey);
      if (oldRawUsers) {
        try {
          const oldUsers: User[] = JSON.parse(oldRawUsers);
          const customUsers = oldUsers.filter((u) => 
            !['usr_mariana_costa', 'usr_carlos_mendes', 'usr_roberto_alves', 'usr_admin_flavio'].includes(u.id) &&
            !['mariana.costa', 'carlos.mendes', 'roberto.alves'].includes(u.username.toLowerCase())
          );
          initialUsers = [DEFAULT_ADMIN, ...customUsers];
        } catch {
          initialUsers = [DEFAULT_ADMIN];
        }
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(initialUsers));
    } else {
      try {
        const users: User[] = JSON.parse(rawUsers);
        // Filtrar quaisquer resquícios fictícios
        const filteredUsers = users.filter((u) => 
          !['usr_mariana_costa', 'usr_carlos_mendes', 'usr_roberto_alves'].includes(u.id) &&
          !['mariana.costa', 'carlos.mendes', 'roberto.alves'].includes(u.username.toLowerCase())
        );
        const adminExists = filteredUsers.some(
          (u) => u.username.toLowerCase() === DEFAULT_ADMIN.username.toLowerCase()
        );
        if (!adminExists) {
          filteredUsers.unshift(DEFAULT_ADMIN);
        }
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(filteredUsers));
      } catch {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEED_USERS));
      }
    }

    const rawRequests = localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (!rawRequests) {
      // Migrar apenas solicitações reais que não sejam de seed fictício (req_001, req_002, req_003)
      let initialRequests: PurchaseRequest[] = [];
      const oldRawReqs = localStorage.getItem(legacyRequestsKey);
      if (oldRawReqs) {
        try {
          const oldReqs: PurchaseRequest[] = JSON.parse(oldRawReqs);
          initialRequests = oldReqs.filter((r) => !['req_001', 'req_002', 'req_003'].includes(r.id));
        } catch {
          initialRequests = [];
        }
      }
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(initialRequests));
    } else {
      try {
        const reqs: PurchaseRequest[] = JSON.parse(rawRequests);
        const cleanReqs = reqs.filter((r) => !['req_001', 'req_002', 'req_003'].includes(r.id));
        localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(cleanReqs));
      } catch {
        localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify([]));
      }
    }

    // Limpar chaves legadas
    localStorage.removeItem(legacyUsersKey);
    localStorage.removeItem(legacyRequestsKey);
    localStorage.removeItem(legacySessionKey);
  },

  // Usuários
  getUsers(): User[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USERS);
      if (!raw) {
        this.init();
        return SEED_USERS;
      }
      return JSON.parse(raw);
    } catch {
      return SEED_USERS;
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  },

  getUserByUsername(username: string): User | undefined {
    const users = this.getUsers();
    const query = username.trim().toLowerCase();
    return users.find((u) => u.username.toLowerCase() === query || u.name.toLowerCase() === query);
  },

  getUserById(id: string): User | undefined {
    const users = this.getUsers();
    return users.find((u) => u.id === id);
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    this.saveUsers(users);
    
    // Se for o usuário ativo na sessão, atualizar também a sessão
    const currentSession = this.getCurrentSession();
    if (currentSession && currentSession.id === id) {
      this.saveCurrentSession(users[index]);
    }

    return users[index];
  },

  addUser(user: User): boolean {
    const users = this.getUsers();
    if (users.some((u) => u.username.toLowerCase() === user.username.toLowerCase())) {
      return false;
    }
    users.push(user);
    this.saveUsers(users);
    return true;
  },

  // Sessão Atual
  getCurrentSession(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSION);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveCurrentSession(user: User): void {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  },

  clearCurrentSession(): void {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  },

  // Solicitações
  getRequests(): PurchaseRequest[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (!raw) {
        this.init();
        return SEED_REQUESTS;
      }
      return JSON.parse(raw);
    } catch {
      return SEED_REQUESTS;
    }
  },

  saveRequests(requests: PurchaseRequest[]): void {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  },

  addRequest(request: PurchaseRequest): void {
    const requests = this.getRequests();
    requests.unshift(request);
    this.saveRequests(requests);
  },

  updateRequest(id: string, updates: Partial<PurchaseRequest>): PurchaseRequest | null {
    const requests = this.getRequests();
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return null;
    requests[index] = { ...requests[index], ...updates, data_atualizacao: new Date().toISOString() };
    this.saveRequests(requests);
    return requests[index];
  },

  deleteRequest(id: string): boolean {
    const requests = this.getRequests();
    const filtered = requests.filter((r) => r.id !== id);
    if (filtered.length === requests.length) return false;
    this.saveRequests(filtered);
    return true;
  },

  generateNextRequestNumber(): string {
    const requests = this.getRequests();
    const currentYear = new Date().getFullYear();
    const prefix = `SC-${currentYear}-`;
    const yearRequests = requests.filter((r) => r.numero_solicitacao.startsWith(prefix));
    const nextSeq = yearRequests.length + 1;
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  },

  generateDefaultOrderCode(): string {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `OC-${randomNum}`;
  },

  // Catálogo de Itens
  getCatalogItems(): CatalogItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CATALOG);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCatalogItems(items: CatalogItem[]): void {
    localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(items));
  },

  findCatalogItemByCode(code: string): CatalogItem | undefined {
    if (!code) return undefined;
    const cleanCode = code.trim().toLowerCase();
    const items = this.getCatalogItems();
    return items.find((it) => it.codigo.trim().toLowerCase() === cleanCode);
  },

  upsertCatalogItem(item: Omit<CatalogItem, 'id'> & { id?: string }): CatalogItem {
    const items = this.getCatalogItems();
    const cleanCode = item.codigo.trim().toLowerCase();
    const existingIndex = items.findIndex((it) => it.codigo.trim().toLowerCase() === cleanCode);

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated: CatalogItem = {
        ...items[existingIndex],
        descricao: item.descricao.trim(),
        valor_unitario_estimado: Number(item.valor_unitario_estimado) || 0,
        unidade: item.unidade || items[existingIndex].unidade || 'UN',
        categoria: item.categoria ?? items[existingIndex].categoria,
        observacao: item.observacao ?? items[existingIndex].observacao,
        atualizado_em: now,
      };
      items[existingIndex] = updated;
      this.saveCatalogItems(items);
      return updated;
    } else {
      const newItem: CatalogItem = {
        id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        codigo: item.codigo.trim(),
        descricao: item.descricao.trim(),
        valor_unitario_estimado: Number(item.valor_unitario_estimado) || 0,
        unidade: item.unidade || 'UN',
        categoria: item.categoria || 'Geral',
        observacao: item.observacao || '',
        criado_em: now,
        atualizado_em: now,
        criado_por: item.criado_por,
      };
      items.unshift(newItem);
      this.saveCatalogItems(items);
      return newItem;
    }
  },

  deleteCatalogItem(id: string): boolean {
    const items = this.getCatalogItems();
    const filtered = items.filter((it) => it.id !== id);
    if (filtered.length === items.length) return false;
    this.saveCatalogItems(filtered);
    return true;
  },

  // Reset Geral
  resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(SEED_REQUESTS));
    localStorage.removeItem(STORAGE_KEY_CATALOG);
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }
};
