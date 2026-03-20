import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useCatalogSettings() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [prepCategories, setPrepCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [cats, subs, preps] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('subcategories').select('*').order('name'),
        supabase.from('preparation_categories').select('*').order('Name')
      ]);

      if (cats.error) throw cats.error;
      if (subs.error) throw subs.error;
      if (preps.error) throw preps.error;

      setCategories(cats.data || []);
      setSubcategories(subs.data || []);
      setPrepCategories(preps.data || []);
    } catch (err) {
      console.error('Error fetching catalog data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const catChannel = supabase.channel('cat-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
      .subscribe();

    const subChannel = supabase.channel('sub-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => fetchData())
      .subscribe();

    const prepChannel = supabase.channel('prep-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'preparation_categories' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(catChannel);
      supabase.removeChannel(subChannel);
      supabase.removeChannel(prepChannel);
    };
  }, [fetchData]);

  const addItem = async (table, item) => {
    const { error } = await supabase.from(table).insert([item]);
    if (error) console.error(`Error adding to ${table}:`, error);
    return { success: !error, error };
  };

  const updateItem = async (table, id, fields) => {
    const { error } = await supabase.from(table).update(fields).eq('id', id);
    if (error) console.error(`Error updating ${table}:`, error);
    return { success: !error, error };
  };

  const deleteItem = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) console.error(`Error deleting from ${table}:`, error);
    return { success: !error, error };
  };

  return { 
    categories, 
    subcategories, 
    prepCategories, 
    loading, 
    error, 
    addItem, 
    updateItem, 
    deleteItem, 
    refresh: fetchData 
  };
}
