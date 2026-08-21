import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { 
  User as UserIcon, 
  Lock, 
  Camera, 
  Image as ImageIcon, 
  Check, 
  ShieldCheck, 
  Calendar, 
  Key, 
  Upload, 
  Sparkles,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { MODERN_AVATAR_PRESETS, MODERN_COVER_PRESETS, generateInitialsAvatar } from '../../utils/avatar';
import { compressImage } from '../../utils/imageCompressor';

const AVATAR_PRESETS = MODERN_AVATAR_PRESETS;
const COVER_PRESETS = MODERN_COVER_PRESETS;

export const ProfileView: React.FC = () => {
  const { currentUser, updateProfile, changePassword } = useAuth();
  const { addToast } = useData();

  if (!currentUser) return null;

  // Estado do Perfil
  const [name, setName] = useState(currentUser.name);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url);
  const [coverUrl, setCoverUrl] = useState(currentUser.cover_url);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Sincronizar quando dados de currentUser forem atualizados em tempo real do Firestore
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setAvatarUrl(currentUser.avatar_url);
      setCoverUrl(currentUser.cover_url);
    }
  }, [currentUser?.name, currentUser?.avatar_url, currentUser?.cover_url]);

  // Estado da Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Manipuladores de Upload com compressão otimizada para nuvem
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingImage(true);
        // Comprime para no máximo 350x350 mantendo excelente nitidez e ~25KB
        const compressed = await compressImage(file, 350, 350, 0.85);
        setAvatarUrl(compressed);
        addToast({ type: 'info', title: 'Foto selecionada', message: 'Clique em "Salvar Alterações" para aplicar.' });
      } catch (err) {
        console.error('Erro ao processar avatar:', err);
        addToast({ type: 'error', title: 'Erro na Imagem', message: 'Não foi possível carregar a imagem selecionada.' });
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingImage(true);
        // Comprime a capa para no máximo 1200x450 e ~60KB
        const compressed = await compressImage(file, 1200, 450, 0.82);
        setCoverUrl(compressed);
        addToast({ type: 'info', title: 'Capa selecionada', message: 'Clique em "Salvar Alterações" para aplicar.' });
      } catch (err) {
        console.error('Erro ao processar capa:', err);
        addToast({ type: 'error', title: 'Erro na Capa', message: 'Não foi possível processar a imagem de capa.' });
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({ type: 'error', title: 'Campo obrigatório', message: 'O nome de exibição não pode estar em branco.' });
      return;
    }

    setIsSavingProfile(true);
    const success = await updateProfile({
      name: name.trim(),
      avatar_url: avatarUrl,
      cover_url: coverUrl,
    });
    setIsSavingProfile(false);

    if (success) {
      addToast({ type: 'success', title: 'Perfil Atualizado', message: 'Suas informações foram salvas com sucesso.' });
    } else {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível salvar o perfil.' });
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast({ type: 'error', title: 'Senha atual necessária', message: 'Informe sua senha atual para validação.' });
      return;
    }

    if (newPassword.length < 6) {
      addToast({ type: 'error', title: 'Senha curta', message: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', title: 'Confirmação incompatível', message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    setIsSavingPassword(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsSavingPassword(false);

    if (res.success) {
      addToast({ type: 'success', title: 'Senha Atualizada', message: 'Sua senha foi redefinida com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      addToast({ type: 'error', title: 'Falha ao alterar senha', message: res.message || 'Verifique sua senha atual.' });
    }
  };

  return (
    <div id="profile-container" className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Banner de Cabeçalho do Perfil */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs relative">
        {/* Foto de Capa */}
        <div className="h-44 sm:h-56 w-full relative bg-zinc-950 overflow-hidden group">
          <img
            src={coverUrl}
            alt="Foto de Capa"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = COVER_PRESETS[0];
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
          
          <label 
            htmlFor="cover-upload-input"
            className="absolute top-4 right-4 bg-zinc-900/80 hover:bg-zinc-900 text-white text-xs font-medium px-3 py-2 rounded-xl backdrop-blur-md border border-zinc-700/60 shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-orange-400" />
            <span>Alterar Capa</span>
            <input
              id="cover-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverFileChange}
            />
          </label>
        </div>

        {/* Informações Resumidas do Usuário */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Foto de Perfil */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-4 border-zinc-900 bg-zinc-950 shadow-xl relative">
                <img
                  src={avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = AVATAR_PRESETS[0];
                  }}
                />
              </div>
              <label
                htmlFor="avatar-upload-input"
                className="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white p-2 rounded-xl shadow-lg border-2 border-zinc-900 cursor-pointer transition-all"
                title="Trocar Foto de Perfil"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </label>
            </div>

            {/* Badges e Identificadores */}
            <div className="flex-1 sm:ml-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
                  {currentUser.name}
                </h1>
                {currentUser.role === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                    Administrador
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                    Colaborador
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 font-mono mt-0.5">
                @{currentUser.username}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 shrink-0">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span>Membro desde: {new Date(currentUser.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Edição de Perfil */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800 mb-6">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">Dados do Perfil</h2>
                <p className="text-xs text-zinc-400">Personalize seu nome de exibição e fotos</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Nome de Exibição */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Nome Completo / Exibição
                </label>
                <input
                  type="text"
                  id="profile-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950 transition-all font-medium"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              {/* Nome de Usuário (Fixado) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Nome de Usuário (Login)
                </label>
                <div className="px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-400 text-sm font-mono flex items-center justify-between">
                  <span>{currentUser.username}</span>
                  <span className="text-[11px] text-zinc-500">Identificador único</span>
                </div>
              </div>

              {/* Galeria de Avatares Rápidos */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Avatares Sugeridos
                </label>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                        avatarUrl === preset ? 'border-orange-500 ring-2 ring-orange-500/30 scale-105' : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <img src={preset} alt={`Avatar preset ${index}`} className="w-full h-full object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Galeria de Capas Rápidas */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Capas Sugeridas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {COVER_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCoverUrl(preset)}
                      className={`h-14 rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                        coverUrl === preset ? 'border-orange-500 ring-2 ring-orange-500/30 scale-102' : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <img src={preset} alt={`Capa preset ${index}`} className="w-full h-full object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-zinc-800">
                <button
                  type="submit"
                  id="btn-save-profile"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Card de Alteração de Senha */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800 mb-6">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">Segurança & Senha</h2>
                <p className="text-xs text-zinc-400">Altere sua senha de acesso</p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              {/* Senha Atual */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    id="input-current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-zinc-950"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Nova Senha (Mínimo 6 dígitos)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    id="input-new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Crie uma nova senha"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-zinc-950"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  id="input-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-zinc-950"
                  required
                />
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <button
                  type="submit"
                  id="btn-update-password"
                  disabled={isSavingPassword}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-750 active:bg-zinc-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 border border-zinc-700"
                >
                  <Key className="w-4 h-4 text-orange-400" />
                  <span>{isSavingPassword ? 'Atualizando...' : 'Atualizar Senha'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

