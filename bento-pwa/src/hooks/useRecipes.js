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
      
      let query = supabase
        .from('view_recipe_costs_detailed')
        .select('*, preparation_category')
        .order('name')
        
      if (type) {
        query = query.eq('recipe_type', type)
      }

      const { data, error } = await query
      if (error) throw error
      
      setRecipes(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching recipes:', err)
    } finally {
      setLoading(false)
    }
  }

  return { recipes, loading, error, fetchRecipes }
}
