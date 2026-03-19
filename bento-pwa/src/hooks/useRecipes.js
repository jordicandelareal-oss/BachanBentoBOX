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
          unit:units!Unid_Id(name),
          kitchen_category:preparation_categories!preparation_category_Id(Name)
        `)
        .order('name')
        
      if (type) {
        recipesQuery = recipesQuery.eq('recipe_type', type)
      }

      const { data: recipesData, error: recipesError } = await recipesQuery
      if (recipesError) throw recipesError

      // Merge data (using cost_per_portion from recipes table)
      const merged = recipesData.map(recipe => ({
        ...recipe,
        unit_name: recipe.unit?.name || 'ud',
        preparation_category: recipe.kitchen_category?.Name || null,
        cost_per_portion: recipe.cost_per_portion || 0
      }))
      
      setRecipes(merged)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching recipes:', err)
    } finally {
      setLoading(false)
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
      // State is updated by fetchRecipes in the realtime listener
      return { success: true }
    } catch (err) {
      console.error("❌ [Supabase Delete Error]", err);
      return { success: false, error: err.message }
    }
  }

  return { recipes, loading, error, deleteRecipe, fetchRecipes }
}
