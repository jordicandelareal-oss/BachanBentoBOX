import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRecipes(type = null) {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const typeDep = JSON.stringify(type);

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true)
      
      const parsedType = JSON.parse(typeDep);
      
      let recipesQuery = supabase
        .from('recipes')
        .select(`
          id, name, recipe_type, cost_per_portion, portions, net_yield, yield_scenario, 
          "Unid_Id", preparation_category_Id, menu_category_id, is_published, 
          image_url, platos_estimados, sale_price,
          unit:units!Unid_Id(name)
        `)
        .order('name')
        
      if (parsedType) {
        if (Array.isArray(parsedType)) {
          recipesQuery = recipesQuery.in('recipe_type', parsedType)
        } else {
          recipesQuery = recipesQuery.eq('recipe_type', parsedType)
        }
      }

      const { data: recipesData, error: recipesError } = await recipesQuery
      if (recipesError) throw recipesError

      const merged = (recipesData || []).map(recipe => ({
        ...recipe,
        unit_name: recipe.unit?.name || 'ud',
        cost_per_portion: parseFloat(recipe.cost_per_portion || 0)
      }))

      setRecipes(merged)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching recipes:', err)
    } finally {
      setLoading(false)
    }
  }, [typeDep]);

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
  }, [fetchRecipes])

  // Toggle public visibility
  async function togglePublish(recipeId, currentStatus, salePrice = null) {
    try {
      const newStatus = !currentStatus;
      
      // 1. Update recipe table
      const updateData = { is_published: newStatus };
      if (salePrice !== null) {
        updateData.sale_price = Number(salePrice);
      }
      
      const { error: recipeError } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', recipeId);
      
      if (recipeError) throw recipeError;

      // 2. Sync with menu_items
      if (newStatus) {
        // Fetch fresh copy to ensure all fields are current
        const { data: recipe, error: fetchErr } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', recipeId)
          .single();

        if (fetchErr) throw fetchErr;

        if (recipe) {
          const menuItem = {
            id: recipeId, // Explicitly use recipe ID as PK for menu_items
            name: recipe.name,
            description: recipe.description || '',
            price: Number(recipe.sale_price || 0), // Mapping sale_price to price
            image_url: recipe.image_url || '',
            recipe_id: recipeId,
            menu_category_id: recipe.menu_category_id || null,
            active: true
          };
          
          const { error: upsertErr } = await supabase.from('menu_items').upsert([menuItem]);
          if (upsertErr) {
            console.error("❌ [menu_items Upsert Error]", upsertErr);
            throw upsertErr;
          }
        }
      } else {
        // Remove from menu_items if unpublished
        const { error: deleteErr } = await supabase.from('menu_items').delete().eq('id', recipeId);
        if (deleteErr) throw deleteErr;
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
