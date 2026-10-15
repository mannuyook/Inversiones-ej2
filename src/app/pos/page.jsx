'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import WebOrdersModal from '@/components/WebOrdersModal';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo (Bs / USD)');
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Cashea y Tasa BCV
  const [useCashea, setUseCashea] = useState(false);
  const [casheaLevel, setCasheaLevel] = useState(1);
  const [bcvRate, setBcvRate] = useState(879.1225);
  const [loadingBcv, setLoadingBcv] = useState(false);

  // Notificaciones y Modales
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [processingSale, setProcessingSale] = useState(false);
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  
  // Modales
  const [showWebOrdersModal, setShowWebOrdersModal] = useState(false);
  const [pendingWebOrdersCount, setPendingWebOrdersCount] = useState(0);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showMovementsModal, setShowMovementsModal] = useState(false);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [manualStockInput, setManualStockInput] = useState('');

  // Estados para Caja / Arqueo en POS
  const [activeSession, setActiveSession] = useState(null);
  const [openingCashInput, setOpeningCashInput] = useState('');
  
  // Arqueo físico en Bolívares
  const [actualCashBs, setActualCashBs] = useState('');
  const [actualPagoMovilBs, setActualPagoMovilBs] = useState('');
  const [actualTarjetaBs, setActualTarjetaBs] = useState('');
  
  // Ventas calculadas del turno
  const [turnSales, setTurnSales] = useState({
    efectivoBs: 0,
    pagoMovilBs: 0,
    tarjetaBs: 0,
    casheaBs: 0,
    totalBs: 0,
    totalUsd: 0,
    count: 0
  });

  // Historial local de movimientos
  const [posMovements, setPosMovements] = useState([]);

  function showToast(message, type = 'success') {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  }

  useEffect(() => {
    setMounted(true);
    fetchCatalog();
    fetchLiveBcvRate();
    fetchPendingWebOrders();
    checkActiveCashSession();
    fetchPosMovements();
    const email = localStorage.getItem('ej_user_email');
if (!email) {
  window.location.href = '/pos/login'; // O la ruta de login del POS
} else {
  // tu código existente...
  setCheckingAuth(false);
}
  }, []);

  async function fetchCatalog() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*, product_variants(*)');
    if (data) setProducts(data);
    setLoading(false);
  }

  async function fetchLiveBcvRate() {
    setLoadingBcv(true);
    try {
      const res = await fetch('/api/bcv');
      const json = await res.json();
      if (json && json.price) setBcvRate(parseFloat(json.price));
    } catch (err) {
      setBcvRate(879.1225);
    } finally {
      setLoadingBcv(false);
    }
  }

  async function fetchPendingWebOrders() {
    const { count } = await supabase.from('web_orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
    setPendingWebOrdersCount(count || 0);
  }

  async function checkActiveCashSession() {
    const { data } = await supabase.from('cash_register_sessions').select('*').eq('status', 'OPEN').order('opened_at', { ascending: false }).maybeSingle();
    setActiveSession(data || null);
    if (data) {
      calculateTurnSales(data.opened_at, bcvRate);
    }
  }

  async function calculateTurnSales(openedAt, currentRate) {
    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', openedAt)
      .eq('status', 'COMPLETED');

    let efBs = 0, pmBs = 0, tjBs = 0, csBs = 0, totUsd = 0;
    (sales || []).forEach(s => {
      const m = s.payment_method || '';
      const amtUsd = parseFloat(s.total_usd || 0);
      totUsd += amtUsd;
      const amtBs = amtUsd * currentRate;

      if (m.includes('Efectivo')) efBs += amtBs;
      else if (m.includes('Pago Móvil')) pmBs += amtBs;
      else if (m.includes('Tarjeta') || m.includes('Puntos')) tjBs += amtBs;
      else csBs += amtBs;
    });

    setTurnSales({
      efectivoBs: efBs,
      pagoMovilBs: pmBs,
      tarjetaBs: tjBs,
      casheaBs: csBs,
      totalBs: totUsd * currentRate,
      totalUsd: totUsd,
      count: sales?.length || 0
    });
  }

  async function fetchPosMovements() {
    const { data } = await supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(30);
    if (data) setPosMovements(data);
  }

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) || p.serial_code.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  function addToCart(product) {
    const variant = product.product_variants?.[0];
    const stock = variant?.stock_quantity || 0;
    const idx = cart.findIndex(i => i.product_id === product.id);

    if (idx > -1) {
      if (cart[idx].quantity + 1 > stock) return showToast(`Stock insuficiente. Quedan ${stock}`, 'error');
      const updated = [...cart];
      updated[idx].quantity += 1;
      updated[idx].subtotal = updated[idx].quantity * product.price;
      setCart(updated);
    } else {
      if (stock < 1) return showToast('Producto agotado', 'error');
      setCart([...cart, { product_id: product.id, variant_id: variant?.id, serial_code: product.serial_code, name: product.name, price: product.price, quantity: 1, subtotal: product.price }]);
    }
    showToast(`Agregado: ${product.serial_code}`, 'success');
    setSelectedProductModal(null);
  }

  function updateQuantity(idx, delta) {
    const updated = [...cart];
    const newQty = updated[idx].quantity + delta;
    if (newQty <= 0) updated.splice(idx, 1);
    else {
      updated[idx].quantity = newQty;
      updated[idx].subtotal = newQty * updated[idx].price;
    }
    setCart(updated);
  }

  const totalAmountUsd = cart.reduce((acc, i) => acc + i.subtotal, 0);
  const casheaPercentages = { 1: 0.60, 2: 0.50, 3: 0.40, 4: 0.40, 5: 0.40, 6: 0.40 };
  
  const initialPaymentUsd = useCashea ? totalAmountUsd * (casheaPercentages[casheaLevel] || 0.50) : totalAmountUsd;
  const initialPaymentBs = initialPaymentUsd * bcvRate;

  async function handleCheckout() {
    if (!activeSession) return showToast('Debes ABRIR LA CAJA antes de realizar cobros', 'error');
    if (cart.length === 0) return showToast('El carrito está vacío', 'error');

    setProcessingSale(true);
    try {
      const ticketNumber = Math.floor(1000 + Math.random() * 9000);
      const method = useCashea ? `Cashea Nivel ${casheaLevel} (Inicial Bs. ${initialPaymentBs.toFixed(2)})` : paymentMethod;

      const { data: saleData, error: saleError } = await supabase.from('sales').insert([{ 
        ticket_number: ticketNumber, 
        total_usd: initialPaymentUsd, 
        payment_method: method, 
        status: 'COMPLETED' 
      }]).select().single();

      if (saleError) throw saleError;

      for (const item of cart) {
        if (item.variant_id) {
          await supabase.from('sale_items').insert([{
            sale_id: saleData.id,
            product_variant_id: item.variant_id,
            quantity: item.quantity,
            price_at_sale: item.price
          }]);

          const { data: v } = await supabase.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single();
          if (v) {
            const newStock = Math.max(0, v.stock_quantity - item.quantity);
            await supabase.from('product_variants').update({ stock_quantity: newStock }).eq('id', item.variant_id);
            
            await supabase.from('inventory_movements').insert([{
              product_variant_id: item.variant_id,
              movement_type: 'VENTA_POS',
              quantity_change: -item.quantity,
              stock_after: newStock,
              reference_code: `TK-${ticketNumber}`,
              reason: `Venta Ticket #${ticketNumber} (${method})`
            }]);
          }
        }
      }

      showToast(`¡Venta Exitosa! Ticket #${ticketNumber} (Bs. ${initialPaymentBs.toLocaleString('es-VE', {minimumFractionDigits:2})})`, 'success');
      setCart([]);
      fetchCatalog();
      if (activeSession) calculateTurnSales(activeSession.opened_at, bcvRate);
      fetchPosMovements();
    } catch (err) {
      showToast('Error al procesar: ' + err.message, 'error');
    } finally {
      setProcessingSale(false);
    }
  }

  async function handleOpenRegister() {
    const amtBs = parseFloat(openingCashInput);
    if (isNaN(amtBs) || amtBs < 0) return showToast('Ingresa un monto base en Bolívares válido', 'error');

    const amtUsd = amtBs / bcvRate;

    const { error } = await supabase.from('cash_register_sessions').insert([{
      opening_cash: amtUsd,
      status: 'OPEN',
      opened_at: new Date().toISOString()
    }]).select().single();

    if (!error) {
      showToast('¡Caja Abierta Registrada en Bolívares!', 'success');
      setShowCashModal(false);
      setOpeningCashInput('');
      checkActiveCashSession();
    } else {
      showToast('Error abriendo caja: ' + error.message, 'error');
    }
  }

  async function handleCloseRegister() {
    if (!activeSession) return;

    const countedCashBs = parseFloat(actualCashBs) || 0;
    const countedPMBs = parseFloat(actualPagoMovilBs) || 0;
    const countedTarjetaBs = parseFloat(actualTarjetaBs) || 0;

    const openingCashBs = (activeSession.opening_cash || 0) * bcvRate;
    const expectedCashBs = openingCashBs + turnSales.efectivoBs;
    const expectedGrandBs = expectedCashBs + turnSales.pagoMovilBs + turnSales.tarjetaBs + turnSales.casheaBs;
    
    const actualGrandBs = countedCashBs + countedPMBs + countedTarjetaBs + turnSales.casheaBs;
    const diffBs = actualGrandBs - expectedGrandBs;
    const diffUsd = diffBs / bcvRate;

    const { error } = await supabase.from('cash_register_sessions').update({
      closing_cash_expected: expectedCashBs / bcvRate,
      closing_cash_actual: countedCashBs / bcvRate,
      total_pago_movil: countedPMBs / bcvRate,
      total_tarjeta: countedTarjetaBs / bcvRate,
      total_sales_usd: turnSales.totalUsd,
      difference: diffUsd,
      status: 'CLOSED',
      closed_at: new Date().toISOString()
    }).eq('id', activeSession.id);

    if (!error) {
      showToast('¡Caja cerrada correctamente con arqueo en Bolívares!', 'success');
      setShowCashModal(false);
      setActualCashBs(''); setActualPagoMovilBs(''); setActualTarjetaBs('');
      checkActiveCashSession();
    } else {
      showToast('Error al cerrar caja: ' + error.message, 'error');
    }
  }

  if (!mounted) return null;
  if (checkingAuth) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center font-bold">
      Verificando acceso...
    </div>
  );
}
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0b0c0e] text-white font-sans overflow-hidden relative">
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-xl border text-xs ${toast.type === 'success' ? 'bg-[#3b5336] border-[#6b8e23]' : 'bg-rose-950 border-rose-500'}`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* CATÁLOGO IZQUIERDA */}
      <div className="flex-1 p-4 lg:p-5 flex flex-col border-b lg:border-b-0 lg:border-r border-[#1a1d24] overflow-hidden">
        <header className="flex flex-wrap justify-between items-center gap-3 mb-4">
          
          {/* Logo con imagen y texto adaptado a la barra superior */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-[#d4af37]/40 bg-[#121418] shrink-0">
              <img 
                src="/logo/logo.jpg" 
                alt="Inversiones EJ" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-white font-extrabold text-sm tracking-wider leading-none">
                INVERSIONES <span className="text-[#d4af37] text-base">EJ</span>
              </span>
              <span className="text-[#d4af37] text-[10px] font-bold tracking-widest mt-0.5 uppercase">
                ROPA DE CABALLERO
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${activeSession ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'}`}>
                  {activeSession ? '🟢 CAJA ABIERTA' : '🔴 CAJA CERRADA'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowCashModal(true)} className="text-[10px] bg-[#121418] text-amber-400 border border-amber-500/40 px-2.5 py-1.5 rounded-xl font-bold hover:bg-[#181a20]">
              💵 {activeSession ? 'Cierre / Arqueo Bs' : 'Abrir Caja Bs'}
            </button>
            <button onClick={() => { fetchPosMovements(); setShowMovementsModal(true); }} className="text-[10px] bg-[#121418] text-[#cca152] border border-[#cca152]/40 px-2.5 py-1.5 rounded-xl font-bold hover:bg-[#181a20]">
              📋 Movimientos
            </button>
            <button onClick={() => setShowWebOrdersModal(true)} className={`relative text-[10px] px-3 py-1.5 rounded-xl border font-bold ${pendingWebOrdersCount > 0 ? 'bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse' : 'bg-[#121418] border-[#cca152]/30 text-gray-300'}`}>
              🌐 Compras Web {pendingWebOrdersCount > 0 && <span className="bg-rose-600 text-white text-[9px] px-1.5 rounded-full ml-1">{pendingWebOrdersCount}</span>}
            </button>
            <button onClick={fetchLiveBcvRate} className="text-[10px] bg-[#121418] text-[#cca152] border border-[#cca152]/40 px-2.5 py-1.5 rounded-xl font-bold">Tasa BCV: {bcvRate} Bs</button>
          </div>
        </header>

        <div className="mb-4">
          <input type="text" placeholder="🔍 Buscar por serial o nombre..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-[#121418] border border-[#1a1d24] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#cca152]" />
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? <div className="text-center text-gray-500 py-12 text-xs">Cargando catálogo...</div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {filteredProducts.map(p => {
                const stock = p.product_variants?.[0]?.stock_quantity || 0;
                const priceBs = p.price * bcvRate;
                return (
                  <div key={p.id} onClick={() => setSelectedProductModal(p)} className="bg-[#121418] border border-[#1a1d24] hover:border-[#cca152]/50 p-2.5 rounded-xl cursor-pointer flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-mono text-[#cca152]">{p.serial_code}</span>
                        <span className={`text-[9px] px-1.5 rounded ${stock > 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>{stock > 0 ? `${stock} uds` : 'Agotado'}</span>
                      </div>
                      <div className="w-full h-20 bg-[#0b0c0e] rounded border border-[#1a1d24] mb-2 flex items-center justify-center overflow-hidden">
                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" /> : <span className="text-[9px] text-gray-600">Sin Foto</span>}
                      </div>
                      <h3 className="text-xs font-bold line-clamp-1">{p.name}</h3>
                    </div>
                    <div className="flex flex-col pt-1 border-t border-[#1a1d24] mt-2">
                      <span className="text-xs font-bold text-white">Bs. {priceBs.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                      <span className="text-[9px] text-gray-400">Ref: ${p.price} USD</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CARRITO DERECHA */}
      <div className="w-full lg:w-[420px] bg-[#0e1013] p-4 flex flex-col justify-between border-l border-[#1a1d24]">
        <div className="flex justify-between items-center border-b border-[#1a1d24] pb-2 mb-2">
          <h2 className="text-xs font-bold uppercase">🛒 Factura Actual (Bolívares)</h2>
          <span className="text-[11px] text-[#cca152] font-mono">{cart.length} ítems</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {cart.length === 0 ? <div className="text-center text-gray-500 py-12 text-xs">Carrito vacío</div> : (
            cart.map((item, idx) => {
              const itemBs = item.subtotal * bcvRate;
              return (
                <div key={idx} className="bg-[#121418] p-2.5 rounded-xl border border-[#1a1d24] flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono text-[#cca152]">{item.serial_code}</span>
                    <h4 className="text-xs font-bold line-clamp-1">{item.name}</h4>
                    <span className="text-[11px] text-white font-bold">Bs. {itemBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</span>
                    <span className="text-[9px] text-gray-400 ml-1">(${item.subtotal} USD)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#0b0c0e] border border-[#1a1d24] rounded px-1.5 py-0.5">
                    <button onClick={() => updateQuantity(idx, -1)} className="text-xs text-gray-400 font-bold">-</button>
                    <span className="text-xs font-bold px-1">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, 1)} className="text-xs text-gray-400 font-bold">+</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-[#1a1d24] pt-2 space-y-2">
          <div className="bg-[#121418] p-2.5 rounded-xl border border-[#cca152]/30 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#cca152]">💳 Financiamiento Cashea</span>
              <input type="checkbox" checked={useCashea} onChange={e => setUseCashea(e.target.checked)} className="accent-[#cca152]" />
            </div>
            {useCashea && (
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-6 gap-1">
                  {[1,2,3,4,5,6].map(l => (
                    <button key={l} onClick={() => setCasheaLevel(l)} className={`py-0.5 text-[10px] font-bold rounded ${casheaLevel === l ? 'bg-[#cca152] text-black' : 'bg-[#0b0c0e] text-gray-300'}`}>{l}</button>
                  ))}
                </div>
                <p className="text-[9px] text-amber-400 text-right">Inicial Nivel {casheaLevel}: <strong>Bs. {initialPaymentBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</strong></p>
              </div>
            )}
          </div>

          {/* SECCIÓN DE BOLÍVARES: Doble altura y compacto */}
          <div className="bg-[#121418] p-6 rounded-xl border border-gray-700 space-y-2">
            <span className="text-[10px] uppercase text-gray-400 block font-semibold tracking-wide">Total a Facturar (Contabilidad Oficial)</span>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-2xl font-extrabold text-white font-mono">Bs. {initialPaymentBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</span>
              <span className="text-xs text-gray-400">Ref: ${initialPaymentUsd.toFixed(2)} USD</span>
            </div>
          </div>

          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-[#121418] border border-[#1a1d24] rounded-lg p-2 text-xs text-white">
            <option value="Efectivo (Bs / USD)">Efectivo (Bs / USD)</option>
            <option value="Pago Móvil">Pago Móvil</option>
            <option value="Puntos / Tarjeta">Tarjeta / Puntos</option>
          </select>

          {/* Botón Principal de Cobro en verde */}
          <button onClick={handleCheckout} disabled={processingSale || cart.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-extrabold uppercase text-xs transition shadow-lg">
            {processingSale ? 'Procesando...' : '🖨️ Cobrar y Facturar (Bs)'}
          </button>

          <button onClick={() => window.location.reload()} className="w-full bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 py-2 rounded-xl font-bold uppercase text-xs transition">
            ❌ Cancelar / Recargar
          </button>
        </div>
      </div>

      {/* MODAL GESTIÓN DE CAJA */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#121418] border border-[#cca152]/40 rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col text-white shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-[#0e1013]">
              <div>
                <h2 className="text-base font-bold text-[#cca152] uppercase tracking-wide">💵 Gestión, Arqueo y Cierre de Caja en Bolívares (BCV: {bcvRate})</h2>
                <p className="text-xs text-gray-400">Control estricto contable y bancario de turnos de caja</p>
              </div>
              <button onClick={() => setShowCashModal(false)} className="text-gray-400 hover:text-white text-base font-bold bg-[#181a20] px-3.5 py-1.5 rounded-xl border border-gray-800 transition">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!activeSession ? (
                <div className="max-w-xl mx-auto space-y-5 pt-8">
                  <div className="bg-[#0b0c0e] p-6 rounded-2xl border border-gray-800 space-y-3">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase">🔓 Apertura de Turno</h3>
                    <label className="text-xs text-gray-300 font-semibold block">Monto Base Inicial en Gaveta (Bolívares - Bs)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Ej: 10000.00" 
                      value={openingCashInput} 
                      onChange={e => setOpeningCashInput(e.target.value)} 
                      className="w-full bg-[#121418] border border-[#cca152]/40 rounded-xl p-3.5 text-sm text-white font-mono font-bold focus:outline-none" 
                    />
                  </div>
                  <button onClick={handleOpenRegister} className="w-full bg-[#3b5336] hover:bg-[#466341] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg">
                    🔓 Registrar Apertura de Caja
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-[#0b0c0e] p-5 rounded-2xl border border-gray-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                      <h3 className="text-xs uppercase font-extrabold text-[#cca152] tracking-wider">📊 Totales Esperados en Sistema (Bolívares)</h3>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">Turno Abierto</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="bg-[#121418] p-3.5 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-400 block uppercase">Base Inicial</span>
                        <strong className="text-white font-mono text-sm">Bs. {((activeSession.opening_cash || 0) * bcvRate).toLocaleString('es-VE', {minimumFractionDigits:2})}</strong>
                      </div>
                      <div className="bg-[#121418] p-3.5 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-400 block uppercase">Ventas Efectivo</span>
                        <strong className="text-white font-mono text-sm">Bs. {turnSales.efectivoBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</strong>
                      </div>
                      <div className="bg-[#121418] p-3.5 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-400 block uppercase">Ventas Pago Móvil</span>
                        <strong className="text-white font-mono text-sm">Bs. {turnSales.pagoMovilBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</strong>
                      </div>
                      <div className="bg-[#121418] p-3.5 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-400 block uppercase">Ventas Tarjeta / Puntos</span>
                        <strong className="text-white font-mono text-sm">Bs. {turnSales.tarjetaBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</strong>
                      </div>
                      <div className="bg-[#121418] p-3.5 rounded-xl border border-gray-800">
                        <span className="text-[10px] text-gray-400 block uppercase">Ventas Cashea</span>
                        <strong className="text-amber-400 font-mono text-sm">Bs. {turnSales.casheaBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</strong>
                      </div>
                      <div className="bg-[#181a20] p-3.5 rounded-xl border border-[#cca152]/40 flex flex-col justify-center">
                        <span className="text-[10px] text-[#cca152] block uppercase font-bold">Total Recaudado Turno</span>
                        <strong className="text-white font-mono text-base font-extrabold">Bs. {turnSales.totalBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0b0c0e] p-5 rounded-2xl border border-gray-800 space-y-4">
                    <div className="border-b border-gray-800 pb-2">
                      <h3 className="text-xs uppercase font-extrabold text-gray-300 tracking-wider">📝 Declaración de Conteo Físico en Gaveta</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-gray-400 block text-xs mb-1.5 font-semibold">Efectivo Físico Contado (Bs)</label>
                        <input type="number" step="0.01" placeholder="0.00" value={actualCashBs} onChange={e => setActualCashBs(e.target.value)} className="w-full bg-[#121418] border border-gray-700 rounded-xl p-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-[#cca152]" />
                      </div>
                      <div>
                        <label className="text-gray-400 block text-xs mb-1.5 font-semibold">Total Pago Móvil (Bs)</label>
                        <input type="number" step="0.01" placeholder="0.00" value={actualPagoMovilBs} onChange={e => setActualPagoMovilBs(e.target.value)} className="w-full bg-[#121418] border border-gray-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-[#cca152]" />
                      </div>
                      <div>
                        <label className="text-gray-400 block text-xs mb-1.5 font-semibold">Total Tarjeta / Puntos (Bs)</label>
                        <input type="number" step="0.01" placeholder="0.00" value={actualTarjetaBs} onChange={e => setActualTarjetaBs(e.target.value)} className="w-full bg-[#121418] border border-gray-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-[#cca152]" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button onClick={handleCloseRegister} className="w-full bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/40 py-4 rounded-xl font-extrabold uppercase text-xs tracking-wider transition shadow-xl">
                      🔒 Procesar Cierre Definitivo de Caja en Bolívares
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-gray-800 bg-[#0e1013] flex justify-between items-center text-xs">
              <span className="text-gray-500">Módulo Oficial de Caja — Inversiones EJ</span>
              <button onClick={() => setShowCashModal(false)} className="bg-[#181a20] hover:bg-[#22252d] text-gray-300 px-6 py-2 rounded-xl font-bold border border-gray-800 transition">Cerrar Ventana</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MOVIMIENTOS KARDEX */}
      {showMovementsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-[#121418] border border-[#cca152]/40 rounded-2xl w-[96vw] h-[92vh] max-w-none p-6 text-white flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <div>
                <h2 className="text-base font-bold text-[#cca152] uppercase tracking-wide">📋 Historial de Movimientos / Kardex</h2>
                <p className="text-xs text-gray-400">Auditoría detallada de inventario en tiempo real</p>
              </div>
              <button onClick={() => setShowMovementsModal(false)} className="text-gray-400 hover:text-white text-lg font-bold bg-[#181a20] px-4 py-1.5 rounded-xl border border-gray-800 transition">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto my-4 pr-1">
              {posMovements.length === 0 ? (
                <div className="text-center text-gray-500 py-32 text-xs">No hay movimientos registrados todavía.</div>
              ) : (
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#0b0c0e] text-[11px] uppercase text-gray-400 border-b border-gray-800 sticky top-0 z-10">
                    <tr>
                      <th className="p-3.5">Fecha / Hora</th>
                      <th className="p-3.5">Tipo de Movimiento</th>
                      <th className="p-3.5">Detalle / Referencia</th>
                      <th className="p-3.5 text-center">Cantidad</th>
                      <th className="p-3.5 text-right">Stock Resultante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {posMovements.map(m => (
                      <tr key={m.id} className="hover:bg-[#181a20]/60 transition">
                        <td className="p-3.5 font-mono text-[11px] text-gray-400">{new Date(m.created_at).toLocaleString('es-VE')}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono ${
                            m.movement_type?.includes('VENTA') ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30' : 
                            m.movement_type?.includes('AJUSTE') ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30' : 
                            'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {m.movement_type}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-200">
                          <span className="font-medium">{m.reason || 'Sin observaciones'}</span>
                          {m.reference_code && <span className="block text-[10px] font-mono text-[#cca152] mt-0.5">Ref: {m.reference_code}</span>}
                        </td>
                        <td className={`p-3.5 text-center font-bold font-mono text-sm ${m.quantity_change > 0 ? 'text-[#cca152]' : 'text-rose-400'}`}>
                          {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                        </td>
                        <td className="p-3.5 text-right font-bold text-[#cca152] font-mono text-sm">{m.stock_after ?? '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-3 border-t border-gray-800 flex justify-between items-center text-xs">
              <span className="text-gray-500">Registros en tiempo real</span>
              <button onClick={() => setShowMovementsModal(false)} className="bg-[#181a20] hover:bg-[#22252d] text-gray-200 px-6 py-2.5 rounded-xl font-bold border border-gray-800 transition">Cerrar Ventana</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE PRODUCTO */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121418] border border-[#cca152]/40 rounded-2xl max-w-xs w-full p-4 text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-mono text-[#cca152]">{selectedProductModal.serial_code}</span>
              <button onClick={() => setSelectedProductModal(null)} className="text-gray-400">✕</button>
            </div>
            <div className="w-full h-40 bg-[#0b0c0e] rounded mb-3 flex items-center justify-center overflow-hidden">
              {selectedProductModal.image_url ? <img src={selectedProductModal.image_url} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-500">Sin Imagen</span>}
            </div>
            <h3 className="text-sm font-bold mb-2">{selectedProductModal.name}</h3>
            <div className="flex flex-col mb-4 text-xs">
              <span className="text-white font-bold text-sm">Bs. {(selectedProductModal.price * bcvRate).toLocaleString('es-VE', {minimumFractionDigits:2})}</span>
              <span className="text-gray-400 text-[10px]">Ref: ${selectedProductModal.price} USD | Stock: {selectedProductModal.product_variants?.[0]?.stock_quantity || 0} uds</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSelectedProductModal(null)} className="bg-rose-950 text-rose-300 py-2 rounded text-xs font-bold">Cancelar</button>
              <button onClick={() => addToCart(selectedProductModal)} className="bg-[#cca152] text-black py-2 rounded text-xs font-bold">Agregar</button>
            </div>
          </div>
        </div>
      )}

      <WebOrdersModal isOpen={showWebOrdersModal} onClose={() => { setShowWebOrdersModal(false); fetchCatalog(); }} onStockUpdated={() => fetchCatalog()} />
    </div>
  );
}