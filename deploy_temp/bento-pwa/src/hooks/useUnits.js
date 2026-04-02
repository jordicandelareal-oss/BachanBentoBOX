import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useUnits() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUnits() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('units')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        setUnits(data || []);
      } catch (err) {
        console.error('Error fetching units:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUnits();
  }, []);

  return { units, loading, error };
}
