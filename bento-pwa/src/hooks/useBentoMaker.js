import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

export const normalizeUnit = (unit) => {
  if (!unit) return 'g';
  const u = unit.toLowerCase().trim();
  if (['kg', 'kilo', 'kilos'].includes(u)) return 'g';
  if (['l', 'litro', 'litros'].includes(u)) return 'ml';
  if (['ud', 'unid', 'unidad', 'unidades', 'rac', 'racion', 'uni'].includes(u)) return 'ud';
  return unit;
}

export function useBentoMaker(initialRecipe = null, recipeType = 'bento') {
  const [bentoName, setBentoName] = useState(initialRecipe?.name || '')
  const [salePrice, setSalePrice] = useState(initialRecipe?.sale_price || 0)
  const [portions, setPortions] = useState(initialRecipe?.portions || 1)
  
  // Items can be ingredients or sub-recipes
  // { id, type: 'ingredient'|'recipe', name, costPerUnit, quantity, unit }
  const [items, setItems] = useState(initialRecipe?.items || [])

  // Calculate totals
  const totals = useMemo(() => {
    const totalCost = items.reduce((sum, item) => sum + (item.costPerUnit * item.quantity), 0)
    const costPerPortion = portions > 0 ? totalCost / portions : 0
    const margin = salePrice > 0 ? ((salePrice - totalCost) / salePrice) * 100 : 0

    return { totalCost, costPerPortion, margin }
  }, [items, salePrice, portions])

  const addItem = (item) => {
    setItems(prev => [...prev, { ...item, _key: Math.random().toString(36).substring(7) }])
  }

  const updateItemQuantity = (key, qty) => {
    setItems(prev => prev.map(i => i._key === key ? { ...i, quantity: Number(qty) } : i))
  }

  const removeItem = (key) => {
    setItems(prev => prev.filter(i => i._key !== key))
  }

  const saveBento = async (extraData = {}) => {
    if (!bentoName) throw new Error("Debes darle un nombre")
    
    // 1. Upsert Recipe
    const { data: recipeData, error: recipeErr } = await supabase
      .from('recipes')
      .upsert({ 
        name: bentoName, 
        recipe_type: recipeType,
        sale_price: recipeType === 'elaboracion' ? 0 : salePrice,
        portions: portions,
        ...extraData // Pass preparation_category here
      }, { onConflict: 'name' })
      .select()
      .single()

    if (recipeErr) throw recipeErr

    const recipeId = recipeData.id

    // 2. Prepare items for recipe_ingredients
    const riData = items.map(item => ({
      recipe_id: recipeId,
      ingredient_id: item.type === 'ingredient' ? item.id : null,
      child_recipe_id: item.type === 'recipe' ? item.id : null,
      quantity: item.quantity
    }))

    // 3. Clear old items and insert new ones
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
    const { error: riErr } = await supabase.from('recipe_ingredients').insert(riData)

    if (riErr) throw riErr

    return recipeData
  }

  const loadRecipeItems = async (recipeId) => {
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .select(`
        quantity,
        ingredient:ingredients(
          id, name, purchase_price, unit_id,
          units:unit_id(name)
        ),
        child_recipe:recipes!recipe_ingredients_child_recipe_id_fkey(id, name, portions)
      `)
      .eq('recipe_id', recipeId)

    if (error) throw error

    const loadedItems = data.map(ri => {
      const isIngredient = !!ri.ingredient
      const item = isIngredient ? ri.ingredient : ri.child_recipe
      return {
        _key: Math.random().toString(36).substring(7),
        type: isIngredient ? 'ingredient' : 'recipe',
        id: item.id,
        name: item.name,
        costPerUnit: isIngredient ? (item.purchase_price / 1000) : 0, // Simplified for now
        unit: normalizeUnit(isIngredient ? (item.units?.name || 'g') : 'rac'),
        quantity: ri.quantity
      }
    })
    setItems(loadedItems)
  }

  return {
    bentoName, setBentoName,
    salePrice, setSalePrice,
    portions, setPortions,
    items, addItem, updateItemQuantity, removeItem,
    totals,
    saveBento,
    loadRecipeItems,
    setItems
  }
}
