import React, { useState } from 'react';
import { ChefHat, Plus, TrendingUp, TrendingDown, Target, LayoutGrid, Trash2, Camera } from 'lucide-react';
import { useRecipes } from '../hooks/useRecipes';
import BentoMaker from '../components/BentoMaker/BentoMaker';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import Lightbox from '../components/Common/Lightbox';
import '../styles/Common.css';

export default function BentoPage() {
  const { recipes: bentos, loading, deleteRecipe, fetchRecipes } = useRecipes('bento');
  const [editingBento, setEditingBento] = useState(false); // false (list), true (new), or object (edit)
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [lightbox, setLightbox] = useState({ isOpen: false, imageUrl: '', title: '' });

  const handleCreateNew = () => {
    setEditingBento(true);
  };

  const handleEdit = (bento) => {
    setEditingBento(bento);
  };

  const handleCloseEditor = () => {
    setEditingBento(false);
    fetchRecipes();
  };

  if (editingBento !== false) {
    return (
      <BentoMaker 
        recipe={typeof editingBento === 'object' ? editingBento : null} 
        onClose={handleCloseEditor} 
      />
    );
  }
  
  const handleDelete = async () => {
    if (!confirmDelete) return;
    const result = await deleteRecipe(confirmDelete);
    if (!result.success) {
      alert('Error al eliminar: ' + result.error);
    }
    setConfirmDelete(null);
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <ChefHat size={24} />
            </span>
            Bento Box
          </h1>
          <p className="page-subtitle">Gestiona tus productos finales y analiza márgenes</p>
        </div>
        <button className="btn-icon-main" onClick={handleCreateNew}>
          <Plus size={24} />
        </button>
      </div>

      {loading ? (
        <div className="card-grid">
          {[1, 2].map(i => (
            <div key={i} className="premium-card animate-pulse" style={{ height: '100px', opacity: 0.5 }}></div>
          ))}
        </div>
      ) : (
        <div className="card-grid">
          {bentos.map(bento => {
            const cost = typeof bento.cost_per_portion === 'number' ? bento.cost_per_portion : 0;
            const salePrice = bento.sale_price || 0;
            const margin = salePrice > 0 ? ((salePrice - cost) / salePrice) * 100 : 0;
            const isGoodMargin = margin >= 70;

            return (
              <div key={bento.id} className="premium-card" onClick={() => handleEdit(bento)}>
                <div className="ingredient-info">
                  <div className="card-icon-wrapper" style={{ width: '56px', height: '56px' }}>
                    <Target size={24} className="text-sky-500" />
                  </div>
                  <div>
                    <h3 className="card-title text-lg">{bento.name}</h3>
                    <div className="flex gap-4 mt-1">
                      <p className="card-meta">PVP: {salePrice.toFixed(2)}€</p>
                      <p className="card-meta">Coste: {cost.toFixed(2)}€</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right flex flex-col items-end">
                    <div className="card-meta mb-1 uppercase tracking-widest text-[9px]">Margen</div>
                    <div className="flex items-center gap-2">
                       {isGoodMargin ? (
                         <TrendingUp size={16} className="text-emerald-500" />
                       ) : (
                         <TrendingDown size={16} className="text-amber-500" />
                       )}
                       <div className={`price-display text-xl ${isGoodMargin ? 'text-emerald-600' : 'text-amber-600'}`}>
                         {margin.toFixed(1)}%
                       </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      className="delete-btn-subtle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(bento.id);
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                    {bento.image_url && (
                      <button 
                        className="p-2 text-sky-500 hover:bg-sky-50 rounded-full transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightbox({ isOpen: true, imageUrl: bento.image_url, title: bento.name });
                        }}
                      >
                        <Camera size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {bentos.length === 0 && (
            <div className="text-center py-12" style={{ textAlign: 'center', padding: '48px 0' }}>
              <LayoutGrid className="mx-auto text-slate-200 mb-4" size={48} style={{ margin: '0 auto 16px', color: '#e2e8f0' }} />
              <p style={{ color: '#94a3b8' }}>Aún no has guardado ningún Bento.</p>
            </div>
          )}
        </div>
      )}
      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar Bento?"
        message="Esta acción no se puede deshacer y borrará permanentemente este producto del catálogo."
      />
      <Lightbox 
        isOpen={lightbox.isOpen}
        imageUrl={lightbox.imageUrl}
        title={lightbox.title}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
