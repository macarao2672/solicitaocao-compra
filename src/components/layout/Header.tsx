import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { generateInitialsAvatar } from '../../utils/avatar';
import { 
  Building2, 
  ShoppingCart, 
  Users, 
  User as UserIcon, 
  LogOut, 
  RotateCcw, 
  Menu, 
  X, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'requests' | 'admin' | 'profile';
  setCurrentTab: (tab: 'requests' | 'admin' | 'profile') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, logout } = useAuth();
  const { resetDatabase } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  if (!currentUser) return null;

  const handleNavClick = (tab: 'requests' | 'admin' | 'profile') => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleConfirmReset = () => {
    resetDatabase();
    setShowResetModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo & Marca */}
            <div className="flex items-center gap-3">
              <div 
                onClick={() => handleNavClick('requests')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-zinc-100 text-base leading-tight tracking-tight flex items-center gap-1.5">
                    <span>ComprasPro</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20">
                      ERP
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-medium">Gestão de Solicitações</div>
                </div>
              </div>
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden md:flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                id="nav-tab-requests"
                onClick={() => handleNavClick('requests')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  currentTab === 'requests'
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-orange-500" />
                <span>Solicitações</span>
              </button>

              {currentUser.role === 'ADMIN' && (
                <button
                  type="button"
                  id="nav-tab-admin"
                  onClick={() => handleNavClick('admin')}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    currentTab === 'admin'
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent'
                  }`}
                >
                  <Users className="w-4 h-4 text-orange-500" />
                  <span>Painel Admin</span>
                </button>
              )}

              <button
                type="button"
                id="nav-tab-profile"
                onClick={() => handleNavClick('profile')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  currentTab === 'profile'
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent'
                }`}
              >
                <UserIcon className="w-4 h-4 text-orange-500" />
                <span>Meu Perfil</span>
              </button>
            </nav>

            {/* Área do Usuário & Controles */}
            <div className="hidden md:flex items-center gap-3">
              {/* Restaurar Seed (Apenas para ADMIN) */}
              {currentUser.role === 'ADMIN' && (
                <button
                  type="button"
                  id="btn-reset-database-seed"
                  onClick={() => setShowResetModal(true)}
                  className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-950/20 rounded-xl transition-colors cursor-pointer border border-zinc-800/60"
                  title="Restaurar Banco de Dados Local para o Padrão (Exclusivo Administrador)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* Perfil & Logout */}
              <div className="relative">
                <div 
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-lg object-cover border border-zinc-700 shadow-2xs"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = generateInitialsAvatar(currentUser.name, 'ea580c');
                    }}
                  />
                  <div className="text-left leading-tight">
                    <div className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                      <span>{currentUser.name.split(' ')[0]}</span>
                      {currentUser.role === 'ADMIN' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">@{currentUser.username}</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="btn-logout"
                onClick={logout}
                className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer border border-zinc-800/60"
                title="Encerrar Sessão"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Botão Hamburger (Mobile) */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                id="btn-toggle-mobile-menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-zinc-300 hover:bg-zinc-800 rounded-xl"
                aria-label="Abrir menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Drawer Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-900 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
            {/* Card do Usuário Mobile */}
            <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = generateInitialsAvatar(currentUser.name, 'ea580c');
                }}
              />
              <div className="flex-1">
                <div className="font-bold text-sm text-zinc-100">{currentUser.name}</div>
                <div className="text-xs text-zinc-400 font-mono">@{currentUser.username} ({currentUser.role})</div>
              </div>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNavClick('requests')}
                className={`w-full px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                  currentTab === 'requests' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-orange-500" />
                <span>Solicitações de Compras</span>
              </button>

              {currentUser.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleNavClick('admin')}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                    currentTab === 'admin' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Users className="w-4 h-4 text-orange-500" />
                  <span>Painel do Administrador</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleNavClick('profile')}
                className={`w-full px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors ${
                  currentTab === 'profile' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <UserIcon className="w-4 h-4 text-orange-500" />
                <span>Editar Perfil & Senha</span>
              </button>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              {currentUser.role === 'ADMIN' ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowResetModal(true);
                  }}
                  className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Base</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={logout}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair do Sistema</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modal Personalizado de Confirmação de Reset (Exclusivo Administrador) */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Restaurar Dados Iniciais?</h3>
                <p className="text-xs text-zinc-400">Ação restrita a Administradores</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Tem certeza de que deseja restaurar as configurações e dados de demonstração originais do sistema? Esta ação é irreversível no dispositivo local.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
