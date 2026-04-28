import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Safari en iOS no soporta la API de Notification — nunca usar directamente.
const hasNotificationAPI = typeof Notification !== 'undefined';

export function useOrderNotifications(isMaster) {
  useEffect(() => {
    if (!isMaster) return;

    // Create a context for synthesized audio so we don't need external files
    const playGong = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Bell / Gong like synthesis
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 1.5);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 2);
      } catch (e) {
        console.error('Audio play failed', e);
      }
    };

    const channel = supabase
      .channel('public:orders:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        // Only alert on new pending web orders to avoid spamming on internal POS inserts
        if (payload.new.status === 'pending' && payload.new.table_id?.includes('Web')) {
           playGong();
           
           // Comprobar soporte antes de tocar Notification (Safari iOS no lo tiene)
           if (!hasNotificationAPI) {
             alert(`¡NUEVO PEDIDO WEB!\nDe: ${payload.new.customer_name}`);
             return;
           }

           if (Notification.permission === 'granted') {
             new Notification('¡NUEVO PEDIDO!', {
               body: `Pedido web recibido de ${payload.new.customer_name}`,
               icon: '/logo-bachan.png'
             });
           } else if (Notification.permission !== 'denied') {
             Notification.requestPermission();
             alert(`¡NUEVO PEDIDO WEB!\nDe: ${payload.new.customer_name}`);
           } else {
             alert(`¡NUEVO PEDIDO WEB!\nDe: ${payload.new.customer_name}`);
           }
        }
      })
      .subscribe();

    // Pedir permisos de notificación solo si el navegador lo soporta
    if (hasNotificationAPI && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMaster]);
}
