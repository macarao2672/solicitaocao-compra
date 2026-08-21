import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { CatalogItem } from '../../types';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Database, 
  Check, 
  X, 
  DollarSign, 
  Layers, 
  Sparkles,
  Info,
  Tag
} from 'lucide-react';

const UNIT_OPTIONS = ['UN', 'CX', 'KG', 'PCT', 'L', 'M', 'PAR', 'SERV', 'KIT', 'M2', 'ROLO'];

export const CatalogManagement: React.FC = () => {
  const { catalogItems, saveCatalogItem, updateCatalogItem, deleteCatalogItem, addToast } = useData();

  // Estados de Busca e Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');

  // Modal de Criação / Edição de Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  // Campos do Formulário
  const [itemCodigo, setItemCodigo] = useState('');
  const [itemDescricao, setItemDescricao] = useState('');
  const [itemValor, setItemValor] = useState<number | string>(0);
  const [itemUnidade, setItemUnidade] = useState('UN');
  const [itemCategoria, setItemCategoria] = useState('Geral');
  const [itemObservacao, setItemObservacao] = useState('');

  // Modal de Exclusão
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null);

  // Itens Filtrados
  const filteredItems = catalogItems.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      item.codigo.toLowerCase().includes(term) ||
      item.descricao.toLowerCase().includes(term) ||
      (item.categoria && item.categoria.toLowerCase().includes(term)) ||
      (item.observacao && item.observacao.toLowerCase().includes(term));

    const matchesUnit = unitFilter === 'ALL' || item.unidade === unitFilter;

    return matchesSearch && matchesUnit;
  });

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setItemCodigo('');
    setItemDescricao('');
    setItemValor(0);
    setItemUnidade('UN');
    setItemCategoria('Geral');
    setItemObservacao('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setItemCodigo(item.codigo);
    setItemDescricao(item.descricao);
    setItemValor(item.valor_unitario_estimado);
    setItemUnidade(item.unidade || 'UN');
    setItemCategoria(item.categoria || 'Geral');
    setItemObservacao(item.observacao || '');
    setIsModalOpen(true);
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = itemCodigo.trim();
    const cleanDesc = itemDescricao.trim();
    const cleanPrice = Number(itemValor) || 0;

    if (!cleanCode) {
      addToast({ type: 'error', title: 'Código Obrigatório', message: 'Informe o código do item.' });
      return;
    }

    if (!cleanDesc) {
      addToast({ type: 'error', title: 'Descrição Obrigatória', message: 'Informe a descrição do item.' });
      return;
    }

    if (editingItem) {
      // Edição
      updateCatalogItem(editingItem.id, {
        codigo: cleanCode,
        descricao: cleanDesc,
        valor_unitario_estimado: cleanPrice,
        unidade: itemUnidade,
        categoria: itemCategoria.trim() || 'Geral',
        observacao: itemObservacao.trim(),
      });
    } else {
      // Novo Item
      saveCatalogItem({
        codigo: cleanCode,
        descricao: cleanDesc,
        valor_unitario_estimado: cleanPrice,
        unidade: itemUnidade,
        categoria: itemCategoria.trim() || 'Geral',
        observacao: itemObservacao.trim(),
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    deleteCatalogItem(deletingItem.id);
    setDeletingItem(null);
  };

  return (
    <div id="catalog-management-section" className="space-y-6 animate-in fade-in duration-300">
      {/* Barra de Filtros e Adicionar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-400" />
              Catálogo e Banco de Códigos de Itens
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Itens cadastrados aqui são auto-preenchidos quando o solicitante digita o código na solicitação de compras.
            </p>
          </div>

          <button
            type="button"
            id="btn-open-create-catalog-item"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Item</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Campo de Busca */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="catalog-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ex: INF-001), descrição, categoria..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950 transition-all"
            />
          </div>

          {/* Filtro por Unidade */}
          <div>
            <select
              id="catalog-filter-unit"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-zinc-950"
            >
              <option value="ALL">Todas as Unidades de Medida</option>
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
          <span>
            Exibindo <strong>{filteredItems.length}</strong> de <strong>{catalogItems.length}</strong> itens cadastrados no banco
          </span>
          <span className="text-zinc-500">
            Itens novos em solicitações são salvos automaticamente no banco
          </span>
        </div>
      </div>

      {/* Tabela de Itens */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-3">
            <Package className="w-12 h-12 text-zinc-600 mx-auto" />
            <div className="text-base font-semibold text-zinc-300">
              {searchTerm || unitFilter !== 'ALL' ? 'Nenhum item encontrado com os filtros aplicados' : 'Nenhum item cadastrado no banco'}
            </div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Cadastre itens manualmente clicando no botão acima, ou realize solicitações no sistema — qualquer novo código digitado será registrado automaticamente!
            </p>
            {(!searchTerm && unitFilter === 'ALL') && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeiro Item</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-3.5 px-6">Código</th>
                  <th className="py-3.5 px-6">Descrição do Item</th>
                  <th className="py-3.5 px-4">Valor Unit. Estimado</th>
                  <th className="py-3.5 px-4">Unidade</th>
                  <th className="py-3.5 px-4">Categoria / Obs</th>
                  <th className="py-3.5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-800/40 transition-colors">
                    {/* Código */}
                    <td className="py-4 px-6 font-mono font-bold text-orange-400">
                      <span className="bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg">
                        {item.codigo}
                      </span>
                    </td>

                    {/* Descrição */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-100">
                        {item.descricao}
                      </div>
                      {item.observacao && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {item.observacao}
                        </div>
                      )}
                    </td>

                    {/* Valor Unitário */}
                    <td className="py-4 px-4 font-mono font-semibold text-emerald-400">
                      R$ {item.valor_unitario_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Unidade */}
                    <td className="py-4 px-4">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {item.unidade}
                      </span>
                    </td>

                    {/* Categoria */}
                    <td className="py-4 px-4 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-md border border-zinc-800">
                        <Tag className="w-3 h-3 text-zinc-500" />
                        {item.categoria || 'Geral'}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 text-zinc-400 hover:text-amber-400 hover:bg-amber-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Editar Item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Item do Banco"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Criar / Editar Item */}
      {isModalOpen && (
        <div 
          id="modal-catalog-item"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">
                    {editingItem ? 'Editar Item do Catálogo' : 'Cadastrar Item no Banco'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {editingItem ? 'Atualize as informações de código, descrição e preço' : 'Defina o código para auto-preenchimento nas solicitações'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Código */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Código do Item *
                  </label>
                  <input
                    type="text"
                    value={itemCodigo}
                    onChange={(e) => setItemCodigo(e.target.value)}
                    placeholder="Ex: INF-001, PEC-102"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={itemCategoria}
                    onChange={(e) => setItemCategoria(e.target.value)}
                    placeholder="Ex: Informática, Elétrica, Escritório"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Descrição / Nome do Item *
                </label>
                <input
                  type="text"
                  value={itemDescricao}
                  onChange={(e) => setItemDescricao(e.target.value)}
                  placeholder="Ex: Teclado Mecânico USB ABNT2"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Valor Unitário */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Valor Unitário Estimado (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemValor}
                    onChange={(e) => setItemValor(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                {/* Unidade */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Unidade de Medida
                  </label>
                  <select
                    value={itemUnidade}
                    onChange={(e) => setItemUnidade(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Observações Adicionais
                </label>
                <textarea
                  rows={2}
                  value={itemObservacao}
                  onChange={(e) => setItemObservacao(e.target.value)}
                  placeholder="Informações técnicas, marca padrão ou fornecedor sugerido..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirm-save-catalog-item"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                >
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Excluir Item */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-zinc-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-zinc-100">
              Excluir Item do Catálogo?
            </h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Tem certeza que deseja remover o item <strong className="text-orange-400">[{deletingItem.codigo}] {deletingItem.descricao}</strong> do banco de dados? As solicitações existentes que utilizam este código não serão afetadas.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-catalog-item"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Item</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
