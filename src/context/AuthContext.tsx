import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storage, DEFAULT_ADMIN } from '../utils/storage';
import { generateInitialsAvatar, generateGradientCover } from '../utils/avatar';
import { firestoreService } from '../services/firestoreService';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => { success: boolean; message?: string; mustChangePassword?: boolean };
  register: (name: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => void;
  updateProfile: (data: { name: string; avatar_url: string; cover_url: string }) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  completeMustChangePassword: (newPassword: string) => Promise<{ success: boolean; message?: string }>;
  refreshCurrentUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    storage.init();
    firestoreService.initFirestore();

    const session = storage.getCurrentSession();
    if (session) {
      const freshUser = storage.getUserById(session.id);
      if (freshUser && !freshUser.is_blocked) {
        setCurrentUser(freshUser);
        storage.saveCurrentSession(freshUser);
      } else {
        storage.clearCurrentSession();
        setCurrentUser(null);
      }
    }
    setIsLoading(false);

    // Escutar atualizações de usuários em tempo real do Firestore
    const unsub = firestoreService.subscribeUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        storage.saveUsers(cloudUsers);
        
        // Se há um usuário na sessão, sincronizar seus dados mais recentes (ex: alterados em outro dispositivo)
        const currentSession = storage.getCurrentSession();
        if (currentSession) {
          const fresh = cloudUsers.find((u) => u.id === currentSession.id);
          if (fresh) {
            if (fresh.is_blocked) {
              storage.clearCurrentSession();
              setCurrentUser(null);
            } else {
              storage.saveCurrentSession(fresh);
              setCurrentUser(fresh);
            }
          }
        }
      }
    });

    return () => unsub();
  }, []);

  const login = (username: string, password: string) => {
    const user = storage.getUserByUsername(username);

    if (!user) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Senha incorreta. Verifique suas credenciais.' };
    }

    if (user.is_blocked) {
      return { success: false, message: 'Este usuário está bloqueado pelo Administrador. Contate o suporte.' };
    }

    // Se deve alterar a senha, logamos temporariamente ou sinalizamos
    setCurrentUser(user);
    storage.saveCurrentSession(user);

    if (user.must_change_password) {
      return { 
        success: true, 
        mustChangePassword: true, 
        message: 'Você deve redefinir sua senha antes de prosseguir.' 
      };
    }

    return { success: true };
  };

  const register = async (name: string, password: string) => {
    const cleanName = name.trim();
    if (!cleanName) {
      return { success: false, message: 'Por favor, informe seu nome.' };
    }

    if (!password || password.length < 4) {
      return { success: false, message: 'A senha deve ter no mínimo 4 dígitos/caracteres.' };
    }

    let baseUsername = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '');

    if (!baseUsername) {
      baseUsername = 'usuario';
    }

    let finalUsername = baseUsername;
    let counter = 1;
    while (storage.getUserByUsername(finalUsername)) {
      counter++;
      finalUsername = `${baseUsername}${counter}`;
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: finalUsername,
      password: password,
      name: cleanName,
      role: 'USER',
      avatar_url: generateInitialsAvatar(cleanName, 'ea580c'),
      cover_url: generateGradientCover('#18181b', '#27272a'),
      is_blocked: false,
      must_change_password: false,
      created_at: new Date().toISOString(),
    };

    // Salva localmente
    storage.addUser(newUser);
    // Salva no Firestore na nuvem
    try {
      await firestoreService.saveUser(newUser);
    } catch (err) {
      console.error('Erro ao salvar usuário no Firestore:', err);
    }

    // Login imediato do novo usuário
    setCurrentUser(newUser);
    storage.saveCurrentSession(newUser);

    return { success: true, user: newUser };
  };

  const logout = () => {
    storage.clearCurrentSession();
    setCurrentUser(null);
  };

  const updateProfile = async (data: { name: string; avatar_url: string; cover_url: string }): Promise<boolean> => {
    if (!currentUser) return false;

    const updates = {
      name: data.name.trim(),
      avatar_url: data.avatar_url.trim(),
      cover_url: data.cover_url.trim(),
    };

    const updated = storage.updateUser(currentUser.id, updates);
    if (updated) {
      setCurrentUser(updated);
      storage.saveCurrentSession(updated);
      
      // Sincronizar com Firestore na nuvem
      try {
        await firestoreService.updateUser(currentUser.id, updates);
      } catch (err) {
        console.error('Erro ao sincronizar perfil no Firestore:', err);
      }
      return true;
    }
    return false;
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Nenhum usuário autenticado.' };
    }

    if (currentUser.password !== oldPassword) {
      return { success: false, message: 'Senha atual incorreta.' };
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'A nova senha deve ter pelo menos 6 caracteres.' };
    }

    const updates = {
      password: newPassword,
      must_change_password: false,
    };

    const updated = storage.updateUser(currentUser.id, updates);

    if (updated) {
      setCurrentUser(updated);
      try {
        await firestoreService.updateUser(currentUser.id, updates);
      } catch (err) {
        console.error('Erro ao atualizar senha no Firestore:', err);
      }
      return { success: true, message: 'Senha alterada com sucesso!' };
    }

    return { success: false, message: 'Erro ao atualizar senha.' };
  };

  const completeMustChangePassword = async (newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Sessão inválida.' };
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    if (newPassword === currentUser.password) {
      return { success: false, message: 'A nova senha não pode ser igual à senha provisória anterior.' };
    }

    const updates = {
      password: newPassword,
      must_change_password: false,
    };

    const updated = storage.updateUser(currentUser.id, updates);

    if (updated) {
      setCurrentUser(updated);
      try {
        await firestoreService.updateUser(currentUser.id, updates);
      } catch (err) {
        console.error('Erro ao salvar senha no Firestore:', err);
      }
      return { success: true, message: 'Senha atualizada com sucesso! Bem-vindo ao sistema.' };
    }

    return { success: false, message: 'Erro ao salvar nova senha.' };
  };

  const refreshCurrentUser = () => {
    if (currentUser) {
      const fresh = storage.getUserById(currentUser.id);
      if (fresh) {
        setCurrentUser(fresh);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        completeMustChangePassword,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
