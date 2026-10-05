import { useState, useEffect, useCallback } from 'react';
import { 
  getFlyerTemplates, 
  saveFlyerTemplate, 
  deleteFlyerTemplate,
  saveDishDescriptionToTPV,
  getSavedFlyerHeaderSettings,
  saveFlyerHeaderSettings,
  resetFlyerHeaderSettings
} from '../lib/flyerService';
import { supabase } from '../lib/supabaseClient';

export function useFlyers() {
  const [templates, setTemplates] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [headerSettings, setHeaderSettings] = useState(() => getSavedFlyerHeaderSettings());
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
          .select(`
            id, name, description, price, image_url, recipe_id, menu_category_id,
            recipe:recipes (
              id, name, recipe_type, notes,
              recipe_ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey (
                id, quantity,
                ingredient:ingredients (id, name),
                child:recipes!recipe_ingredients_child_recipe_id_fkey (id, name)
              )
            )
          `)
          .eq('active', true)
          .order('name', { ascending: true }),
        supabase
          .from('menu_categories')
          .select('*')
          .order('name', { ascending: true })
      ]);

      if (flyersRes.data) {
        setTemplates(flyersRes.data);
        const remoteHeaders = flyersRes.data.find(t => t.type === 'header_settings');
        if (remoteHeaders?.content) {
          setHeaderSettings(remoteHeaders.content);
        }
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

  const saveDishDescription = async (menuItemId, description) => {
    const res = await saveDishDescriptionToTPV(menuItemId, description);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const saveHeaders = async (headerData) => {
    const res = await saveFlyerHeaderSettings(headerData);
    if (res.success) {
      setHeaderSettings(res.data);
    }
    return res;
  };

  const resetHeaders = () => {
    const defaults = resetFlyerHeaderSettings();
    setHeaderSettings(defaults);
    return defaults;
  };

  return {
    templates,
    menuItems,
    categories,
    headerSettings,
    loading,
    error,
    refresh: loadData,
    saveTemplate,
    removeTemplate,
    saveDishDescription,
    saveHeaders,
    resetHeaders,
    getSavedFlyerHeaderSettings
  };
}
