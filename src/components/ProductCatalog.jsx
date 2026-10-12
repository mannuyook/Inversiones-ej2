'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

const products = [
  // Camisas (1 al 10)
  { id: '1', name: 'Camisa-1', price: 10.00, category: 'Camisas', image: '/image/camisa-1.jpeg', description: 'Camisa exclusiva en tono fresco, ideal para climas cálidos y ocasiones casuales o semi-formales.' },
  { id: '2', name: 'Camisa-2', price: 10.00, category: 'Camisas', image: '/image/camisa-2.jpeg', description: 'Camisa de lino ligera en tono fresco, ideal para climas cálidos y ocasiones casuales o semi-formales.' },
  { id: '3', name: 'Camisa-3', price: 10.00, category: 'Camisas', image: '/image/camisa-3.jpeg', description: 'Camisa de lino ligera en tono fresco, ideal para climas cálidos y ocasiones casuales o semi-formales.' },
  { id: '4', name: 'Camisa-4', price: 10.00, category: 'Camisas', image: '/image/camisa-4.jpeg', description: 'Camisa premium con diseño exclusivo y moderno.' },
  { id: '5', name: 'Camisa-5', price: 10.00, category: 'Camisas', image: '/image/camisa-5.jpeg', description: 'Camisa premium con diseño exclusivo y moderno.' },
  { id: '6', name: 'Camisa-6', price: 10.00, category: 'Camisas', image: '/image/camisa-6.jpeg', description: 'Camisa premium con diseño exclusivo y moderno.' },
  { id: '7', name: 'Camisa-7', price: 10.00, category: 'Camisas', image: '/image/camisa-7.jpeg', description: 'Camisa premium con diseño exclusivo y moderno.' },
  { id: '8', name: 'Camisa-8', price: 10.00, category: 'Camisas', image: '/image/camisa-8.jpeg', description: 'Camisa premium con diseño exclusivo y moderno.' },
  { id: '9', name: 'Camisa-9', price: 10.00, category: 'Camisas', image: '/image/camisa-9.jpeg', description: 'Camisa premium con diseño exclusivo y moderno.' },
  { id: '10', name: 'Camisa-10', price: 10.00, category: 'Camisas', image: '/image/camisa-10.jpeg', description: 'Camisa premium con diseño exclusivo y moderno.' },

  // Gorras (1 al 11)
  { id: '11', name: 'Gorra-1', price: 10.00, category: 'Gorras', image: '/image/gorra-1.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
  { id: '12', name: 'Gorra-2', price: 10.00, category: 'Gorras', image: '/image/gorra-2.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
  { id: '13', name: 'Gorra-3', price: 10.00, category: 'Gorras', image: '/image/gorra-3.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
  { id: '14', name: 'Gorra-4', price: 10.00, category: 'Gorras', image: '/image/gorra-4.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
  { id: '15', name: 'Gorra-5', price: 10.00, category: 'Gorras', image: '/image/gorra-5.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
  { id: '16', name: 'Gorra-6', price: 10.00, category: 'Gorras', image: '/image/gorra-6.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
  { id: '17', name: 'Gorra-7', price: 10.00, category: 'Gorras', image: '/image/gorra-7.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
  { id: '18', name: 'Gorra-8', price: 10.00, category: 'Gorras', image: '/image/gorra-8.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
  { id: '19', name: 'Gorra-9', price: 10.00, category: 'Gorras', image: '/image/gorra-9.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
  { id: '20', name: 'Gorra-10', price: 10.00, category: 'Gorras', image: '/image/gorra-10.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
  { id: '21', name: 'Gorra-11', price: 10.00, category: 'Gorras', image: '/image/gorra-11.jpeg', description: 'Gorra luxury importada con ajuste perfecto y alta durabilidad.' },
];

export default function ProductCatalog({ selectedCategory, setSelectedCategory }) {
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  
  // Estado interno del modal
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [useCashea, setUseCashea] = useState(false);
  const [casheaLevel, setCasheaLevel] = useState(3);

  const { addToCart } = useCart();

  const filteredProducts = selectedCategory === 'Todos'
    ? products
    : products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleOpenModal = (product) => {
    setActiveModalProduct(product);
    setSelectedSize('M');
    setQuantity(1);
    setUseCashea(false);
    setCasheaLevel(3);
  };

  const calculateCasheaDetails = (totalPrice) => {
    const percentages = { 1: 0.60, 2: 0.50, 3: 0.40, 4: 0.35, 5: 0.30, 6: 0.20 };
    const initialPct = percentages[casheaLevel] || 0.40;
    const initialAmount = totalPrice * initialPct;
    const remaining = totalPrice - initialAmount;
    const installment = remaining / 3;
    return { initialAmount, installment };
  };

  const handleAddWithDetails = () => {
    if (!activeModalProduct) return;
    
    let casheaInfo = null;
    const totalPrice = activeModalProduct.price * quantity;
    if (useCashea) {
      const { initialAmount, installment } = calculateCasheaDetails(totalPrice);
      casheaInfo = {
        level: casheaLevel,
        initial: initialAmount.toFixed(2),
        installment: installment.toFixed(2)
      };
    }

    addToCart({
      ...activeModalProduct,
      size: selectedSize,
      quantity,
      cashea: casheaInfo,
      finalPrice: totalPrice
    });

    setActiveModalProduct(null);
  };

  return (
    <section id="catalog-section" className="max-w-7xl mx-auto px-4 py-16">
      {/* Botones de Categorías */}
      <div className="flex justify-center gap-3 mb-12 flex-wrap">
        {['Todos', 'Camisas', 'Gorras', 'Pantalones', 'Shorts'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-full font-bold text-sm tracking-wider uppercase transition-all ${
              selectedCategory === cat
                ? 'bg-gold-500 text-darkgray-950 shadow-lg shadow-gold-500/20'
                : 'bg-darkgray-900 text-gray-300 border border-darkgray-800 hover:border-gold-500/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cuadrícula de Productos Animada al Scroll */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-darkgray-900 border border-darkgray-800 rounded-2xl overflow-hidden shadow-xl hover:border-gold-500/50 transition-all duration-300 flex flex-col justify-between group relative"
          >
            <span className="absolute top-3 left-3 z-10 bg-darkgray-950/90 text-gold-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-gold-500/30">
              NUEVO
            </span>

            <div className="relative h-64 overflow-hidden bg-darkgray-950">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wider block">{product.category}</span>
                <h3 className="text-lg font-bold text-white mt-1 group-hover:text-gold-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-xl font-extrabold text-gold-400 mt-2">
                  ${product.price.toFixed(2)} USD
                </p>
              </div>

              <button
                onClick={() => handleOpenModal(product)}
                className="mt-6 w-full bg-darkgray-950 hover:bg-gold-500 text-gold-400 hover:text-darkgray-950 border border-gold-500/40 font-bold py-3 rounded-xl transition-all uppercase tracking-wider text-xs active:scale-95"
              >
                COMPRAR
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* MODAL DE DETALLE DE PRODUCTO Y CASHEA */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-darkgray-900 border border-darkgray-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative my-8">
            <button
              onClick={() => setActiveModalProduct(null)}
              className="absolute top-4 right-4 z-30 bg-darkgray-950 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold hover:bg-gold-500 hover:text-darkgray-950 transition-all"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-72 md:h-full bg-darkgray-950">
                <img
                  src={activeModalProduct.image}
                  alt={activeModalProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 flex flex-col justify-between">
                <div>
                  <span className="text-gold-400 text-xs font-bold uppercase tracking-widest">{activeModalProduct.category}</span>
                  <h2 className="text-2xl font-extrabold text-white mt-1">{activeModalProduct.name}</h2>
                  <p className="text-2xl font-extrabold text-gold-400 mt-2">${(activeModalProduct.price * quantity).toFixed(2)} USD</p>
                  
                  <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                    {activeModalProduct.description}
                  </p>

                  {/* Selector de Talla */}
                  <div className="mt-4">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
                      Talla Seleccionada: <span className="text-gold-400">{selectedSize}</span>
                    </label>
                    <div className="flex gap-2">
                      {['S', 'M', 'L', 'XL'].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                            selectedSize === size
                              ? 'bg-gold-500 text-darkgray-950 shadow-md'
                              : 'bg-darkgray-950 text-gray-300 border border-darkgray-800 hover:border-gold-500'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Cantidad */}
                  <div className="mt-4">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Cantidad:</label>
                    <div className="flex items-center gap-3 bg-darkgray-950 px-4 py-2 rounded-xl w-fit border border-darkgray-800">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-white hover:text-gold-400 font-bold px-2"
                      >-</button>
                      <span className="font-extrabold text-white">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="text-white hover:text-gold-400 font-bold px-2"
                      >+</button>
                    </div>
                  </div>

                  {/* CASHEA INTEGRATION */}
                  <div className="mt-5 bg-darkgray-950 p-4 rounded-2xl border border-darkgray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-gold-400 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-bolt"></i> Pagar con Cashea
                      </span>
                      <button
                        onClick={() => setUseCashea(!useCashea)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-1 ${useCashea ? 'bg-gold-500' : 'bg-darkgray-800'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-darkgray-950 transition-transform ${useCashea ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                    {useCashea && (
                      <div className="mt-3 pt-3 border-t border-darkgray-800">
                        <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                          Nivel Cashea (1 al 6):
                        </label>
                        <div className="flex gap-1.5 justify-between">
                          {[1, 2, 3, 4, 5, 6].map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setCasheaLevel(lvl)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                casheaLevel === lvl
                                  ? 'bg-gold-500 text-darkgray-950'
                                  : 'bg-darkgray-900 text-gray-400 border border-darkgray-800'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>

                        {/* Desglose de Pago Inicial y Cuotas */}
                        {(() => {
                          const { initialAmount, installment } = calculateCasheaDetails(activeModalProduct.price * quantity);
                          return (
                            <div className="mt-3 text-xs bg-darkgray-900 p-2.5 rounded-xl border border-darkgray-800 space-y-1">
                              <div className="flex justify-between text-gray-300">
                                <span>Inicial (Hoy):</span>
                                <span className="font-extrabold text-gold-400">${initialAmount.toFixed(2)} USD</span>
                              </div>
                              <div className="flex justify-between text-gray-400 text-[10px]">
                                <span>3 Cuotas de:</span>
                                <span>${installment.toFixed(2)} USD c/u</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleAddWithDetails}
                    className="w-full bg-gold-500 hover:bg-gold-600 text-darkgray-950 font-extrabold py-3.5 rounded-xl transition-all shadow-lg shadow-gold-500/20 active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-cart-plus"></i> Añadir al Carrito
                  </button>
                  <a
                    href={`https://wa.me/584120000000?text=Hola%20Inversiones%20EJ,%20quiero%20consultar%20sobre%20el%20envío%20a%20Venezuela%20de%20${activeModalProduct.name}%20(Talla:%20${selectedSize})`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-darkgray-950 hover:bg-darkgray-800 text-white border border-darkgray-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                  >
                    <i className="fa-brands fa-whatsapp text-green-500"></i> Consultar Envío a Venezuela
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}