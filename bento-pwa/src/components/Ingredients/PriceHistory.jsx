import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

export default function PriceHistory({ ingredientId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!ingredientId) return;
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('ingredient_id', ingredientId)
        .order('date', { ascending: false })
        .limit(3);
      
      if (!error) setHistory(data || []);
      setLoading(false);
    }
    loadHistory();
  }, [ingredientId]);

  if (loading) return <div className="text-[10px] text-slate-400 animate-pulse">Cargando historial...</div>;
  if (history.length === 0) return <div className="text-[10px] text-slate-400 italic">Sin historial de precios</div>;

  return (
    <div className="price-history-tooltip scale-in">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
        <Clock size={12} /> Últimos cambios
      </h4>
      <div className="space-y-1.5">
        {history.map((entry, idx) => {
          const prevEntry = history[idx + 1];
          const diff = prevEntry ? entry.price - prevEntry.price : 0;
          
          return (
            <div key={entry.id} className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-1.5">
                {diff > 0 ? <TrendingUp size={10} className="text-rose-500" /> : 
                 diff < 0 ? <TrendingDown size={10} className="text-emerald-500" /> : 
                 <Minus size={10} className="text-slate-300" />}
                <span className="text-[10px] font-bold text-slate-600">
                  {new Date(entry.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-900">
                {entry.price.toFixed(2)} €
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
