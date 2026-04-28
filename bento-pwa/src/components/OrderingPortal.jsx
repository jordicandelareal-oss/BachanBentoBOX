import React, { useState, useEffect } from 'react';
import { ShoppingBag, ChevronLeft, Plus, Minus, X, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function OrderingPortal() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal / Form States
  const [showCartModal, setShowCartModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    time: ''
  });

  // Calculate available times
  const timeSlots = [];
  // 13:00 to 16:00
  for (let h = 13; h < 16; h++) {
    timeSlots.push(`${h}:00`);
    timeSlots.push(`${h}:30`);
  }
  timeSlots.push(`16:00`);
  // 20:00 to 23:30
  for (let h = 20; h < 23; h++) {
    timeSlots.push(`${h}:00`);
    timeSlots.push(`${h}:30`);
  }
  timeSlots.push(`23:00`);
  timeSlots.push(`23:30`);

  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true);
        // Call our public RPC securely
        const { data, error } = await supabase.rpc('get_public_menu');
        if (error) throw error;
        setMenu(data || []);
      } catch (err) {
        console.error("Error cargando menú público:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.time) {
      alert("Por favor rellena todos los campos.");
      return;
    }
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderData = {
        customer_name: formData.name,
        customer_contact: formData.phone,
        delivery_time: formData.time,
        total: cartTotal,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          quantity_multiplier: item.quantity_multiplier || 1,
        }))
      };

      const { data, error } = await supabase.rpc('submit_guest_order', { p_order: orderData });
      
      if (error) throw error;

      setSubmitSuccess(true);
      setCart([]);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowCartModal(false);
      }, 5000);
      
    } catch (err) {
      console.error("Error al enviar el pedido:", err);
      alert("Hubo un error enviando tu pedido. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#111', minHeight: '100vh', color: '#fff', paddingBottom: '80px', fontFamily: 'var(--font-base)' }}>
      {/* Header Estético */}
      <header style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #333' }}>
        <h1 style={{ fontFamily: 'var(--font-brand)', margin: 0, color: 'var(--color-crema)' }}>BaChan</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.6, fontSize: '0.9em' }}>TRADICIÓN PRIVADA</p>
      </header>

      {/* Grid de Platos */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>Cargando carta...</div>
        ) : menu.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>Opciones no disponibles.</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {menu.map(item => (
              <div key={item.id} style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  height: '220px',
                  backgroundColor: '#222',
                  backgroundImage: item.image_url ? `url(${item.image_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '16px'
                }}>
                  {!item.image_url && <div style={{opacity: 0.2, margin: 'auto'}}>Sin foto</div>}
                </div>
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2em', color: '#fff' }}>{item.name}</h3>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>{item.price.toFixed(2)}€</span>
                  </div>
                  <p style={{ margin: '0 0 20px 0', color: '#888', fontSize: '0.9em', flex: 1, lineHeight: '1.5' }}>
                    {item.description || 'Sabor tradicional japonés en cada bocado.'}
                  </p>
                  <button 
                    onClick={() => addToCart(item)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-accent)',
                      color: 'var(--color-accent)',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.target.style.backgroundColor = 'var(--color-accent)'; e.target.style.color = '#111'; }}
                    onMouseLeave={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--color-accent)'; }}
                  >
                    Añadir al pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Botón flotante al carrito */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
          <button 
            onClick={() => setShowCartModal(true)}
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#111',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '100px',
              fontWeight: 'bold',
              fontSize: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
          >
            <ShoppingBag size={20} />
            Ver Selección ({cartQty} items) • {cartTotal.toFixed(2)}€
          </button>
        </div>
      )}

      {/* Modal Formulario */}
      {showCartModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            width: '100%', maxWidth: '600px',
            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            maxHeight: '90vh', overflowY: 'auto',
            padding: '24px', position: 'relative'
          }}>
            <button 
              onClick={() => setShowCartModal(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ display: 'inline-flex', padding: '20px', borderRadius: '50%', backgroundColor: 'rgba(204,51,51,0.1)', color: 'var(--color-accent)', marginBottom: '24px' }}>
                  <Info size={48} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-brand)', color: 'var(--color-crema)' }}>Solicitud enviada</h2>
                <p style={{ color: '#aaa', fontSize: '1.1em', lineHeight: '1.5' }}>
                  En breve recibirás un mensaje de confirmación en tu teléfono móvil. Gracias por elegir BaChan.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{ marginTop: 0, color: '#fff', fontFamily: 'var(--font-brand)' }}>Tu Pedido</h2>
                
                <div style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                        <div style={{ color: '#888', fontSize: '0.9em' }}>{item.price.toFixed(2)}€</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#000', borderRadius: '100px', padding: '4px 8px' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Minus size={16} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer' }}><Plus size={16} /></button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em', color: 'var(--color-accent)', marginTop: '20px' }}>
                    <span>Total Estimado</span>
                    <span>{cartTotal.toFixed(2)}€</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Nombre (Obligatorio)</label>
                    <input 
                      required type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '16px' }}
                      placeholder="Ej. Marina"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Teléfono (Obligatorio)</label>
                    <input 
                      required type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '16px' }}
                      placeholder="Para confirmar via WhatsApp..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Hora de Entrega / Recogida</label>
                    <select 
                      required
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '16px', appearance: 'none' }}
                    >
                      <option value="">Selecciona hora...</option>
                      {timeSlots.map(time => (
                         <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isSubmitting || cart.length === 0}
                    style={{
                      marginTop: '16px',
                      padding: '20px',
                      backgroundColor: 'var(--color-accent)',
                      color: '#111',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '1.2em',
                      cursor: isSubmitting ? 'wait' : 'pointer',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? 'Enviando...' : 'Confirmar Pedido'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
