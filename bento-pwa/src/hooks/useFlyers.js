import { useState, useEffect, useCallback } from 'react';
import { 
  getFlyerTemplates, 
  saveFlyerTemplate, 
  deleteFlyerTemplate
} from '../lib/flyerService';
import { supabase } from '../lib/supabaseClient';

export function useFlyers() {
  const [templates, setTemplates] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [flyersRes, menuRes, catRes] = await Promise.all([
        getFlyerTemplates(),
        supabase
          .from('menu_items')
          .select('*')
          .eq('active', true)
          .order('name', { ascending: true }),
        supabase
          .from('menu_categories')
          .select('*')
          .order('name', { ascending: true })
      ]);

      if (flyersRes.data) {
        setTemplates(flyersRes.data);
      }

      if (menuRes.data) {
        setMenuItems(menuRes.data);
      }

      if (catRes.data) {
        setCategories(catRes.data);
      }
    } catch (err) {
      console.error('Error in useFlyers loadData:', err);
      setError(err.message || 'Error cargando plantillas o menú');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveTemplate = async (templateData) => {
    const res = await saveFlyerTemplate(templateData);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const removeTemplate = async (id) => {
    const res = await deleteFlyerTemplate(id);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  return {
    templates,
    menuItems,
    categories,
    loading,
    error,
    refresh: loadData,
    saveTemplate,
    removeTemplate
  };
}
