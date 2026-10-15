'use client';

import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.size === product.size && JSON.stringify(item.cashea) === JSON.stringify(product.cashea)
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const currentStock = product.stock || 99;
        const requestedQty = updated[existingIndex].quantity + product.quantity;

        // Limita al stock máximo disponible
        if (requestedQty > currentStock) {
          alert(`¡Stock insuficiente! Solo quedan ${currentStock} unidades disponibles.`);
          updated[existingIndex].quantity = currentStock;
        } else {
          updated[existingIndex].quantity = requestedQty;
        }

        const newTotal = updated[existingIndex].quantity * updated[existingIndex].price;
        updated[existingIndex].finalPrice = newTotal;
        
        // Recalcular Cashea si está activo
        if (updated[existingIndex].cashea) {
          const percentages = { 1: 0.60, 2: 0.50, 3: 0.40, 4: 0.35, 5: 0.30, 6: 0.20 };
          const lvl = updated[existingIndex].cashea.level;
          const initialPct = percentages[lvl] || 0.40;
          const initialAmount = newTotal * initialPct;
          const remaining = newTotal - initialAmount;
          
          updated[existingIndex].cashea.initial = initialAmount.toFixed(2);
          updated[existingIndex].cashea.installment = (remaining / 3).toFixed(2);
        }
        return updated;
      }
      return [...prevCart, product];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const cartTotalToday = cart.reduce((acc, item) => {
    if (item.cashea) {
      return acc + parseFloat(item.cashea.initial);
    }
    return acc + item.finalPrice;
  }, 0);

  const cartTotalFull = cart.reduce((acc, item) => acc + item.finalPrice, 0);

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        cartCount, 
        cartTotalToday, 
        cartTotalFull, 
        isCartOpen, 
        setIsCartOpen, 
        addToCart, 
        removeFromCart, 
        clearCart 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);