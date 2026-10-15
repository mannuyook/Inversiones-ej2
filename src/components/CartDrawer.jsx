'use client';

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '@/lib/supabase';

export default function CartDrawer() {
  const { 
    cart = [], 
    cartTotalToday = 0, 
    cartTotalFull = 0, 
    isCartOpen, 
    setIsCartOpen, 
    clearCart, 
    removeFromCart 
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCartOpen) return null;

  const hasCasheaItems = cart.some((item) => item.cashea);

  // Proceso de creación de orden en Supabase + Redirección a WhatsApp
  const handleCheckoutWhatsApp = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1. Insertar la orden pendiente en la base de datos de Supabase
      const { data: orderData, error } = await supabase
        .from('web_orders')
        .insert([
          {
            items: cart,
            total_usd: cartTotalToday,
            status: 'PENDING',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const orderNumber = orderData.order_number;

      // 2. Armar el mensaje detallado para WhatsApp con el número de orden generado
      let message = `🛒 *NUEVA ORDEN WEB #${orderNumber}*\n\n`;
      message += `Hola Inversiones EJ, deseo realizar la siguiente compra:\n\n`;

      cart.forEach((item, index) => {
        message += `${index + 1}. *${item.name}* (Talla: ${item.size}) x${item.quantity}\n`;
        if (item.cashea) {
          message += `   • Modalidad: *Cashea Nivel ${item.cashea.level}*\n`;
          message += `   • Inicial a pagar hoy: $${item.cashea.initial} USD\n`;
          message += `   • 3 cuotas de: $${item.cashea.installment} USD\n`;
        } else {
          message += `   • Pago de Contado: $${item.finalPrice.toFixed(2)} USD\n`;
        }
      });

      message += `\n*TOTAL A PAGAR HOY:* $${(cartTotalToday || 0).toFixed(2)} USD`;
      if (hasCasheaItems) {
        message += `\n*(Valor total de productos: $${(cartTotalFull || 0).toFixed(2)} USD)*`;
      }
      message += `\n\n📌 *ID de Orden:* #${orderNumber}`;
      message += `\n\nQuedo atento a las instrucciones para enviar el pago y coordinar el despacho.`;

      // 3. Limpiar carrito local y cerrar el drawer
      clearCart();
      setIsCartOpen(false);

      // 4. Abrir WhatsApp en pestaña nueva
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/584243699953?text=${encoded}`, '_blank');
    } catch (err) {
      console.error('Error al procesar la compra web:', err);
      alert('Ocurrió un problema al guardar la orden. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Fondo traslúcido */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      ></div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0f1115] border-l border-gray-800 text-white shadow-2xl flex flex-col justify-between">
          
          {/* Cabecera */}
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-extrabold uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-bag-shopping text-[#d4af37]"></i> Tu Carrito
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-9 h-9 rounded-full bg-[#14161a] hover:bg-[#d4af37] hover:text-black transition-all flex items-center justify-center font-bold"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Lista de productos */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <i className="fa-solid fa-cart-flatbed text-4xl mb-3 text-gray-600"></i>
                <p className="text-sm font-bold uppercase tracking-wider">Tu carrito está vacío.</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="bg-[#14161a] border border-gray-800 rounded-2xl p-4 flex gap-4 items-center">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl bg-black" />
                  <div className="flex-1">
                    <h4 className="font-extrabold text-sm text-white">{item.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Talla: <span className="text-[#d4af37] font-bold">{item.size}</span> | Cant: {item.quantity}
                    </p>
                    
                    {item.cashea ? (
                      <div className="mt-1.5 p-2 bg-[#0b0c0e] rounded-lg border border-amber-500/20 text-[11px]">
                        <p className="text-amber-400 font-bold flex items-center gap-1">
                          <i className="fa-solid fa-bolt text-[10px]"></i> Cashea Nv. {item.cashea.level}
                        </p>
                        <p className="text-gray-300 font-extrabold mt-0.5">
                          Inicial hoy: <span className="text-[#d4af37]">${item.cashea.initial} USD</span>
                        </p>
                        <p className="text-gray-400 text-[10px]">
                          3 cuotas de: ${item.cashea.installment} USD
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm font-black text-[#d4af37] mt-1">
                        ${(item.finalPrice || 0).toFixed(2)} USD
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => removeFromCart(index)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-2"
                    title="Eliminar"
                  >
                    <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Total y Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-gray-800 bg-[#0b0c0e] space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm font-bold">A pagar hoy:</span>
                  <span className="text-[#d4af37] text-2xl font-black">${(cartTotalToday || 0).toFixed(2)} USD</span>
                </div>
                {hasCasheaItems && (
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Precio total de artículos:</span>
                    <span>${(cartTotalFull || 0).toFixed(2)} USD</span>
                  </div>
                )}
              </div>

              <button
                disabled={isSubmitting}
                onClick={handleCheckoutWhatsApp}
                className="w-full bg-[#25D366] hover:bg-emerald-600 text-black font-extrabold py-3.5 rounded-xl transition-all shadow-lg uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <i className="fa-brands fa-whatsapp text-lg"></i> 
                {isSubmitting ? 'Procesando Orden...' : 'Finalizar Compra por WhatsApp'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}