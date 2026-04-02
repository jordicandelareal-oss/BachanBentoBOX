import React from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { ChefHat, Search, ChevronRight, TrendingUp } from 'lucide-react';

export default function Recipes() {
  const { recipes, loading, error } = useRecipes();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 max-w-4xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Recetas</h1>
          <p className="text-slate-500 text-sm">Escandallos y costos de elaboración</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar receta o escandallo..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRecipes.map(recipe => (
            <div key={recipe.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-50 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <ChefHat size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{recipe.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {recipe.recipe_type || 'base'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Rinde: {recipe.portions} rac.
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-400">COSTE/RAC.</div>
                  <div className="text-lg font-black text-slate-900">
                    {recipe.cost_per_portion ? `${recipe.cost_per_portion.toFixed(2)}€` : '0.00€'}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </div>
          ))}

          {!loading && filteredRecipes.length === 0 && (
            <div className="text-center py-12">
              <ChefHat className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-medium">No se encontraron recetas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
