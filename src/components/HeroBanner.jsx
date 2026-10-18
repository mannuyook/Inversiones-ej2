'use client';

import { useState } from 'react';

export default function HeroBanner() {
  const [activeVideo, setActiveVideo] = useState(null);

  const bannerVideos = [
    {
      id: 1,
      videoUrl: '/video/video1.mp4',
      bgImage: '/image/camisa-1.jpeg',
      position: 'object-center' 
    },
    {
      id: 2,
      videoUrl: '/video/video2.mp4',
      bgImage: '/image/camisa-2.jpeg',
      position: 'object-top'
    },
    {
      id: 3,
      videoUrl: '/video/video3.mp4',
      bgImage: '/image/camisa-3.jpeg',
      position: 'object-center'
    }
  ];

  return (
    <section className="bg-[#0b0c0e] py-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Contenedor de los 3 videos*/}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {bannerVideos.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveVideo(item.videoUrl)}
              className="relative h-[520px] rounded-2xl overflow-hidden border border-gray-800/60 cursor-pointer group shadow-2xl hover:border-[#d4af37]/50 transition-all duration-300 bg-[#0f1115]"
            >
              <img
                src={item.bgImage}
                alt="Video preview"
                className={`absolute inset-0 w-full h-full object-cover ${item.position} md:hidden opacity-90`}
              />
              
              <video
                src={item.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                className={`hidden md:block w-full h-full object-cover ${item.position} transition-transform duration-700 group-hover:scale-105 opacity-90`}
              />
            </div>
          ))}
        </div>

        {/* Sección Titular de la Tienda */}
        <div className="text-left pt-2 pb-6 max-w-3xl">
          <span className="inline-block text-[#d4af37] text-[15px] font-bold tracking-widest uppercase bg-[#14161a] px-3.5 py-1.5 rounded-md border border-[#d4af37]/30">
            COLECCIÓN EXCLUSIVA 2026
          </span>
          
          <h1 className="text-5xl md:text-5xl font-black text-white tracking-wider mt-4 leading-none uppercase">
            INVERSIONES <span className="text-[#d4af37]">EJ</span>
          </h1>
          
          <p className="text-gray-300 text-sm md:text-xl mt-4 leading-relaxed max-w-xl">
            Elegancia, distinción y estilo moderno en moda masculina. Despachos seguros y directos a toda Venezuela.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-7">
            <button
              onClick={() => {
                const catalogEl = document.getElementById('catalog-section');
                catalogEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#d4af37] hover:bg-amber-500 text-black font-extrabold px-7 py-3 rounded-xl transition-all shadow-md active:scale-95 uppercase tracking-wider text-xs"
            >
              VER CATÁLOGO
            </button>
            <a
              href="https://wa.me/584243699953?text=Hola%20Inversiones%20EJ,%20deseo%20información%20sobre%20los%20envíos%20a%20Venezuela."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#14161a] hover:bg-gray-900 text-white border border-gray-700/80 hover:border-[#d4af37] font-bold px-6 py-3 rounded-xl transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center gap-2"
            >
              <i className="fa-brands fa-whatsapp text-emerald-400 text-base"></i> WHATSAPP
            </a>
          </div>
        </div>
      </div>

      {/* Modal Lightbox */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-[#0f1115] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-30 bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold hover:bg-[#d4af37] hover:text-black transition-all"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
            <div className="p-4 flex items-center justify-center bg-black">
              <video
                src={activeVideo}
                controls
                autoPlay
                className="max-h-[75vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}