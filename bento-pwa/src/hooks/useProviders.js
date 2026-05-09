import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useProviders() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  async function fetchProviders() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          ingredients:ingredients(count)
        `)
        .order('name')
      
      if (error) throw error
      
      // Map counts for easier consumption in UI
      const mapped = (data || []).map(p => ({
        ...p,
        ingredients_count: p.ingredients?.[0]?.count || 0
      }))
      
      setProviders(mapped)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addProvider(fields) {
    try {
      const { data, error } = await supabase
        .from('providers')
        .insert([fields])
        .select()
        .single()
      
      if (error) throw error
      setProviders(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function fetchProviderDetails(providerId) {
    try {
      setLoading(true)
      const { data: provider, error: pError } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .single()
      
      if (pError) throw pError

      const { data: ingredients, error: iError } = await supabase
        .from('ingredients')
        .select('id, name, purchase_price, net_cost_per_unit, waste_percentage, calculation_type')
        .eq('provider_id', providerId)
        .order('name')
      
      if (iError) throw iError

      return { success: true, provider, ingredients }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  async function updateProvider(providerId, fields) {
    try {
      const { data, error } = await supabase
        .from('providers')
        .update(fields)
        .eq('id', providerId)
        .select()
        .single()
      
      if (error) throw error
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, ...data } : p))
      return { success: true, data }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function deleteProvider(providerId) {
    try {
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', providerId)
      
      if (error) throw error
      setProviders(prev => prev.filter(p => p.id !== providerId))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  return { providers, loading, error, fetchProviders, addProvider, updateProvider, fetchProviderDetails, deleteProvider }
}
