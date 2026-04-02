import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useIngredients() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchIngredients()

    const channel = supabase
      .channel('public:ingredients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, payload => {
        if (payload.eventType === 'INSERT') {
          fetchIngredients() // refetch to get joined data
        } else if (payload.eventType === 'UPDATE') {
          fetchIngredients()
        } else if (payload.eventType === 'DELETE') {
          setIngredients(prev => prev.filter(i => i.id !== payload.old.id))
        }
      })
      .subscribe()

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
          categories:category_id ( id, name ),
          subcategories:subcategory_id ( id, name ),
          units:unit_id ( id, name )
        `)
        .order('name')
        
      if (supError) {
        console.error("❌ [Supabase Fetch Error]", supError);
        throw supError;
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ [Supabase] La tabla 'ingredients' está vacía o el RLS bloquea el acceso.");
      }

      const mapped = (data || []).map(ing => ({
        ...ing,
        category_name: ing.categories?.name || null,
        subcategory_name: ing.subcategories?.name || null,
        unit_name: ing.units?.name || null,
      }));

      setIngredients(mapped)
    } catch (err) {
      setError(err.message || "Error desconocido al conectar con Supabase")
      console.error('❌ [Critical Error] fetchIngredients:', err)
    } finally {
      setLoading(false)
    }
  }

  // Update full ingredient fields
  async function updateIngredient(id, fields) {
    try {
      const { error: supError } = await supabase
        .from('ingredients')
        .update(fields)
        .eq('id', id)
        
      if (supError) throw supError
      await fetchIngredients()
      return { success: true }
    } catch (err) {
      console.error("❌ [Supabase Update Error]", err);
      return { success: false, error: err.message }
    }
  }

  // Add a new ingredient
  async function addIngredient(fields) {
    try {
      const { error: supError } = await supabase
        .from('ingredients')
        .insert([fields])
        
      if (supError) throw supError
      await fetchIngredients()
      return { success: true }
    } catch (err) {
      console.error("❌ [Supabase Insert Error]", err);
      return { success: false, error: err.message }
    }
  }

  // Delete an ingredient
  async function deleteIngredient(id) {
    try {
      const { error: supError } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id)
        
      if (supError) throw supError
      // State is updated automatically by the realtime listener, 
      // but we can also manually filter for immediate feedback
      setIngredients(prev => prev.filter(i => i.id !== id))
      return { success: true }
    } catch (err) {
      console.error("❌ [Supabase Delete Error]", err);
      return { success: false, error: err.message }
    }
  }

  // Toggle public visibility for Ingredients
  async function togglePublish(ingredientId, currentStatus, salePrice = null) {
    try {
      const newStatus = !currentStatus;
      
      // 1. Update ingredients table
      const updateData = { is_published: newStatus };
      if (salePrice !== null) updateData.sale_price = Number(salePrice);
      
      const { error: ingError } = await supabase
        .from('ingredients')
        .update(updateData)
        .eq('id', ingredientId);
      
      if (ingError) throw ingError;

      // 2. Sync with menu_items
      if (newStatus) {
        // Fetch fresh copy to ensure all fields are current
        const { data: ingredient, error: fetchErr } = await supabase
          .from('ingredients')
          .select('*, units:unit_id(name)')
          .eq('id', ingredientId)
          .single();

        if (fetchErr) throw fetchErr;

        if (ingredient) {
          const menuItem = {
            id: ingredientId, // Use ingredient ID as PK for menu_items
            name: ingredient.name,
            description: `Insumo: ${ingredient.brand || ''} ${ingredient.provider || ''}`.trim(),
            price: Number(salePrice || ingredient.sale_price || 0),
            image_url: ingredient.image_url || '',
            recipe_id: null, // Ingredients don't have a recipe_id
            menu_category_id: null, // Default uncategorized for now
            active: true
          };
          
          const { error: upsertErr } = await supabase.from('menu_items').upsert([menuItem]);
          if (upsertErr) throw upsertErr;
        }
      } else {
        // Remove from menu_items if unpublished
        const { error: deleteErr } = await supabase.from('menu_items').delete().eq('id', ingredientId);
        if (deleteErr) throw deleteErr;
      }

      await fetchIngredients();
      return { success: true };
    } catch (err) {
      console.error("❌ [Supabase Ingredient Toggle Error]", err);
      return { success: false, error: err.message };
    }
  }

  return { ingredients, loading, error, updateIngredient, addIngredient, deleteIngredient, fetchIngredients, togglePublish }
}
