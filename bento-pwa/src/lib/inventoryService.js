import { supabase } from './supabaseClient';

/**
 * inventoryService.js - Phase 2 (Recursivo)
 * Handles stock deduction for orders and inventory-to-menu synchronization.
 */

export const deductStockForOrder = async (order) => {
  if (!order || !order.items || !Array.isArray(order.items)) {
    console.error("❌ [Inventory Service] Inválido o sin items.");
    return { success: false, error: "Pedido inválido" };
  }

  console.log(`📦 [Inventory Service] Procesando stock para pedido: ${order.id}`);

  try {
    for (const item of order.items) {
      if (!item.recipe_id && !item.ingredient_id) {
        console.warn(`⚠️ Item sin recipe_id o ingredient_id: ${item.name}. Saltando.`);
        continue;
      }

      // Calculate final units to deduct: order_quantity * pack_multiplier
      const baseMultiplier = Number(item.quantity || 1);
      const packMultiplier = Number(item.quantity_multiplier || 1);
      const finalMultiplier = baseMultiplier * packMultiplier;

      console.log(`🔍 [Stock] ${item.name}: Descontando ${finalMultiplier} unidades (${baseMultiplier} x ${packMultiplier})`);

      // Call the recursive PostgreSQL function
      const { error: rpcError } = await supabase.rpc('reduce_stock_recursive', {
        target_recipe_id: item.recipe_id,
        target_ingredient_id: item.ingredient_id,
        multiplier: finalMultiplier
      });

      if (rpcError) {
        console.error(`❌ Error en RPC reduce_stock_recursive para ${item.name}:`, rpcError);
        throw rpcError;
      }
    }

    console.log("✅ [Inventory Service] Stock descontado exitosamente.");
    return { success: true };
  } catch (err) {
    console.error("🔥 [Critical Inventory Error]:", err);
    return { success: false, error: err.message };
  }
};
