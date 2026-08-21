import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, PurchaseRequest, CatalogItem } from '../types';
import { DEFAULT_ADMIN, storage } from '../utils/storage';

const USERS_COLLECTION = 'users';
const REQUESTS_COLLECTION = 'requests';
const CATALOG_COLLECTION = 'catalog_items';
const SETTINGS_COLLECTION = 'system_settings';

export const firestoreService = {
  // Inicialização e garantia do admin
  async initFirestore(): Promise<void> {
    try {
      const adminDocRef = doc(db, USERS_COLLECTION, DEFAULT_ADMIN.id);
      const adminSnap = await getDoc(adminDocRef);
      if (!adminSnap.exists()) {
        await setDoc(adminDocRef, DEFAULT_ADMIN, { merge: true });
      }

      // Sincronizar quaisquer usuários locais que ainda não estejam na nuvem
      const localUsers = storage.getUsers();
      for (const u of localUsers) {
        const uDoc = doc(db, USERS_COLLECTION, u.id);
        const snap = await getDoc(uDoc);
        if (!snap.exists()) {
          await setDoc(uDoc, u, { merge: true });
        }
      }
    } catch (err) {
      console.error('Erro ao inicializar Firestore:', err);
    }
  },

  // Inscrição em tempo real para Usuários
  subscribeUsers(onUpdate: (users: User[]) => void): Unsubscribe {
    const colRef = collection(db, USERS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as User);
        });

        // Se a coleção estiver vazia, garantir admin padrão
        if (users.length === 0) {
          firestoreService.saveUser(DEFAULT_ADMIN);
          users.push(DEFAULT_ADMIN);
        }

        // Ordenar por data de criação descrescente
        users.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        onUpdate(users);
      },
      (error) => {
        console.error('Erro no listener de usuários:', error);
      }
    );
  },

  // Inscrição em tempo real para Solicitações
  subscribeRequests(onUpdate: (requests: PurchaseRequest[]) => void): Unsubscribe {
    const colRef = collection(db, REQUESTS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const requests: PurchaseRequest[] = [];
        snapshot.forEach((docSnap) => {
          requests.push(docSnap.data() as PurchaseRequest);
        });

        // Ordenar por data de criação mais recente
        requests.sort((a, b) => new Date(b.data_criacao || '').getTime() - new Date(a.data_criacao || '').getTime());
        onUpdate(requests);
      },
      (error) => {
        console.error('Erro no listener de solicitações:', error);
      }
    );
  },

  // Salvar ou criar usuário
  async saveUser(user: User): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(docRef, user, { merge: true });
  },

  // Atualizar dados de usuário
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(docRef, updates, { merge: true });
  },

  // Deletar usuário
  async deleteUser(userId: string): Promise<void> {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(docRef);
  },

  // Salvar ou criar solicitação
  async saveRequest(request: PurchaseRequest): Promise<void> {
    const docRef = doc(db, REQUESTS_COLLECTION, request.id);
    await setDoc(docRef, request, { merge: true });
  },

  // Atualizar dados de solicitação
  async updateRequest(requestId: string, updates: Partial<PurchaseRequest>): Promise<void> {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    await setDoc(
      docRef,
      {
        ...updates,
        data_atualizacao: new Date().toISOString(),
      },
      { merge: true }
    );
  },

  // Deletar solicitação
  async deleteRequest(requestId: string): Promise<void> {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    await deleteDoc(docRef);
  },

  // Inscrição em tempo real para Catálogo de Itens
  subscribeCatalogItems(onUpdate: (items: CatalogItem[]) => void): Unsubscribe {
    const colRef = collection(db, CATALOG_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: CatalogItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as CatalogItem);
        });

        // Ordenar alfabeticamente por código ou descrição
        items.sort((a, b) => a.codigo.localeCompare(b.codigo));
        onUpdate(items);
      },
      (error) => {
        console.error('Erro no listener do catálogo de itens:', error);
      }
    );
  },

  // Salvar ou criar item de catálogo
  async saveCatalogItem(item: CatalogItem): Promise<void> {
    const docRef = doc(db, CATALOG_COLLECTION, item.id);
    await setDoc(docRef, item, { merge: true });
  },

  // Atualizar item do catálogo
  async updateCatalogItem(itemId: string, updates: Partial<CatalogItem>): Promise<void> {
    const docRef = doc(db, CATALOG_COLLECTION, itemId);
    await setDoc(
      docRef,
      {
        ...updates,
        atualizado_em: new Date().toISOString(),
      },
      { merge: true }
    );
  },

  // Deletar item do catálogo
  async deleteCatalogItem(itemId: string): Promise<void> {
    const docRef = doc(db, CATALOG_COLLECTION, itemId);
    await deleteDoc(docRef);
  },

  // Inscrição em tempo real para Configurações do Sistema
  subscribeSystemSettings(onUpdate: (settings: any | null) => void): Unsubscribe {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data());
        } else {
          onUpdate({ activeTheme: 'default' });
        }
      },
      (error) => {
        console.error('Erro no listener de configurações globais:', error);
      }
    );
  },

  // Atualizar configurações globais
  async updateSystemSettings(settings: any): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, 'global');
    await setDoc(docRef, {
      ...settings,
      updated_at: new Date().toISOString()
    }, { merge: true });
  }
};
