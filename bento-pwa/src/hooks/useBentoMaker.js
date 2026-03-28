import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

export const normalizeUnit = (unit) => {
  if (!unit) return 'g';
  const u = unit.toLowerCase().trim();
  if (['g', 'gr', 'gramo', 'gramos', 'grs'].includes(u)) return 'g';
  if (['kg', 'kilo', 'kilos'].includes(u)) return 'g';
  if (['l', 'litro', 'litros'].includes(u)) return 'ml';
  if (['ml', 'mls', 'ml.'].includes(u)) return 'ml';
  if (['ud', 'unid', 'unidad', 'unidades', 'rac', 'racion', 'uni', 'pz', 'pieza', 'piezas'].includes(u)) return 'ud';
  return u;
}

export function useBentoMaker(initialRecipe = null, recipeType = 'bento') {
  const [bentoName, setBentoName] = useState(initialRecipe?.name || '')
  const [salePrice, setSalePrice] = useState(initialRecipe?.sale_price || 0)
  const [portions, setPortions] = useState(initialRecipe?.portions || 1)
  const [unitId, setUnitId] = useState(initialRecipe?.Unid_Id || '')
  const [prepCategoryId, setPrepCategoryId] = useState(initialRecipe?.preparation_category_Id || '')
  const [menuCategoryId, setMenuCategoryId] = useState(initialRecipe?.menu_category_id || '')
  const [yieldScenario, setYieldScenario] = useState(initialRecipe?.yield_scenario || 'units')
  const [adjustmentPercent, setAdjustmentPercent] = useState(initialRecipe?.adjustment_percent || 0)
  const [netYield, setNetYield] = useState(initialRecipe?.net_yield || null)
  const [platosEstimados, setPlatosEstimados] = useState(initialRecipe?.platos_estimados || 0)
  const [imageUrl, setImageUrl] = useState(initialRecipe?.image_url || '')
  
  // Items can be ingredients or sub-recipes
  // { id, type: 'ingredient'|'recipe', name, costPerUnit, quantity, unit }
  const [items, setItems] = useState(initialRecipe?.items || [])

  // Calculate totals
  const totals = useMemo(() => {
    const totalCost = items.reduce((sum, item) => sum + (item.costPerUnit * (Number(item.quantity) || 0)), 0)
    
    // Calculate Gross Weight (only for items with weight units 'g' or 'ml')
    const totalGrossWeight = items.reduce((sum, item) => {
      if (item.unit === 'g' || item.unit === 'ml') return sum + (Number(item.quantity) || 0)
      return sum
    }, 0)

    let costPerPortion = 0
    let finalNetYield = portions

    if (yieldScenario === 'weight') {
      // Scenario A: Weight
      // WeightNeto = WeightBruto * (1 + adj/100)
      finalNetYield = totalGrossWeight * (1 + (adjustmentPercent / 100))
      costPerPortion = finalNetYield > 0 ? totalCost / (finalNetYield / 1000) : 0 // Cost per Kg/L
    } else {
      // Scenario B: Units
      costPerPortion = portions > 0 ? totalCost / portions : 0
    }

    const margin = salePrice > 0 ? ((salePrice - totalCost) / salePrice) * 100 : 0

    return { 
      totalCost, 
      costPerPortion, 
      margin, 
      totalGrossWeight,
      finalNetYield
    }
  }, [items, salePrice, portions, yieldScenario, adjustmentPercent])

  const addItem = (item) => {
    setItems(prev => [...prev, { ...item, _key: Math.random().toString(36).substring(7) }])
  }

  const updateItemQuantity = (key, qty) => {
    setItems(prev => prev.map(i => i._key === key ? { ...i, quantity: qty } : i))
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
        preparation_category_Id: prepCategoryId || null,
        menu_category_id: menuCategoryId || null,
        portions: portions,
        Unid_Id: unitId || null,
        yield_scenario: yieldScenario,
        adjustment_percent: adjustmentPercent,
        net_yield: yieldScenario === 'weight' ? totals.finalNetYield : null,
        cost_per_portion: totals.costPerPortion,
        platos_estimados: platosEstimados,
        image_url: imageUrl || null,
        ...extraData 
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
      quantity: Number(item.quantity) || 0
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
          id, name, purchase_price, net_cost_per_unit, cost_per_unit, unit_id, purchase_format,
          units:unit_id(name)
        ),
        child_recipe:recipes!recipe_ingredients_child_recipe_id_fkey(
          id, name, portions, "Unid_Id", unit:units!Unid_Id(name),
          yield_scenario, cost_per_portion
        )
      `)
      .eq('recipe_id', recipeId)

    if (error) throw error

    const loadedItems = data.map(ri => {
      const isIngredient = !!ri.ingredient
      const item = isIngredient ? ri.ingredient : ri.child_recipe
      
      let unitName = 'ud'
      let baseCost = 0
      let normalizedUnit = 'ud'

      if (isIngredient) {
        unitName = item.units?.name || 'g'
        normalizedUnit = normalizeUnit(unitName)
        baseCost = parseFloat(item.net_cost_per_unit || item.cost_per_unit || 0);
      } else {
        // LÓGICA DUAL PARA ELABORACIONES (HIJAS)
        // Si el escenario es peso, forzamos 'g' y dividimos el coste (que es por Kg) entre 1000
        if (item.yield_scenario === 'weight') {
          normalizedUnit = 'g'
          baseCost = (item.cost_per_portion || 0) / 1000
        } else {
          normalizedUnit = 'ud'
          baseCost = item.cost_per_portion || 0
        }
      }

      return {
        _key: Math.random().toString(36).substring(7),
        type: isIngredient ? 'ingredient' : 'recipe',
        id: item.id,
        name: item.name,
        costPerUnit: baseCost,
        unit: normalizedUnit,
        quantity: ri.quantity
      }
    })
    setItems(loadedItems)
    
    // Set scenario and adjustments from initialRecipe
    if (initialRecipe) {
      setYieldScenario(initialRecipe.yield_scenario || 'units');
      setAdjustmentPercent(initialRecipe.adjustment_percent || 0);
      setNetYield(initialRecipe.net_yield || null);
      setPlatosEstimados(initialRecipe.platos_estimados || 0);
      setImageUrl(initialRecipe.image_url || '');
    }
  }

  return {
    bentoName, setBentoName,
    salePrice, setSalePrice,
    portions, setPortions,
    unitId, setUnitId,
    prepCategoryId, setPrepCategoryId,
    menuCategoryId, setMenuCategoryId,
    items, addItem, updateItemQuantity, removeItem,
    totals,
    yieldScenario, setYieldScenario,
    adjustmentPercent, setAdjustmentPercent,
    netYield, setNetYield,
    platosEstimados, setPlatosEstimados,
    imageUrl, setImageUrl,
    saveBento,
    loadRecipeItems,
    setItems
  }
}
