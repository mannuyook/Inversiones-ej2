'use client';

import { useState } from 'react';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import ProductCatalog from '@/components/ProductCatalog';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  return (
    <CartProvider>
      <main className="bg-[#0b0c0e] min-h-screen text-white">
        <Header onSelectCategory={setSelectedCategory} />
        <HeroBanner />
        <ProductCatalog
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        <CartDrawer />
        <Footer setSelectedCategory={setSelectedCategory} />
      </main>
    </CartProvider>
  );
}