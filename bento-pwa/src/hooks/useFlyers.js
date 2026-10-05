import { useState, useEffect, useCallback } from 'react';
import { 
  getFlyerTemplates, 
  saveFlyerTemplate, 
  deleteFlyerTemplate, 
  DEFAULT_WEEKLY_MENU, 
  DEFAULT_PRODUCT_FLYER 
} from '../lib/flyerService';
import { supabase } from '../lib/supabaseClient';

export function useFlyers() {
  const [templates, setTemplates] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [flyersRes, recipesRes] = await Promise.all([
        getFlyerTemplates(),
        supabase
          .from('recipes')
          .select('id, name, sale_price, image_url, recipe_type, cost_per_portion')
          .order('name', { ascending: true })
      ]);

      if (flyersRes.data) {
        setTemplates(flyersRes.data);
      }

      if (recipesRes.data) {
        setRecipes(recipesRes.data);
      }
    } catch (err) {
      console.error('Error in useFlyers loadData:', err);
      setError(err.message || 'Error cargando plantillas');
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
    recipes,
    loading,
    error,
    refresh: loadData,
    saveTemplate,
    removeTemplate
  };
}
