import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRecipes(type = null) {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRecipes()
    
    const channel = supabase
      .channel('public:recipes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
        // Simple recharge on any recipe/cost update
        fetchRecipes() 
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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

      // Fetch costs from the view
      const recipeIds = recipesData.map(r => r.id)
      
      let costsData = []
      if (recipeIds.length > 0) {
        const { data, error: costsError } = await supabase
          .from('view_recipe_costs')
          .select('recipe_id, cost_per_portion')
          .in('recipe_id', recipeIds)
          
        if (costsError) {
          console.error('[Supabase] Error fetching costs view:', costsError)
          // Don't throw, let it fail gracefully so recipes still load
        } else {
          costsData = data || []
        }
      }

      // Merge data
      const merged = recipesData.map(recipe => ({
        ...recipe,
        unit_name: recipe.unit?.name || 'ud',
        preparation_category: recipe.kitchen_category?.Name || 'Complementos', // Fallback for UI filtering
        cost_per_portion: costsData.find(c => c.recipe_id === recipe.id)?.cost_per_portion || 0
      }))
      
      setRecipes(merged)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching recipes:', err)
    } finally {
      setLoading(false)
    }
  }

  return { recipes, loading, error, fetchRecipes }
}
