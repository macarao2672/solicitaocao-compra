import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  KeyRound,
  UserPlus,
  LogIn
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, register, completeMustChangePassword, currentUser } = useAuth();
  
  // Modo de visualização: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Campos de Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Campos de Novo Usuário (Apenas Nome e Senha)
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para o fluxo de troca de senha obrigatória (must_change_password)
  const [isMustChangeOpen, setIsMustChangeOpen] = useState(false);
  const [newMandatoryPassword, setNewMandatoryPassword] = useState('');
  const [confirmMandatoryPassword, setConfirmMandatoryPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [mustChangeError, setMustChangeError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setErrorMsg('Por favor, informe seu usuário Siagri.');
      return;
    }

    if (!password) {
      setErrorMsg('Por favor, informe sua senha.');
      return;
    }

    setIsSubmitting(true);
    const result = login(username.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.message || 'Erro ao realizar login.');
      return;
    }

    if (result.mustChangePassword) {
      setIsMustChangeOpen(true);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setErrorMsg('Por favor, informe seu usuário Siagri.');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setErrorMsg('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(regName.trim(), regPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.message || 'Erro ao criar o usuário.');
      return;
    }

    setSuccessMsg('Usuário criado com sucesso! Redirecionando...');
  };

  const handleMustChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMustChangeError(null);

    if (newMandatoryPassword.length < 6) {
      setMustChangeError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newMandatoryPassword !== confirmMandatoryPassword) {
      setMustChangeError('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    const res = await completeMustChangePassword(newMandatoryPassword);
    if (!res.success) {
      setMustChangeError(res.message || 'Erro ao redefinir a senha.');
      return;
    }

    setIsMustChangeOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden text-zinc-100">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative w-full max-w-md z-10">
        {/* Logo & Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 shadow-xl shadow-orange-500/25 ring-1 ring-white/20 mb-4 text-white font-bold">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Portal de Compras
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Gestão inteligente de solicitações e auditoria
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Abas Alternadoras (Login / Criar Usuário) */}
          <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-6">
            <button
              type="button"
              id="tab-login-btn"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Acessar Conta</span>
            </button>

            <button
              type="button"
              id="tab-register-btn"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Novo Usuário</span>
            </button>
          </div>

          {/* Mensagens de Erro ou Sucesso */}
          {errorMsg && (
            <div 
              id="auth-error-alert" 
              className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm animate-in fade-in duration-200"
            >
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div 
              id="auth-success-alert" 
              className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-sm animate-in fade-in duration-200"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{successMsg}</div>
            </div>
          )}

          {/* Formulário de Login */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label 
                  htmlFor="input-username" 
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2"
                >
                  Usuário Siagri
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    id="input-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu usuário Siagri"
                    autoComplete="username"
                    className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-750 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label 
                    htmlFor="input-password" 
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
                  >
                    Senha de Acesso
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    className="w-full pl-11 pr-11 py-3 bg-zinc-950 border border-zinc-750 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    id="btn-toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                <span>{isSubmitting ? 'Acessando...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          ) : (
            /* Formulário de Criação de Usuário (Apenas Nome e Senha) */
            <form onSubmit={handleRegisterSubmit} className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label 
                  htmlFor="input-register-name" 
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2"
                >
                  Usuário Siagri
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    id="input-register-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Digite seu usuário Siagri"
                    autoComplete="name"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-750 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Informe o seu usuário do Siagri para identificação
                </p>
              </div>

              <div>
                <label 
                  htmlFor="input-register-password" 
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2"
                >
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="input-register-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="new-password"
                    required
                    className="w-full pl-11 pr-11 py-3 bg-zinc-950 border border-zinc-750 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    id="btn-toggle-reg-password-visibility"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    aria-label={showRegPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Mínimo de 4 dígitos ou caracteres
                </p>
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário Siagri'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Rodapé Seguro */}
        <div className="mt-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
          <span>Persistência LocalStorage</span>
          <span>•</span>
          <span>Pronto para GitHub Pages</span>
        </div>
      </div>

      {/* Modal Bloqueante de Troca Obrigatória de Senha (must_change_password: true) */}
      {isMustChangeOpen && currentUser && (
        <div 
          id="modal-must-change-password" 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-zinc-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-white">
              Alteração de Senha Obrigatória
            </h2>
            <p className="text-sm text-zinc-300 mt-1.5 leading-relaxed">
              Olá, <span className="font-semibold text-white">{currentUser.name}</span>. Por razões de segurança ou reset pelo administrador, você deve criar uma nova senha antes de acessar as funcionalidades.
            </p>

            {mustChangeError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{mustChangeError}</span>
              </div>
            )}

            <form onSubmit={handleMustChangeSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                  Nova Senha (Mínimo 6 dígitos)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newMandatoryPassword}
                    onChange={(e) => setNewMandatoryPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-750 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmMandatoryPassword}
                  onChange={(e) => setConfirmMandatoryPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-750 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${newMandatoryPassword.length >= 6 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  <span>Pelo menos 6 caracteres</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${newMandatoryPassword && newMandatoryPassword === confirmMandatoryPassword ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  <span>Senhas coincidem</span>
                </div>
              </div>

              <button
                type="submit"
                id="btn-save-mandatory-password"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/25 cursor-pointer"
              >
                Salvar Nova Senha e Continuar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
