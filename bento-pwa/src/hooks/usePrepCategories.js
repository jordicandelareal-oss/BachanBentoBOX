import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function usePrepCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('preparation_categories')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching prep categories:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
