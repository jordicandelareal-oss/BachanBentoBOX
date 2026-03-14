import React from 'react';
import { useIngredients } from '../hooks/useIngredients';
import { Package, Search, Edit2, Plus, AlertCircle } from 'lucide-react';

export default function Ingredients() {
  const { ingredients, loading, error, updatePrice } = useIngredients();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl border border-red-100 m-4">
        <AlertCircle className="text-red-500 mb-2" size={32} />
        <h3 className="text-red-800 font-bold">Error de Conexión</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Insumos</h1>
          <p className="text-slate-500 text-sm">Gestiona tus ingredientes y precios base</p>
        </div>
        <button className="p-2 bg-slate-900 text-white rounded-full shadow-lg hover:scale-105 transition-transform">
          <Plus size={24} />
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar ingrediente..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredIngredients.map(ingredient => (
            <div key={ingredient.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-50 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{ingredient.name}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{ingredient.unit_id || 'unid'}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-black text-slate-900">
                  {ingredient.purchase_price ? `${ingredient.purchase_price.toFixed(2)}€` : '0.00€'}
                </div>
                <button className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1 ml-auto hover:text-slate-900">
                  <Edit2 size={10} /> Editar Precio
                </button>
              </div>
            </div>
          ))}

          {!loading && filteredIngredients.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-medium">No se encontraron insumos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
