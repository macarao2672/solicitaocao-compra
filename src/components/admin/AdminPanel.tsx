import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { User, UserRole } from '../../types';
import { generateInitialsAvatar } from '../../utils/avatar';
import { CatalogManagement } from './CatalogManagement';
import { ThemeSettingsManagement } from './ThemeSettingsManagement';
import { 
  Users, 
  UserPlus, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  KeyRound, 
  Search, 
  Filter, 
  Check, 
  X, 
  AlertTriangle,
  Copy,
  CheckCircle2,
  Trash2,
  Sparkles,
  Package,
  Database,
  Cpu,
  Paintbrush
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    users, 
    catalogItems,
    adminToggleBlockUser, 
    adminResetPassword, 
    adminCreateUser,
    adminDeleteUser,
    addToast 
  } = useData();

  // Aba selecionada: Usuários ou Catálogo de Itens
  const [activeTab, setActiveTab] = useState<'USERS' | 'CATALOG' | 'THEME'>('USERS');

  // Estados de Busca e Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED' | 'MUST_CHANGE'>('ALL');

  // Modal de Criação de Usuário
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');

  // Modal de Confirmação de Reset de Senha
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [customTempPassword, setCustomTempPassword] = useState('');
  const [resetResultData, setResetResultData] = useState<{ user: User; pass: string } | null>(null);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="bg-rose-950/20 border border-rose-800/40 rounded-2xl p-8 text-center max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-rose-400">Acesso Restrito</h2>
        <p className="text-sm text-rose-300 mt-1">
          Você não possui privilégios de Administrador para acessar esta área.
        </p>
      </div>
    );
  }

  // Filtragem de Usuários
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') matchesStatus = !u.is_blocked && !u.must_change_password;
    if (statusFilter === 'BLOCKED') matchesStatus = u.is_blocked;
    if (statusFilter === 'MUST_CHANGE') matchesStatus = u.must_change_password;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminCreateUser({
      username: newUsername,
      name: newName,
      password: newPassword || undefined,
      role: newRole,
    });

    if (res.success) {
      setIsCreateModalOpen(false);
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      setNewRole('USER');
    } else {
      addToast({ type: 'error', title: 'Erro ao cadastrar', message: res.message });
    }
  };

  const handleExecuteResetPassword = () => {
    if (!resetModalUser) return;
    const res = adminResetPassword(resetModalUser.id, customTempPassword);
    if (res.success && res.tempPassword) {
      setResetResultData({
        user: resetModalUser,
        pass: res.tempPassword,
      });
      setResetModalUser(null);
      setCustomTempPassword('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Copiado!', message: 'Senha copiada para a área de transferência.' });
  };

  return (
    <div id="admin-panel-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho do Painel Admin */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
                Painel do Administrador
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Gerencie contas, permissões, bloqueios e o catálogo de itens cadastrados
              </p>
            </div>
          </div>
        </div>

        {/* Abas de Navegação do Admin */}
        <div className="flex items-center p-1 bg-zinc-950 border border-zinc-800 rounded-xl shrink-0">
          <button
            type="button"
            id="tab-admin-users"
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'USERS'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuários & Acessos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'USERS' ? 'bg-orange-600 text-orange-100' : 'bg-zinc-800 text-zinc-400'}`}>
              {users.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-admin-items"
            onClick={() => setActiveTab('CATALOG')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'CATALOG'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Itens do Catálogo</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'CATALOG' ? 'bg-orange-600 text-orange-100' : 'bg-zinc-800 text-zinc-400'}`}>
              {catalogItems.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-admin-theme"
            onClick={() => setActiveTab('THEME')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'THEME'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Aparência</span>
          </button>
        </div>
      </div>

      {activeTab === 'THEME' ? (
        <ThemeSettingsManagement />
      ) : activeTab === 'CATALOG' ? (
        <CatalogManagement />
      ) : (
        <>
          {/* Barra de Filtros e Busca */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                Gestão de Usuários e Permissões
              </h2>

              <button
                type="button"
                id="btn-open-create-user-modal"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cadastrar Usuário</span>
              </button>
            </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="admin-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou @usuário..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950 transition-all"
            />
          </div>

          {/* Filtro por Role */}
          <div>
            <select
              id="admin-filter-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950"
            >
              <option value="ALL">Todos os Perfis (ADMIN e USER)</option>
              <option value="ADMIN">Apenas Administradores</option>
              <option value="USER">Apenas Usuários Colaboradores</option>
            </select>
          </div>

          {/* Filtro por Status */}
          <div>
            <select
              id="admin-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Ativos e Regulares</option>
              <option value="BLOCKED">Bloqueados</option>
              <option value="MUST_CHANGE">Com Troca Obrigatória Pendente</option>
            </select>
          </div>
        </div>

        {/* Resumo de Usuários */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
          <span>Exibindo <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuários</span>
          <span className="text-zinc-500">Clique nas ações para gerenciar acessos</span>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-6">Usuário</th>
                <th className="py-3.5 px-4">Perfil / Role</th>
                <th className="py-3.5 px-4">Status da Conta</th>
                <th className="py-3.5 px-4">Cadastrado em</th>
                <th className="py-3.5 px-6 text-right">Ações Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentUser.id;

                return (
                  <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                    {/* Usuário e Avatar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-800 shadow-xs shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = generateInitialsAvatar(user.name, 'ea580c');
                          }}
                        />
                        <div>
                          <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-normal">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 font-mono">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      {user.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                          USER
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        {user.is_blocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
                            <Lock className="w-3 h-3" />
                            Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativo
                          </span>
                        )}

                        {user.must_change_password && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
                            <KeyRound className="w-3 h-3" />
                            Deve trocar senha
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Data */}
                    <td className="py-4 px-4 text-xs text-zinc-400">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão Resetar Senha */}
                        <button
                          type="button"
                          id={`btn-reset-password-${user.id}`}
                          onClick={() => {
                            setResetModalUser(user);
                            setCustomTempPassword('');
                          }}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-amber-950/30 text-zinc-300 hover:text-amber-400 border border-zinc-700 hover:border-amber-500/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Resetar Senha e forçar troca no login"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          <span>Resetar Senha</span>
                        </button>

                        {/* Botão Bloquear / Desbloquear */}
                        {!isSelf && (
                          <button
                            type="button"
                            id={`btn-toggle-block-${user.id}`}
                            onClick={() => adminToggleBlockUser(user.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                              user.is_blocked
                                ? 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-400 border-emerald-800'
                                : 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border-rose-800'
                            }`}
                            title={user.is_blocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
                          >
                            {user.is_blocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Desbloquear</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-rose-400" />
                                <span>Bloquear</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Botão Excluir Usuário */}
                        {!isSelf && user.username !== 'Flavio.silva' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja realmente remover o usuário "${user.name}"?`)) {
                                adminDeleteUser(user.id);
                              }
                            }}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Remover Usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="font-medium text-zinc-400">Nenhum usuário encontrado com os filtros selecionados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* MODAL: Cadastrar Novo Usuário */}
      {isCreateModalOpen && (
        <div 
          id="modal-create-user" 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Novo Usuário</h3>
                  <p className="text-xs text-zinc-400">Cadastre um novo colaborador ou admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Nome Completo / Identificação Siagri
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Eduardo Santos"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Usuário Siagri (Login)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.replace(/\s+/g, ''))}
                  placeholder="Ex: eduardo.santos"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Perfil de Acesso (Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950"
                >
                  <option value="USER">Colaborador Padrão (USER)</option>
                  <option value="ADMIN">Administrador Geral (ADMIN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Senha Inicial (Opcional - Padrão: Trocar@123)
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Trocar@123"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  O usuário será obrigado a criar uma nova senha no primeiro login.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirm-create-user"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Reset de Senha */}
      {resetModalUser && (
        <div 
          id="modal-reset-password" 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-zinc-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-100">
              Resetar Senha de {resetModalUser.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Ao resetar a senha, o usuário terá a flag <code className="text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded font-mono font-semibold border border-amber-500/20">must_change_password: true</code> ativada e precisará definir uma nova senha no próximo login.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Senha Provisória Personalizada (Ou deixe em branco para gerar aleatória)
                </label>
                <input
                  type="text"
                  value={customTempPassword}
                  onChange={(e) => setCustomTempPassword(e.target.value)}
                  placeholder="Ex: TempPass@2026"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="px-4 py-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-execute-reset"
                onClick={handleExecuteResetPassword}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-amber-600/20 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <KeyRound className="w-4 h-4" />
                <span>Resetar Senha Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Resultado do Reset de Senha (Exibição da Senha Gerada) */}
      {resetResultData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center text-zinc-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-100">
              Senha Provisória Gerada
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Copie e envie a senha temporária para <strong>{resetResultData.user.name}</strong> (@{resetResultData.user.username}):
            </p>

            <div className="mt-5 p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between text-white font-mono text-base font-bold tracking-wider">
              <span className="text-orange-400">{resetResultData.pass}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(resetResultData.pass)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-lg transition-colors cursor-pointer"
                title="Copiar Senha"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setResetResultData(null)}
              className="mt-6 w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-md shadow-orange-500/20 transition-colors"
            >
              Concluído
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
