import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/layout/Header';
import { RequestDashboard } from './components/requests/RequestDashboard';
import { AdminPanel } from './components/admin/AdminPanel';
import { ProfileView } from './components/profile/ProfileView';
import { ToastContainer } from './components/common/ToastContainer';

const MainAppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'requests' | 'admin' | 'profile'>('requests');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-400">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado ou deve trocar senha, exibe a tela de login/troca
  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Barra de Navegação Superior */}
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'requests' && <RequestDashboard />}
        {currentTab === 'admin' && <AdminPanel />}
        {currentTab === 'profile' && <ProfileView />}
      </main>

      {/* Rodapé Corporativo */}
      <footer className="border-t border-zinc-800/80 bg-zinc-900/60 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">Sistema de Gestão de Solicitações de Compras</span>
            <span>•</span>
            <span>Versão 2.4.0 (SPA Static Build)</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-500">
            <span>Persistência Local (LocalStorage)</span>
            <span>•</span>
            <span>GitHub Pages Ready</span>
          </div>
        </div>
      </footer>

      {/* Notificações Globais */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}
