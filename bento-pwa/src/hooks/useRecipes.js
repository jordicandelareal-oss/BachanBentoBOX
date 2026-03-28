import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRecipes(type = null) {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRecipes()
    
    // Watch recipes
    const recipesChannel = supabase
      .channel('public:recipes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => fetchRecipes())
      .subscribe()

    // Watch ingredients (price changes)
    const ingredientsChannel = supabase
      .channel('public:ingredients_costs')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ingredients' }, () => fetchRecipes())
      .subscribe()

    // Watch recipe items additions/removals
    const riChannel = supabase
      .channel('public:recipe_ingredients_costs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipe_ingredients' }, () => fetchRecipes())
      .subscribe()

    return () => {
      supabase.removeChannel(recipesChannel)
      supabase.removeChannel(ingredientsChannel)
      supabase.removeChannel(riChannel)
    }
  }, [type])

  async function fetchRecipes() {
    try {
      setLoading(true)
      
      let recipesQuery = supabase
        .from('recipes')
        .select(`
          *,
          unit:units!Unid_Id(name)
        `)
        .order('name')
        
      if (type) {
        recipesQuery = recipesQuery.eq('recipe_type', type)
      }

      const { data: recipesData, error: recipesError } = await recipesQuery
      if (recipesError) throw recipesError

      // Merge data (using cost_per_portion from recipes table)
      const merged = (recipesData || []).map(recipe => ({
        ...recipe,
        unit_name: recipe.unit?.name || 'ud',
        preparation_category: null, 
        cost_per_portion: recipe.cost_per_portion || 0
      }))
      
      setRecipes(merged)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching recipes:', err)
      // Fallback
      try {
        const { data: fallback } = await supabase.from('recipes').select('*').order('name')
        if (fallback) {
          setRecipes(fallback.map(r => ({ ...r, unit_name: 'ud', cost_per_portion: r.cost_per_portion || 0 })))
          setError(null)
        }
      } catch (_) { }
    } finally {
      setLoading(false)
    }
  }

  // Toggle public visibility
  async function togglePublish(recipeId, currentStatus) {
    try {
      const newStatus = !currentStatus;
      
      // 1. Update recipe table
      const { error: recipeError } = await supabase
        .from('recipes')
        .update({ is_published: newStatus })
        .eq('id', recipeId);
      
      if (recipeError) throw recipeError;

      // 2. Sync with menu_items
      if (newStatus) {
        const { data: recipe } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', recipeId)
          .single();

        if (recipe) {
          const menuItem = {
            id: recipeId,
            name: recipe.name,
            description: recipe.description || '',
            price: Number(recipe.sale_price || recipe.cost_per_portion || 0),
            image_url: recipe.image_url || '',
            recipe_id: recipeId,
            menu_category_id: recipe.menu_category_id || null,
            is_active: true
          };
          await supabase.from('menu_items').upsert([menuItem]);
        }
      } else {
        await supabase.from('menu_items').delete().eq('recipe_id', recipeId);
      }

      return { success: true };
    } catch (err) {
      console.error("❌ [Supabase Toggle Error]", err);
      return { success: false, error: err.message };
    }
  }

  // Delete a recipe
  async function deleteRecipe(id) {
    try {
      const { error: supError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        
      if (supError) throw supError
      return { success: true }
    } catch (err) {
      console.error("❌ [Supabase Delete Error]", err);
      return { success: false, error: err.message }
    }
  }

  return { recipes, loading, error, deleteRecipe, fetchRecipes, togglePublish }
}
