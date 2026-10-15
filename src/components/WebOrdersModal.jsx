'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function WebOrdersModal({ isOpen, onClose, onStockUpdated }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }

    // Escuchar órdenes nuevas en tiempo real
    const channel = supabase
      .channel('public:web_orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'web_orders' }, (payload) => {
        setOrders((prev) => [payload.new, ...prev]);
        playNotificationSound();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('web_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setOrders(data || []);
    }
    setLoading(false);
  }



  // Aceptar Orden: Cambia a COMPLETED y descuenta stock
  async function handleAcceptOrder(order) {
    if (!confirm(`¿Confirmar recepción de pago y autorizar la orden #${order.order_number}?`)) return;

    try {
      // 1. Descontar el stock de cada variante
      for (const item of order.items) {
        if (item.variant_id) {
          const { data: vData } = await supabase
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', item.variant_id)
            .single();

          if (vData) {
            const newStock = Math.max(0, vData.stock_quantity - item.quantity);
            await supabase
              .from('product_variants')
              .update({ stock_quantity: newStock })
              .eq('id', item.variant_id);
          }
        }
      }

      // 2. Registrar en la tabla sales
      await supabase.from('sales').insert([
        {
          ticket_number: order.order_number,
          total_usd: order.total_usd,
          payment_method: 'Compra Web / WhatsApp',
          status: 'COMPLETED',
        },
      ]);

      // 3. Cambiar estado a COMPLETED
      await supabase
        .from('web_orders')
        .update({ status: 'COMPLETED' })
        .eq('id', order.id);

      fetchOrders();
      if (onStockUpdated) onStockUpdated();
      alert(`¡Orden #${order.order_number} ACEPTADA correctamente!`);
    } catch (err) {
      alert('Error al aceptar la orden: ' + err.message);
    }
  }

  // Rechazar Orden
  async function handleRejectOrder(order) {
    if (!confirm(`¿Rechazar y cancelar la orden #${order.order_number}?`)) return;

    await supabase
      .from('web_orders')
      .update({ status: 'CANCELLED' })
      .eq('id', order.id);

    fetchOrders();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121418] border border-[#cca152]/40 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col text-white">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <h2 className="text-lg font-bold uppercase tracking-wider">
              Órdenes de Compra Web
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-[#0b0c0e] border border-gray-800 w-8 h-8 rounded-full flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Lista de Órdenes */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500 text-xs">Cargando órdenes...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs">No hay órdenes registradas.</div>
          ) : (
            orders.map((ord) => (
              <div 
                key={ord.id} 
                className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                  ord.status === 'PENDING' 
                    ? 'bg-[#181a20] border-[#cca152]/60' 
                    : 'bg-[#0b0c0e] border-gray-800 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-[#cca152] text-sm">
                      #ORD-{ord.order_number}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(ord.created_at).toLocaleString('es-VE')}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                      ord.status === 'PENDING' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                      ord.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {ord.status === 'PENDING' ? '⏳ Pendiente' : ord.status === 'COMPLETED' ? '✔ Aceptada' : '✖ Rechazada'}
                    </span>
                  </div>

                  <div className="text-xs text-gray-300 space-y-0.5">
                    {ord.items?.map((it, idx) => (
                      <div key={idx}>
                        • {it.name} (Talla: {it.size}) x{it.quantity} - <strong className="text-emerald-400">${it.finalPrice} USD</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right pr-2">
                    <span className="text-[10px] text-gray-400 block uppercase">Total</span>
                    <span className="text-base font-extrabold text-emerald-400">${ord.total_usd?.toFixed(2)} USD</span>
                  </div>

                  {ord.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRejectOrder(ord)}
                        className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/50 px-3 py-2 rounded-xl text-xs font-bold transition"
                      >
                        ✖ Rechazar
                      </button>
                      <button
                        onClick={() => handleAcceptOrder(ord)}
                        className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 px-3 py-2 rounded-xl text-xs font-bold transition"
                      >
                        ✔ Aceptar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}