import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const LOCAL_STORAGE_KEY = 'bachan_tpv_categories_v2';

export const INITIAL_DEFAULT_CATEGORIES = [
  { id: 'cat_bentos', name: 'Bentos', sort_order: 1, icon_name: 'Utensils', is_active: true },
  { id: 'cat_extras', name: 'Extras', sort_order: 2, icon_name: 'Sparkles', is_active: true },
  { id: 'cat_bebidas', name: 'Bebidas', sort_order: 3, icon_name: 'Coffee', is_active: true },
  { id: 'cat_sushi', name: 'Sushi', sort_order: 4, icon_name: 'Utensils', is_active: true },
  { id: 'cat_ebentos', name: 'E-Bentos', sort_order: 5, icon_name: 'ShoppingBag', is_active: true },
  { id: 'cat_arroz', name: 'Arroz', sort_order: 6, icon_name: 'Utensils', is_active: true }
];

function getStoredCategories() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      }
    }
  } catch (e) {
    console.warn('Error reading local categories:', e);
  }
  return INITIAL_DEFAULT_CATEGORIES;
}

function saveStoredCategories(cats) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cats));
  } catch (e) {
    console.warn('Error saving local categories:', e);
  }
}

const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export function useMenuCategories() {
  const [categories, setCategories] = useState(() => getStoredCategories());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('menu_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (fetchError) {
        console.warn('Supabase menu_categories fetch warning:', fetchError);
        // Retain local categories
        return;
      }

      if (data && data.length > 0) {
        const sorted = data.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
        setCategories(sorted);
        saveStoredCategories(sorted);
      } else if (data && data.length === 0) {
        // Table is empty in Supabase, seed with default categories
        const stored = getStoredCategories();
        setCategories(stored);
        try {
          const toInsert = stored.map((c, i) => ({
            name: c.name,
            sort_order: i + 1,
            icon_name: c.icon_name || 'BookOpen',
            is_active: true
          }));
          const { data: inserted } = await supabase.from('menu_categories').insert(toInsert).select();
          if (inserted && inserted.length > 0) {
            setCategories(inserted);
            saveStoredCategories(inserted);
          }
        } catch (seedErr) {
          console.warn('Could not auto-seed menu_categories in Supabase:', seedErr);
        }
      }
      setError(null);
    } catch (err) {
      console.warn('Error fetching menu categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();

    const channel = supabase
      .channel('public:menu_categories_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCategories]);

  async function addCategory(name, icon_name = 'BookOpen') {
    const trimmed = (name || '').trim();
    if (!trimmed) return { success: false, error: 'Nombre requerido' };

    const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => Number(c.sort_order) || 0)) + 1 : 1;
    const localId = `cat_${Date.now()}`;
    const newCategory = {
      id: localId,
      name: trimmed,
      icon_name,
      sort_order: nextOrder,
      is_active: true,
      created_at: new Date().toISOString()
    };

    // 1. Optimistic Update
    const updated = [...categories, newCategory].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setCategories(updated);
    saveStoredCategories(updated);

    // 2. Supabase Insert
    try {
      const { data, error: insertError } = await supabase
        .from('menu_categories')
        .insert([{ name: trimmed, icon_name, sort_order: nextOrder, is_active: true }])
        .select()
        .single();

      if (!insertError && data) {
        const finalCats = updated.map(c => c.id === localId ? data : c);
        setCategories(finalCats);
        saveStoredCategories(finalCats);
        return { success: true, data };
      }
    } catch (err) {
      console.warn('Supabase addCategory fallback to local:', err);
    }

    return { success: true, data: newCategory };
  }

  async function updateCategory(id, updates) {
    // 1. Optimistic Update
    const updated = categories.map(c => c.id === id ? { ...c, ...updates } : c);
    setCategories(updated);
    saveStoredCategories(updated);

    // 2. Supabase Update
    try {
      if (isUuid(id)) {
        await supabase
          .from('menu_categories')
          .update(updates)
          .eq('id', id);
      } else {
        const target = categories.find(c => c.id === id);
        if (target && target.name) {
          await supabase
            .from('menu_categories')
            .update(updates)
            .ilike('name', target.name);
        }
      }
    } catch (err) {
      console.warn('Supabase updateCategory exception:', err);
    }

    return { success: true };
  }

  async function deleteCategory(id) {
    // 1. Optimistic Update
    const updated = categories
      .filter(c => c.id !== id)
      .map((c, idx) => ({ ...c, sort_order: idx + 1 }));
    
    setCategories(updated);
    saveStoredCategories(updated);

    // 2. Supabase Delete
    try {
      if (isUuid(id)) {
        await supabase
          .from('menu_categories')
          .delete()
          .eq('id', id);
      } else {
        const target = categories.find(c => c.id === id);
        if (target && target.name) {
          await supabase
            .from('menu_categories')
            .delete()
            .ilike('name', target.name);
        }
      }
    } catch (err) {
      console.warn('Supabase deleteCategory exception:', err);
    }

    return { success: true };
  }

  async function reorderCategories(newOrderList) {
    if (!Array.isArray(newOrderList) || newOrderList.length === 0) return { success: false };

    // 1. Instant Optimistic Reorder
    const updatedList = newOrderList.map((cat, index) => ({
      ...cat,
      sort_order: index + 1
    }));

    setCategories(updatedList);
    saveStoredCategories(updatedList);

    // 2. Supabase Batch Order Update
    try {
      for (const cat of updatedList) {
        if (isUuid(cat.id)) {
          await supabase
            .from('menu_categories')
            .update({ sort_order: cat.sort_order })
            .eq('id', cat.id);
        } else if (cat.name) {
          await supabase
            .from('menu_categories')
            .update({ sort_order: cat.sort_order })
            .ilike('name', cat.name);
        }
      }
    } catch (err) {
      console.warn('Supabase reorderCategories warning:', err);
    }

    return { success: true, data: updatedList };
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
