import { useState, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export const normalizeUnit = (unit) => {
  if (!unit) return 'g';
  const u = unit.toLowerCase().trim();
  if (['g', 'gr', 'gramo', 'gramos', 'grs', 'peso/volumen (kg/l)', 'peso (kg/l)'].includes(u)) return 'g';
  if (['kg', 'kilo', 'kilos'].includes(u)) return 'g';
  if (['l', 'litro', 'litros'].includes(u)) return 'ml';
  if (['ml', 'mls', 'ml.'].includes(u)) return 'ml';
  if (['ud', 'unid', 'unidad', 'unidades', 'rac', 'racion', 'uni', 'pz', 'pieza', 'piezas', 'unidades (ud)'].includes(u)) return 'ud';
  return u;
}

const BENTO_CATEGORY_ID = '0c43bac9-471b-4834-952c-81a822965df3';

export default function useBentoMaker(initialRecipe = null, recipeType = 'bento') {
  const [bentoName, setBentoName] = useState(initialRecipe?.name || '')
  const [salePrice, setSalePrice] = useState(initialRecipe?.sale_price || 0)
  const [portions, setPortions] = useState(initialRecipe?.portions || 1)
  const [unitId, setUnitId] = useState(initialRecipe?.Unid_Id || '')
  // Casing fix: using lowercase 'id' for the state as well for consistency
  const [prepCategoryId, setPrepCategoryId] = useState(initialRecipe?.preparation_category_Id || initialRecipe?.preparation_category_id || '')
  const [menuCategoryId, setMenuCategoryId] = useState(initialRecipe?.menu_category_id || '')
  const [yieldScenario, setYieldScenario] = useState(initialRecipe?.yield_scenario || 'units')
  const [adjustmentPercent, setAdjustmentPercent] = useState(initialRecipe?.adjustment_percent || 0)
  const [netYield, setNetYield] = useState(initialRecipe?.net_yield || null)
  const [platosEstimados, setPlatosEstimados] = useState(initialRecipe?.platos_estimados || 0)
  const [imageUrl, setImageUrl] = useState(initialRecipe?.image_url || '')
  
  // Items can be ingredients or sub-recipes
  // { id, type: 'ingredient'|'recipe', name, costPerUnit, quantity, unit }
  const [items, setItems] = useState(initialRecipe?.items || [])
  const [initialCost, setInitialCost] = useState(initialRecipe?.cost_per_portion || 0)

  // Calculate totals
  const totals = useMemo(() => {
    const totalCost = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.costPerUnit) || 0;
      
      // MASTER RULE: If unit is weight (g/ml) → divide by 1000. Works for BOTH ingredients AND weight-based sub-recipes.
      const normalized = normalizeUnit(item.unit);
      const isWeight = normalized === 'g' || normalized === 'ml';

      if (isWeight) {
        // Weight item (ingredient OR sub-recipe): (qty / 1000) * Price_Per_KG
        return sum + ((cost / 1000) * qty);
      }
      
      // Unit-based (ingredient or sub-recipe): qty * Price_Per_Unit
      return sum + (cost * qty);
    }, 0)
    
    // Calculate Gross Weight (only for items with weight units 'g' or 'ml')
    const totalGrossWeight = items.reduce((sum, item) => {
      const norm = normalizeUnit(item.unit);
      if (norm === 'g' || norm === 'ml') return sum + (Number(item.quantity) || 0);
      return sum;
    }, 0)

    let costPerPortion = 0
    let finalNetYield = portions

    if (yieldScenario === 'weight') {
      // Scenario A: Weight
      // WeightNeto = WeightBruto * (1 + adj/100)
      finalNetYield = totalGrossWeight * (1 + (adjustmentPercent / 100))
      // Cost per Kg/L: (Total Cost / Grams) * 1000
      costPerPortion = finalNetYield > 0 ? (totalCost / finalNetYield) * 1000 : 0 
    } else {
      // Scenario B: Units
      // Cost per Unit: Total Cost / Portions
      costPerPortion = (Number(portions) > 0) ? (totalCost / Number(portions)) : totalCost
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
    
    // 1. Prepare data and force Bento Category ID
    const dataToSave = { 
      name: bentoName, 
      recipe_type: recipeType,
      sale_price: recipeType === 'elaboracion' ? 0 : salePrice,
      // FIX DEFINITIVO (I MAYÚSCULA): Sincronización obligatoria con la DB (Línea 109)
      "preparation_category_Id": recipeType === 'bento' ? BENTO_CATEGORY_ID : (prepCategoryId || null),
      portions: portions,
      "Unid_Id": unitId || null,
      yield_scenario: yieldScenario,
      adjustment_percent: adjustmentPercent,
      net_yield: yieldScenario === 'weight' ? totals.finalNetYield : null,
      cost_per_portion: totals.costPerPortion,
      platos_estimados: platosEstimados,
      image_url: imageUrl || null
    };

    // Merge extraData while explicitly protecting the case-sensitive category ID
    const finalData = { ...dataToSave, ...extraData };
    
    // Safety check: ensure no lowercase version is present
    delete finalData.preparation_category_id;

    console.log('DATOS A GUARDAR (CASE SENSITIVE):', finalData);

    const { data: recipeData, error: recipeErr } = await supabase
      .from('recipes')
      .upsert(finalData, { onConflict: 'name' })
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

    // Update initial cost after save for UI consistency
    setInitialCost(totals.costPerPortion)

    // 4. Sync with menu_items if it is already published
    if (recipeData.is_published) {
      // Find all existing menu_items for this recipe (base + packs)
      const { data: existingMenuItems } = await supabase
        .from('menu_items')
        .select('id, quantity_multiplier')
        .eq('recipe_id', recipeId);

      if (existingMenuItems && existingMenuItems.length > 0) {
        // Update ALL variants (base + packs) with fresh data
        for (const existing of existingMenuItems) {
          const mult = existing.quantity_multiplier || 1;
          await supabase.from('menu_items').update({
            name: mult > 1 ? `${recipeData.name} (${mult} uds)` : recipeData.name,
            description: recipeData.description || '',
            price: Number(recipeData.sale_price || 0) * mult,
            cost: totals.costPerPortion * mult,
            image_url: recipeData.image_url || '',
            menu_category_id: recipeData.menu_category_id || null,
            active: true
          }).eq('id', existing.id);
        }
      } else {
        // No existing items, create base item
        const menuItem = {
          name: recipeData.name,
          description: recipeData.description || '',
          price: Number(recipeData.sale_price || 0),
          cost: totals.costPerPortion,
          image_url: recipeData.image_url || '',
          recipe_id: recipeId,
          menu_category_id: recipeData.menu_category_id || null,
          quantity_multiplier: 1,
          active: true
        };
        await supabase.from('menu_items').insert([menuItem]);
      }
    }

    return recipeData
  }

  const loadRecipeItems = useCallback(async (recipeId) => {
    const { data, error } = await supabase
      .from('recipe_ingredients')
      .select(`
        quantity,
        ingredient:ingredients(
          id, name, purchase_price, net_cost_per_unit, cost_per_unit, unit_id, purchase_format,
          waste_percentage,
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
        // SOURCE OF TRUTH: cost_per_unit
        baseCost = parseFloat(item.cost_per_unit || 0);
      } else {
        // Sub-recipe: Respect the recipe's own yield_scenario
        // If weight-based: cost_per_portion is stored as €/kg → treat like weight ingredient (triggers /1000)
        // If unit-based: cost_per_portion is €/ud → direct multiplication
        if (item.yield_scenario === 'weight') {
          normalizedUnit = 'g';
        } else {
          normalizedUnit = 'ud';
        }
        baseCost = parseFloat(item.cost_per_portion || 0)
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
      // Ensure we store the cost from the database for comparison
      setInitialCost(initialRecipe.cost_per_portion || 0)
    }
  }, [initialRecipe, setYieldScenario, setAdjustmentPercent, setNetYield, setPlatosEstimados, setImageUrl, setInitialCost]);


  return {
    bentoName, setBentoName,
    salePrice, setSalePrice,
    portions, setPortions,
    unitId, setUnitId,
    prepCategoryId, setPrepCategoryId,
    menuCategoryId, setMenuCategoryId,
    items, addItem, updateItemQuantity, removeItem,
    totals,
    initialCost,
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

