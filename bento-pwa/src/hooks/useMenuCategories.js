import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useMenuCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
    
    // Realtime channel
    const channel = supabase
      .channel('public:menu_categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, () => fetchCategories())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      setCategories(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching menu categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addCategory(name, icon_name = 'BookOpen') {
    try {
      const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order || 0)) + 1 : 1;
      const { data, error } = await supabase
        .from('menu_categories')
        .insert([{ name, icon_name, sort_order: nextOrder, is_active: true }])
        .select()
        .single();
        
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error adding category:', err);
      return { success: false, error: err.message };
    }
  }

  async function updateCategory(id, updates) {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .update(updates)
        .eq('id', id);
        
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error updating category:', err);
      return { success: false, error: err.message };
    }
  }

  async function deleteCategory(id) {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error deleting category:', err);
      return { success: false, error: err.message };
    }
  }

  async function reorderCategories(newOrderList) {
    // newOrderList is an array of categories in correct order
    try {
      const updates = newOrderList.map((cat, index) => ({
        id: cat.id,
        name: cat.name,
        sort_order: index + 1,
        icon_name: cat.icon_name,
        is_active: cat.is_active
      }));
      
      const { error } = await supabase.from('menu_categories').upsert(updates);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error reordering categories:', err);
      return { success: false, error: err.message };
    }
  }

  return { 
    categories, 
    loading, 
    error, 
    fetchCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    reorderCategories 
  };
}
