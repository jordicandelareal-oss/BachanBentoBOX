import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useIngredients() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Diagnóstico inicial de conexión
    console.log("🔍 [Supabase] Iniciando conexión...");
    console.log("🔍 [Supabase] URL:", import.meta.env.VITE_SUPABASE_URL);

    fetchIngredients()

    // Realtime subscription for live price updates
    const channel = supabase
      .channel('public:ingredients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, payload => {
        if (payload.eventType === 'INSERT') {
          setIngredients(prev => [...prev, payload.new])
        } else if (payload.eventType === 'UPDATE') {
          setIngredients(prev => prev.map(i => i.id === payload.new.id ? payload.new : i))
        } else if (payload.eventType === 'DELETE') {
          setIngredients(prev => prev.filter(i => i.id !== payload.old.id))
        }
      })
      .subscribe((status) => {
        console.log("🔍 [Supabase Realtime] Status:", status);
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchIngredients() {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: supError } = await supabase
        .from('ingredients')
        .select(`
          *,
          net_cost_per_unit
        `)
        .order('name')
        
      if (supError) {
        console.error("❌ [Supabase Fetch Error]", supError);
        throw supError;
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ [Supabase] La tabla 'ingredients' está vacía o el RLS bloquea el acceso.");
      }

      setIngredients(data)
    } catch (err) {
      setError(err.message || "Error desconocido al conectar con Supabase")
      console.error('❌ [Critical Error] fetchIngredients:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updatePrice(id, newPrice) {
    try {
      const { error: supError } = await supabase
        .from('ingredients')
        .update({ purchase_price: newPrice })
        .eq('id', id)
        
      if (supError) throw supError
      return { success: true }
    } catch (err) {
      console.error("❌ [Supabase Update Error]", err);
      return { success: false, error: err.message }
    }
  }

  return { ingredients, loading, error, updatePrice, fetchIngredients }
}
