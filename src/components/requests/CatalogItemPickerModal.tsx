import React, { useState, useMemo } from 'react';
import { CatalogItem } from '../../types';
import { 
  Search, 
  X, 
  Package, 
  Sparkles, 
  Check, 
  DollarSign, 
  Layers,
  Database,
  Filter
} from 'lucide-react';

interface CatalogItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogItems: CatalogItem[];
  onSelectItem: (item: CatalogItem) => void;
  currentIndex?: number;
}

export const CatalogItemPickerModal: React.FC<CatalogItemPickerModalProps> = ({
  isOpen,
  onClose,
  catalogItems,
  onSelectItem,
  currentIndex
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalogItems.forEach((c) => {
      if (c.categoria) set.add(c.categoria);
    });
    return Array.from(set);
  }, [catalogItems]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return catalogItems.filter((item) => {
      const matchesSearch = 
        !term ||
        item.codigo.toLowerCase().includes(term) ||
        item.descricao.toLowerCase().includes(term) ||
        (item.categoria && item.categoria.toLowerCase().includes(term));

      const matchesCat = selectedCategory === 'ALL' || item.categoria === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [catalogItems, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Selecionar do Banco de Itens
                {currentIndex !== undefined && (
                  <span className="text-[11px] text-zinc-400 font-normal">
                    (Item #{currentIndex + 1})
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-zinc-400">
                Toque no item desejado para preencher os dados automaticamente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Busca e Filtro de Categoria */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900 space-y-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código ou descrição do item..."
              className="w-full pl-9 pr-8 py-2.5 bg-zinc-950 border border-zinc-750 text-zinc-100 placeholder-zinc-500 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-orange-500 text-white font-semibold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos ({catalogItems.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-white font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Itens do Catálogo */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Package className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">Nenhum item correspondente encontrado no banco.</p>
              {searchTerm && (
                <p className="text-[11px] text-zinc-500">
                  Você pode digitar o código diretamente no formulário para cadastrá-lo como um novo item.
                </p>
              )}
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectItem(item);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl bg-zinc-950/70 hover:bg-zinc-800/80 active:bg-orange-500/10 border border-zinc-800 hover:border-orange-500/40 transition-all flex items-start justify-between gap-3 group cursor-pointer"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-orange-400 bg-orange-950/40 border border-orange-800/40 px-2 py-0.5 rounded-md">
                      {item.codigo}
                    </span>
                    {item.categoria && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                        {item.categoria}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-zinc-300 bg-zinc-850 px-1.5 py-0.5 rounded">
                      {item.unidade}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-200 group-hover:text-white line-clamp-2">
                    {item.descricao}
                  </p>
                  {item.observacao && (
                    <p className="text-[10px] text-zinc-500 line-clamp-1">
                      {item.observacao}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-400">
                    R$ {Number(item.valor_unitario_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-orange-400/80 group-hover:text-orange-400 font-medium flex items-center justify-end gap-1 mt-1">
                    Selecionar
                    <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
          <span>{filteredItems.length} {filteredItems.length === 1 ? 'item disponível' : 'itens disponíveis'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
