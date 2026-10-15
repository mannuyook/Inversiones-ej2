'use client';

export default function Footer({ setSelectedCategory }) {
  const scrollToCatalog = (cat) => {
    if (setSelectedCategory) setSelectedCategory(cat);
    const catalogElement = document.getElementById('catalog-section');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0f1115] border-t border-gray-800 text-white pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        
        {/* COLUMNA 1: Sobre la Marca */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#14161a] border border-[#d4af37]/40 flex items-center justify-center font-black text-[#d4af37] text-lg">
              EJ
            </div>
            <span className="text-lg font-black tracking-widest uppercase">
              INVERSIONES <span className="text-[#d4af37]">EJ</span>
            </span>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            Especialistas en moda masculina de alta gama. Selección exclusiva de prendas e importaciones luxury para el caballero moderno en Venezuela.
          </p>
          <div className="flex gap-3 pt-2">
            <a 
              href="https://wa.me/584243699953?text=Hola%20Inversiones%20EJ,%20deseo%20información%20sobre%20los%20envíos%20a%20Venezuela." 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-[#14161a] border border-gray-800 hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center justify-center text-sm"
              title="WhatsApp"
            >
              <i className="fa-brands fa-whatsapp"></i>
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-[#14161a] border border-gray-800 hover:border-pink-500 hover:text-pink-500 transition-all flex items-center justify-center text-sm"
              title="Instagram"
            >
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a 
              href="https://tiktok.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-[#14161a] border border-gray-800 hover:border-[#d4af37] hover:text-[#d4af37] transition-all flex items-center justify-center text-sm"
              title="TikTok"
            >
              <i className="fa-brands fa-tiktok"></i>
            </a>
          </div>
        </div>


        {/* COLUMNA 3: Métodos de Pago */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-[#d4af37] mb-4">
            Formas de Pago
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 bg-[#14161a] p-2.5 rounded-xl border border-gray-800/80">
              <i className="fa-solid fa-bolt text-[#d4af37] text-sm"></i>
              <div>
                <p className="text-white text-xs font-bold">Cashea</p>
                <p className="text-gray-400 text-[10px]">Pago inicial + 3 cuotas sin interés</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-[#14161a] p-2.5 rounded-xl border border-gray-800/80">
              <i className="fa-solid fa-[#25D366] fa-mobile-screen text-green-400 text-sm"></i>
              <div>
                <p className="text-white text-xs font-bold">Pago Móvil & Transferencia</p>
                <p className="text-gray-400 text-[10px]">Bancos nacionales de Venezuela</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 4: Despachos y Envíos */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-[#d4af37] mb-4">
            Envíos Nacionales
          </h4>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            Enviamos tu pedido de manera rápida y segura a cualquier estado de Venezuela con las agencias líderes:
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
            <span className="bg-[#14161a] border border-gray-800 text-gray-300 px-3 py-1 rounded-lg">MRW</span>
            <span className="bg-[#14161a] border border-gray-800 text-gray-300 px-3 py-1 rounded-lg">ZOOM</span>

          </div>
        </div>

      </div>

    {/* BARRA DE DERECHOS RESERVADOS */}
      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-gray-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 relative z-20">
        <p>© {new Date().getFullYear()} Inversiones EJ. Todos los derechos reservados.</p>
        <p className="text-[11px] flex items-center gap-1">
          <span>Desarrollado por</span>
          <a
            href="https://wa.me/573044725824?text=Hola,%20me%20gustar%C3%ADa%20contactar%20al%20desarrollador%20de%20Inversiones%20EJ"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                "https://wa.me/573044725824?text=Hola,%20me%20gustar%C3%ADa%20contactar%20al%20desarrollador%20de%20Inversiones%20EJ",
                "_blank"
              );
            }}
            className="text-[#d4af37] font-bold hover:underline transition-all cursor-pointer pointer-events-auto inline-block z-30"
          >
              DEVELOPER
          </a>
        </p>
      </div>
    </footer>
  );
}