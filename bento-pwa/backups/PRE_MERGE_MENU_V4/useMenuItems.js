import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenuItems();

    const channel = supabase
      .channel('public:menu_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchMenuItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMenuItems() {
    try {
      setLoading(true);
      setError(null);
      const { data, error: supError } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');
        
      if (supError) throw supError;
      setMenuItems(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching menu_items:', err);
    } finally {
      setLoading(false);
    }
  }

  // Update a menu item (e.g. change category)
  async function updateMenuItem(id, updates) {
    try {
      const { error: supError } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id);
      if (supError) throw supError;
      return { success: true };
    } catch (err) {
      console.error('Error updating menu item:', err);
      return { success: false, error: err.message };
    }
  }

  // Delete a menu item (we should also togglePublish in recipes/ingredients)
  async function deleteMenuItem(id, sourceId = null) {
    try {
      const { error: supError } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (supError) throw supError;
      
      // If we have a sourceId, we set is_published to false in the corresponding table
      if (sourceId) {
        await supabase.from('recipes').update({ is_published: false }).eq('id', sourceId);
        await supabase.from('ingredients').update({ is_published: false }).eq('id', sourceId);
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting menu item:', err);
      return { success: false, error: err.message };
    }
  }

  return { menuItems, loading, error, fetchMenuItems, updateMenuItem, deleteMenuItem };
}
