'use client';

import { useCart } from '../context/CartContext';

export default function Header({ onSelectCategory }) {
  const { cartCount, setIsCartOpen } = useCart();

  return (
    <header className="bg-[#0f1115] border-b border-gray-800/60 sticky top-0 z-50">
      {/* 1. Barra superior de anuncios: Oscura con texto e íconos dorados */}
      <div className="bg-[#0b0c0e] text-[#d4af37] text-[11px] font-semibold py-2 px-6 flex justify-between items-center border-b border-gray-800/40 tracking-wider">
        <div className="hidden md:flex items-center gap-2">
          <i className="fa-solid fa-crown text-[10px]"></i>
          <span>COLECCIÓN DE CABALLERO 2026 - INVERSIONES EJ</span>
        </div>
        <div className="mx-auto md:mx-0 flex items-center gap-2">
          <i className="fa-solid fa-plane text-[10px]"></i>
          <span>ENVÍOS RÁPIDOS Y SEGUROS A VENEZUELA</span>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <i className="fa-solid fa-shield text-[10px]"></i>
          <span>CALIDAD Y ELEGANCIA PREMIUM</span>
        </div>
      </div>

      {/* 2. Barra de navegación principal */}
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo con imagen exactas */}
        <div 
          className="flex items-center gap-3.5 cursor-pointer" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-25 h-25 rounded-full overflow-hidden flex items-center justify-center">
            <img 
              src="/logo/logo.jpg" 
              alt="Inversiones EJ" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-extrabold text-xl tracking-wider leading-none">
              INVERSIONES <span className="text-[#d4af37] text-[30px]">EJ</span>
            </span>
            <span className="text-[#d4af37] text-[15px] font-bold tracking-widest mt-1 uppercase">
              ROPA DE CABALLERO
            </span>
          </div>
        </div>

        {/* Menú de Categorías en mayúsculas finas */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest text-gray-200">
          <button onClick={() => onSelectCategory('Todos')} className="hover:text-[#d4af37] transition-colors uppercase">TODOS</button>
          <button onClick={() => onSelectCategory('Camisas')} className="hover:text-[#d4af37] transition-colors uppercase">CAMISAS</button>
          <button onClick={() => onSelectCategory('Gorras')} className="hover:text-[#d4af37] transition-colors uppercase">GORRAS</button>
          <button onClick={() => onSelectCategory('Pantalones')} className="hover:text-[#d4af37] transition-colors uppercase">PANTALONES</button>
          <button onClick={() => onSelectCategory('Shorts')} className="hover:text-[#d4af37] transition-colors uppercase">SHORTS</button>
        </nav>

        {/* 3. Botón de Carrito: Bolsita dorada con contador flotante */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative text-[#d4af37] hover:text-amber-400 transition-all p-1 flex items-center justify-center active:scale-95"
          title="Ver Carrito"
        >
          <div className="relative">
            <i className="fa-solid fa-[#d4af37] fa-bag-shopping text-2xl"></i>
            <span className="absolute -top-1.5 -right-2 bg-[#d4af37] text-black text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
              {cartCount}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}