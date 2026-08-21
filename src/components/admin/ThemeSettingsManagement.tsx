import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Paintbrush, Check } from 'lucide-react';

export const ThemeSettingsManagement: React.FC = () => {
  const { systemSettings, updateGlobalTheme } = useData();
  const { currentUser } = useAuth();

  if (currentUser?.role !== 'ADMIN') {
    return null;
  }

  const currentTheme = systemSettings?.activeTheme || 'default';

  const themes = [
    {
      id: 'default',
      name: 'Lava Escura (Padrão)',
      description: 'Tema original escuro com destaques em laranja neon.',
      primaryColor: 'bg-orange-500',
      bgColor: 'bg-zinc-950',
    },
    {
      id: 'ocean',
      name: 'Oceano Corporativo',
      description: 'Tema elegante com fundo azul profundo (navy/slate) e destaques em azul corporativo.',
      primaryColor: 'bg-blue-500',
      bgColor: 'bg-slate-950',
    },
    {
      id: 'forest',
      name: 'Floresta Noturna',
      description: 'Tema suave com tons de verde esmeralda e fundo cinza-esverdeado escuro.',
      primaryColor: 'bg-emerald-500',
      bgColor: 'bg-gray-950',
    }
  ] as const;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Paintbrush className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Aparência e Temas Globais</h2>
            <p className="text-sm text-zinc-400">
              Altere o tema visual de todo o sistema. A mudança será aplicada em tempo real para todos os usuários.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map((theme) => {
          const isActive = currentTheme === theme.id;

          return (
            <button
              key={theme.id}
              onClick={() => updateGlobalTheme(theme.id)}
              className={`text-left relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                isActive 
                  ? 'border-orange-500 bg-orange-500/5' 
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between w-full mb-4">
                <div className="flex gap-2">
                  <div className={`w-8 h-8 rounded-full shadow-inner ${theme.bgColor} border border-zinc-700`} />
                  <div className={`w-8 h-8 rounded-full shadow-inner ${theme.primaryColor} border border-zinc-700`} />
                </div>
                {isActive && (
                  <div className="bg-orange-500 rounded-full p-1 shadow-md shadow-orange-500/20">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <h3 className={`font-bold ${isActive ? 'text-orange-400' : 'text-zinc-200'}`}>
                {theme.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-2 flex-1">
                {theme.description}
              </p>
              
              {isActive && (
                <div className="mt-4 pt-3 border-t border-orange-500/20 text-[10px] font-semibold text-orange-500 uppercase tracking-wider">
                  Tema Ativo
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
