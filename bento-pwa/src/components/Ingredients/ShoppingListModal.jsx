import React, { useState } from 'react';
import { X, ShoppingCart, MessageCircle, AlertTriangle, CheckCircle2, Copy, Package, Trash2, ClipboardCheck, Truck } from 'lucide-react';

export default function ShoppingListModal({ selectedItems, ingredients, providers, onClose, onClearSelection }) {
  const [copiedId, setCopiedId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  
  // state for quantities: { [ingredientId]: quantity }
  const [quantities, setQuantities] = useState(
    selectedItems.reduce((acc, id) => ({ ...acc, [id]: 1 }), {})
  );

  const updateQty = (id, val) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, parseFloat(val) || 0) }));
  };

  // Group selected ingredients by provider
  const grouped = selectedItems.reduce((acc, id) => {
    const ing = ingredients.find(i => i.id === id);
    if (!ing) return acc;
    const providerId = ing.provider_id || 'unknown';
    if (!acc[providerId]) acc[providerId] = { 
      provider: providers.find(p => p.id === providerId) || { name: 'Sin Proveedor', min_order: 0 },
      items: [] 
    };
    acc[providerId].items.push(ing);
    return acc;
  }, {});

  const copyToWhatsApp = (providerId, pGroup) => {
    const { provider, items } = pGroup;
    let text = `👨‍🍳 *PEDIDO BACHAN - ${provider.name.toUpperCase()}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    let total = 0;
    items.forEach(ing => {
      const qty = quantities[ing.id] || 0;
      if (qty <= 0) return;
      const unit = ing.calculation_type === 'peso' ? (qty >= 1 ? 'kg' : 'g') : 'ud';
      const displayQty = ing.calculation_type === 'peso' && qty < 1 ? qty * 1000 : qty;
      
      text += `• *${displayQty}${unit}* ${ing.name}\n`;
      total += qty * (Number(ing.purchase_price) || 0);
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Total aprox:* ${total.toFixed(2)}€`;
    
    // Si hay un número de teléfono guardado, enviarlo directamente por WhatsApp API
    if (provider.phone) {
      const cleanPhone = provider.phone.replace(/[^0-9+]/g, '');
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
    } else {
      // Fallback: solo copiar al portapapeles
      navigator.clipboard.writeText(text);
    }

    setCopiedId(providerId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMercadonaOrder = (group) => {
    const itemsText = group.items
      .filter(ing => (quantities[ing.id] || 0) > 0)
      .map(ing => {
        const qty = quantities[ing.id] || 0;
        const unit = ing.calculation_type === 'peso' ? (qty >= 1 ? 'kg' : 'g') : 'ud';
        const displayQty = ing.calculation_type === 'peso' && qty < 1 ? qty * 1000 : qty;
        return `${displayQty}${unit} ${ing.name}`;
      })
      .join('\n');

    if (!itemsText) {
      alert("⚠️ No hay productos seleccionados para copiar.");
      return;
    }

    // Copiar al portapapeles
    navigator.clipboard.writeText(itemsText);
    
    // Abrir la cesta de Mercadona
    window.open('https://tienda.mercadona.es/cart/', '_blank');
    
    // Feedback visual temporal
    setSyncingId(group.provider.id);
    setTimeout(() => setSyncingId(null), 3000);
  };

  return (
    <div className="shopping-drawer-overlay">
      <div className="shopping-drawer-content">
        
        {/* Header */}
        <div className="shopping-drawer-header">
          <div className="shopping-drawer-title-group">
            <div className="shopping-drawer-icon">
              <ShoppingCart size={28} color="white" />
            </div>
            <div>
              <h2 className="shopping-drawer-title">Lista de Pedidos</h2>
              <div className="shopping-drawer-subtitle">
                <span className="shopping-drawer-pulse" />
                <p>{selectedItems.length} Ingredientes seleccionados</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="shopping-drawer-close">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="shopping-drawer-body">
          {Object.entries(grouped).map(([pId, group], idx) => {
            const total = group.items.reduce((sum, ing) => sum + (quantities[ing.id] || 0) * (Number(ing.purchase_price) || 0), 0);
            const isBelowMin = group.provider.min_order > 0 && total < group.provider.min_order;
            const isCopied = copiedId === pId;

            return (
              <div key={idx} className="provider-group-card">
                <div className="provider-group-inner">
                  <div className="provider-group-header">
                    <div className="provider-info">
                      <div className="provider-icon">
                        <Package size={20} color="#94a3b8" />
                      </div>
                      <div>
                        <h3>{group.provider.name}</h3>
                        <div className="provider-meta">
                          <span className={`provider-min-badge ${isBelowMin ? 'warning' : 'success'}`}>
                            {total.toFixed(2)}€ / Min: {group.provider.min_order || 0}€
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToWhatsApp(pId, group)}
                      className={`whatsapp-btn ${isCopied ? 'copied' : ''}`}
                    >
                      {isCopied ? <ClipboardCheck size={16} /> : <MessageCircle size={16} />}
                      {isCopied ? '¡COPIADO!' : 'WHATSAPP'}
                    </button>

                    {group.provider.name?.toLowerCase().includes('mercadona') && (
                      <button 
                        onClick={() => handleMercadonaOrder(group)}
                        className={`sync-mercadona-btn ${syncingId === group.provider.id ? 'active' : ''}`}
                        title="Copiar lista y abrir Mercadona"
                      >
                        {syncingId === group.provider.id ? (
                          <>
                            <ClipboardCheck size={16} />
                            ¡COPIADO!
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            LISTA Y TIENDA
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="provider-items-list">
                    {group.items.map(ing => (
                      <div key={ing.id} className="provider-item-row">
                        <div className="provider-item-avatar">
                          {ing.image_url ? (
                            <img src={ing.image_url} alt="" />
                          ) : (
                            <span>{ing.name.substring(0,2)}</span>
                          )}
                        </div>
                        <div className="provider-item-details">
                          <p className="provider-item-name">{ing.name}</p>
                          <p className="provider-item-price">
                            {(Number(ing.purchase_price) || 0).toFixed(2)}€ {(ing.calculation_type === 'peso' ? 'kg' : 'ud')}
                          </p>
                        </div>
                        <div className="provider-item-qty">
                          <input 
                            type="number" 
                            value={quantities[ing.id]}
                            onChange={(e) => updateQty(ing.id, e.target.value)}
                          />
                          <span>
                            {ing.calculation_type === 'peso' ? 'kg' : 'ud'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {isBelowMin && (
                    <div className="provider-warning">
                      <AlertTriangle size={14} />
                      <span>Pedido mínimo no alcanzado ({group.provider.min_order}€)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {selectedItems.length === 0 && (
            <div className="shopping-drawer-empty">
              <div className="empty-icon">
                <ShoppingCart size={48} strokeWidth={1} color="#cbd5e1" />
              </div>
              <p>No hay ítems seleccionados</p>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="shopping-drawer-footer">
          <div className="shopping-drawer-summary">
            <div>
              <p className="summary-label">Inversión Total</p>
              <p className="summary-total">
                {Object.values(grouped).reduce((sum, g) => sum + g.items.reduce((iSum, ing) => iSum + (quantities[ing.id] || 0) * (ing.purchase_price || 0), 0), 0).toFixed(2)}€
              </p>
            </div>
            <div className="summary-actions">
              <button 
                onClick={onClearSelection}
                className="btn-clear"
              >
                LIMPIAR
              </button>
              <button 
                onClick={onClose}
                className="btn-close"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
