'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';


export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [cashSessions, setCashSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  

  // Tasa BCV oficial
  const [bcvRate, setBcvRate] = useState(879.1225);

  // Consulta de Ventas por Fecha
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [dateSales, setDateSales] = useState([]);
  const [queryRevenue, setQueryRevenue] = useState(0);

  // Modal para reporte impreso / PDF de caja
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [sessionSalesList, setSessionSalesList] = useState([]);
  const [loadingSessionDetail, setLoadingSessionDetail] = useState(false);

  // Modal para edición directa de stock
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [manualStockInput, setManualStockInput] = useState('');

  // Notificaciones Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  function showToast(message, type = 'success') {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  }

  // Creación de producto
  const [name, setName] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [generatedSerial, setGeneratedSerial] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [size, setSize] = useState('M');
  const [stock, setStock] = useState('1');
  const [saving, setSaving] = useState(false);

  // Eliminación de producto
  const [searchSerial, setSearchSerial] = useState('');
  const [foundProduct, setFoundProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

useEffect(() => {
    async function checkUserSession() {
      const email = localStorage.getItem('ej_user_email');
      if (!email) {
        window.location.href = '/admin/login'; // <--- Cambio 1: Redirección dura
      } else {
        const role = localStorage.getItem('ej_user_role') || 'ADMIN';
        setUserRole(role);
        setUserEmail(email);
        setCheckingAuth(false);                 // <--- Cambio 2: ¡Quitamos el estado de carga!
        fetchAllData();
        fetchLiveBcvRate();
      }
    }
    checkUserSession();
  }, []);

  async function checkUserSession() {
    const email = localStorage.getItem('ej_user_email');
    if (!email) {
    router.push('/admin/login');
  } else {
    const role = localStorage.getItem('ej_user_role') || 'ADMIN';
    setUserRole(role);
    setUserEmail(email);
    fetchAllData();
    fetchLiveBcvRate();
  }
}

  useEffect(() => {
    calculateNextSerial(selectedLetter);
  }, [selectedLetter, products]);

  async function fetchLiveBcvRate() {
    try {
      const res = await fetch('/api/bcv');
      const json = await res.json();
      if (json && json.price) setBcvRate(parseFloat(json.price));
    } catch (err) {
      setBcvRate(879.1225);
    }
  }

  async function fetchAllData() {
    setLoading(true);
    await Promise.all([
      fetchProducts(),
      fetchMovements(),
      fetchCashSessions(),
      fetchRevenueByDate(selectedDate, true),
    ]);
    setLoading(false);
  }

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*, product_variants(*)');
    if (data) setProducts(data);
  }

  async function fetchMovements() {
    const { data } = await supabase.from('inventory_movements').select('*').order('created_at', { ascending: false });
    if (data) setMovements(data);
  }

  async function fetchCashSessions() {
    const { data } = await supabase.from('cash_register_sessions').select('*').order('opened_at', { ascending: false });
    if (data) setCashSessions(data);
  }

  async function fetchRevenueByDate(dateStr, isInitialToday = false) {
    if (!dateStr) return;
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false });

    const total = (sales || []).reduce((acc, curr) => acc + (parseFloat(curr.total_usd) || 0), 0);
    
    setDateSales(sales || []);
    setQueryRevenue(total);

    if (isInitialToday) {
      setTodayRevenue(total);
    }
  }

  function handleConsultDate(e) {
    e.preventDefault();
    fetchRevenueByDate(selectedDate);
    showToast(`Consulta realizada para: ${formatDateDisplay(selectedDate)}`, 'success');
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  async function handleOpenSessionDetail(session) {
    setSelectedSessionDetail(session);
    setLoadingSessionDetail(true);

    const start = session.opened_at;
    const end = session.closed_at || new Date().toISOString();

    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: true });

    setSessionSalesList(sales || []);
    setLoadingSessionDetail(false);
  }

  function calculateNextSerial(prefix) {
    const existingSerials = products.map(p => p.serial_code).filter(code => code && code.toUpperCase().startsWith(`${prefix}-`));
    let nextNum = 1;
    if (existingSerials.length > 0) {
      const nums = existingSerials.map(c => parseInt(c.split('-')[1], 10) || 0).sort((a,b)=>a-b);
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] === nextNum) nextNum++;
        else if (nums[i] > nextNum) break;
      }
    }
    setGeneratedSerial(`${prefix}-${String(nextNum).padStart(4, '0')}`);
  }

  function convertImageToBase64(file) {
    return new Promise((resolve) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
    });
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    if (!name || !category || !price) return showToast('Completa los campos requeridos', 'error');
    setSaving(true);
    try {
      let imageUrl = null;
      if (imageFile) imageUrl = await convertImageToBase64(imageFile);

      const { data: newProd, error: prodErr } = await supabase.from('products').insert([{ name: name.trim(), serial_code: generatedSerial, prefix: selectedLetter, category: category.trim(), price: parseFloat(price), image_url: imageUrl }]).select().single();
      if (prodErr) throw prodErr;

      const { data: newVar, error: varErr } = await supabase.from('product_variants').insert([{ product_id: newProd.id, size: size.toUpperCase().trim(), sku_variant: `${generatedSerial}-${size.toUpperCase().trim()}`, stock_quantity: parseInt(stock, 10) || 1 }]).select().single();
      if (varErr) throw varErr;

      await supabase.from('inventory_movements').insert([{
        product_variant_id: newVar.id,
        movement_type: 'CREACION_PRODUCTO',
        quantity_change: parseInt(stock, 10) || 1,
        stock_after: parseInt(stock, 10) || 1,
        reference_code: generatedSerial,
        reason: `Creado por [${userRole}]: ${generatedSerial} - ${name.trim()}`
      }]);

      showToast(`¡Producto registrado con éxito!`, 'success');
      setName(''); setPrice(''); setCategory(''); setImageFile(null);
      fetchAllData();
      setActiveTab('inventory');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleSearchForDelete(e) {
    e.preventDefault();
    const q = searchSerial.trim().toUpperCase();
    const p = products.find(prod => prod.serial_code.toUpperCase() === q);
    if (p) setFoundProduct(p);
    else { setFoundProduct(null); showToast(`Serial "${q}" no encontrado`, 'error'); }
  }

async function handleDeleteConfirmed() {
    if (!foundProduct) return;
    setDeleting(true);

    try {
      // 1. Opcional pero recomendado: Eliminamos primero las variantes asociadas a este producto
      const { error: varError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', foundProduct.id);

      if (varError) {
        console.warn("Aviso al borrar variantes:", varError.message);
      }

      // 2. Procedemos a eliminar el producto principal de la tabla 'products'
      const { error: prodError } = await supabase
        .from('products')
        .delete()
        .eq('id', foundProduct.id);

      if (prodError) throw prodError;

      // 3. Registramos el movimiento en el Kardex
      await supabase.from('inventory_movements').insert([{
        movement_type: 'ELIMINACION_PRODUCTO',
        quantity_change: 0,
        reason: `Eliminado por [${userRole}]: Serial liberado ${foundProduct.serial_code} (${foundProduct.name})`
      }]);

      showToast(`¡Producto eliminado! El serial ${foundProduct.serial_code} ha quedado libre.`, 'success');
      setFoundProduct(null);
      setSearchSerial('');
      fetchAllData(); // Recargamos el catálogo y los datos
    } catch (err) {
      showToast('Error al eliminar producto: ' + err.message, 'error');
    } finally {
      setDeleting(false);
    }
  }
  async function handleSaveStockAdjustment() {
    if (!editingProduct) return;
    const newStockVal = parseInt(manualStockInput, 10);
    if (isNaN(newStockVal) || newStockVal < 0) return showToast('Ingresa una cantidad válida', 'error');

    const variant = editingProduct.product_variants?.[0];
    if (!variant) return showToast('El producto no tiene variante asociada', 'error');

    const oldStock = variant.stock_quantity || 0;
    const diff = newStockVal - oldStock;

    const { error } = await supabase
      .from('product_variants')
      .update({ stock_quantity: newStockVal })
      .eq('id', variant.id);

    if (!error) {
      await supabase.from('inventory_movements').insert([{
        product_variant_id: variant.id,
        movement_type: 'AJUSTE_ADMIN',
        quantity_change: diff,
        stock_after: newStockVal,
        reference_code: editingProduct.serial_code,
        reason: `Ajuste manual por [${userRole}] (${editingProduct.serial_code})`
      }]);

      showToast(`¡Stock actualizado con éxito!`, 'success');
      setShowEditStockModal(false);
      setEditingProduct(null);
      fetchAllData();
    } else {
      showToast('Error al actualizar stock: ' + error.message, 'error');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem('ej_user_role');
    localStorage.removeItem('ej_user_email');
    router.push('/admin/login');
  }

  const alphabetLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  if (!userRole) return null;
  // Ponemos el bloqueo de seguridad aquí:
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-bold">
        Verificando acceso...
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-[#0b0c0e] text-white font-sans relative">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section {
            position: absolute; left: 0; top: 0; width: 100%;
            background-color: white !important; color: black !important; padding: 20px;
          }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc !important; color: black !important; padding: 8px !important; }
        }
      `}</style>

      {toast.show && (
        <div className="fixed top-6 right-6 z-50 animate-bounce no-print">
          <div className={`px-5 py-3 rounded-xl border text-xs ${toast.type === 'success' ? 'bg-[#121418] border-[#cca152]' : 'bg-rose-950 border-rose-500'}`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* SIDEBAR ADMIN */}
      <aside className="w-64 bg-[#0e1013] border-r border-[#1a1d24] p-6 flex flex-col justify-between no-print">
        <div>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center border border-[#d4af37]/40 bg-[#121418] shrink-0">
              <img src="/logo/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-white font-extrabold text-xs tracking-wider leading-none">
                INVERSIONES <span className="text-[#d4af37] text-sm">EJ</span>
              </span>
              <span className="text-[#d4af37] text-[9px] font-bold tracking-widest mt-0.5 uppercase">
                ROPA DE CABALLERO
              </span>
            </div>
          </div>

          <div className="bg-[#121418] border border-gray-800 rounded-xl p-2.5 mb-6 text-center space-y-0.5">
            <span className="text-[10px] text-gray-400 block uppercase">Sesión Activa</span>
            <span className="text-xs font-bold font-mono text-amber-400">
                ADMINISTRADOR
            </span>
            <span className="text-[9px] text-gray-400 block truncate">{userEmail}</span>
          </div>

          <nav className="space-y-1.5 text-xs">
            <button onClick={() => setActiveTab('inventory')} className={`w-full text-left px-4 py-2.5 rounded-lg font-semibold uppercase ${activeTab === 'inventory' ? 'bg-[#181a20] text-[#cca152] border border-[#cca152]/40' : 'text-gray-400'}`}>📦 Inventario & Alertas</button>
            <button onClick={() => setActiveTab('new-product')} className={`w-full text-left px-4 py-2.5 rounded-lg font-semibold uppercase ${activeTab === 'new-product' ? 'bg-[#181a20] text-[#cca152] border border-[#cca152]/40' : 'text-gray-400'}`}>➕ Agregar Producto</button>
            <button onClick={() => setActiveTab('delete-product')} className={`w-full text-left px-4 py-2.5 rounded-lg font-semibold uppercase ${activeTab === 'delete-product' ? 'bg-[#181a20] text-rose-400 border border-rose-500/30' : 'text-gray-400'}`}>🗑️ Eliminar Producto</button>
            <button onClick={() => setActiveTab('cash-history')} className={`w-full text-left px-4 py-2.5 rounded-lg font-semibold uppercase ${activeTab === 'cash-history' ? 'bg-[#181a20] text-[#cca152] border border-[#cca152]/40' : 'text-gray-400'}`}>💵 Movimientos de Caja (Bs)</button>
            <button onClick={() => { setActiveTab('movements'); fetchMovements(); }} className={`w-full text-left px-4 py-2.5 rounded-lg font-semibold uppercase ${activeTab === 'movements' ? 'bg-[#181a20] text-[#cca152] border border-[#cca152]/40' : 'text-gray-400'}`}>🔄 Movimientos (Kardex)</button>
          </nav>
        </div>

        <div className="border-t border-[#1a1d24] pt-4 space-y-2">
          {/* NUEVOS BOTONES DE ACCESO RÁPIDO */}
          <div className="grid grid-cols-2 gap-2 pb-2">
            <a href="/" className="bg-[#181a20] hover:bg-[#22252d] text-gray-300 border border-gray-700 py-2 rounded-xl text-[11px] font-bold text-center transition uppercase flex items-center justify-center gap-1">
              pagina Web
            </a>
            <a href="/pos" className="bg-[#181a20] hover:bg-[#22252d] text-gray-300 border border-gray-700 py-2 rounded-xl text-[11px] font-bold text-center transition uppercase flex items-center justify-center gap-1">
              CAJA VENTA
            </a>
            
          </div>

          <button onClick={handleLogout} className="w-full bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 py-2 rounded-xl text-xs font-bold uppercase transition">
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO ADMIN */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-wrap justify-between items-center gap-4 mb-8 pb-4 border-b border-[#1a1d24] no-print">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Control Administrativo</h1>
            <p className="text-xs text-gray-400 mt-1">
              Vendido Hoy en Bolívares: <strong className="text-white text-sm font-mono">Bs. {(todayRevenue * bcvRate).toLocaleString('es-VE', {minimumFractionDigits:2})}</strong> <span className="text-gray-500">(Ref: ${todayRevenue.toFixed(2)} USD)</span>
            </p>
          </div>

          <form onSubmit={handleConsultDate} className="flex items-center gap-2 bg-[#121418] border border-[#cca152]/30 p-2 rounded-xl">
            <span className="text-xs text-[#cca152] font-semibold pl-1">Consultar Fecha:</span>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              className="bg-[#0b0c0e] border border-gray-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#cca152]" 
            />
            <button type="submit" className="bg-[#cca152] hover:bg-[#b88f43] text-black font-bold text-xs px-3 py-1 rounded-lg transition">
              🔍 Consultar
            </button>
          </form>
        </header>

        {selectedDate && (
          <div className="mb-6 p-4 bg-[#121418] border border-gray-800 rounded-xl flex justify-between items-center text-xs no-print">
            <div>
              <span className="text-gray-400">Resultados de Ventas del día: </span>
              <strong className="text-[#cca152] font-mono text-sm ml-1">{formatDateDisplay(selectedDate)}</strong>
            </div>
            <div>
              <span className="text-gray-400">Total Recaudado: </span>
              <strong className="text-white font-mono text-base ml-1">Bs. {(queryRevenue * bcvRate).toLocaleString('es-VE', {minimumFractionDigits:2})}</strong>
              <span className="text-gray-500 ml-2">({dateSales.length} ventas)</span>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold uppercase text-gray-200">Catálogo e Indicadores de Stock ({products.length})</h2>
            <div className="bg-[#121418] rounded-xl border border-[#1a1d24] overflow-hidden">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-[#0e1013] text-[11px] uppercase text-gray-400 border-b border-[#1a1d24]">
                  <tr>
                    <th className="p-4">Foto</th>
                    <th className="p-4">Serial</th>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Precio (Bs / USD)</th>
                    <th className="p-4">Stock Actual</th>
                    <th className="p-4">Estatus Stock</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1d24]">
                  {products.map(item => {
                    const totalStock = item.product_variants?.reduce((acc, v) => acc + v.stock_quantity, 0) || 0;
                    let badgeColor = 'bg-emerald-950 text-emerald-400 border-emerald-500/30';
                    let statusText = '🟢 Normal';
                    if (totalStock === 0) {
                      badgeColor = 'bg-rose-950 text-rose-400 border-rose-500/30';
                      statusText = '🔴 Sin Stock';
                    } else if (totalStock <= 3) {
                      badgeColor = 'bg-amber-950 text-amber-400 border-amber-500/30';
                      statusText = '🟡 Stock Bajo';
                    }

                    return (
                      <tr key={item.id} className="hover:bg-[#181a20]/60">
                        <td className="p-4">{item.image_url ? <img src={item.image_url} className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 bg-[#0b0c0e] rounded text-[9px] flex items-center justify-center text-gray-500">Sin foto</div>}</td>
                        <td className="p-4 font-mono text-xs text-[#cca152] font-bold">{item.serial_code}</td>
                        <td className="p-4 font-medium text-white">{item.name}</td>
                        <td className="p-4 text-xs uppercase">{item.category}</td>
                        <td className="p-4 font-semibold text-white">
                          Bs. {(item.price * bcvRate).toLocaleString('es-VE', {minimumFractionDigits:2})}
                          <span className="block text-[10px] text-gray-400">Ref: ${item.price} USD</span>
                        </td>
                        <td className="p-4 font-bold">{totalStock} uds.</td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${badgeColor}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => {
                              setEditingProduct(item);
                              setManualStockInput(totalStock.toString());
                              setShowEditStockModal(true);
                            }} 
                            className="bg-[#181a20] hover:bg-[#22252d] text-amber-400 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                          >
                            ✏️ Editar Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'new-product' && (
          <div className="max-w-2xl bg-[#121418] p-6 rounded-xl border border-[#1a1d24]">
            <h2 className="text-base font-semibold mb-4 uppercase text-gray-100">Registrar Nuevo Producto</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Letra de Referencia</label>
                <div className="grid grid-cols-9 gap-1 max-h-32 overflow-y-auto p-2 bg-[#0b0c0e] rounded border border-[#1a1d24]">
                  {alphabetLetters.map(l => (
                    <button key={l} type="button" onClick={() => setSelectedLetter(l)} className={`py-1 text-xs font-bold rounded ${selectedLetter === l ? 'bg-[#cca152] text-black' : 'bg-[#181a20] text-gray-300'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="bg-[#0b0c0e] p-3 rounded border border-[#cca152]/30">
                <span className="text-xs text-gray-400">Serial Automático: <strong className="text-[#cca152] text-base">{generatedSerial}</strong></span>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Foto</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-xs text-gray-400 bg-[#0b0c0e] border border-[#1a1d24] rounded p-2" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0b0c0e] border border-[#1a1d24] rounded p-2.5 text-xs text-white" required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Categoría</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#0b0c0e] border border-[#1a1d24] rounded p-2.5 text-xs text-white" required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-xs text-gray-400 mb-1">Precio Ref ($)</label><input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-[#0b0c0e] border border-[#1a1d24] rounded p-2 text-xs text-white" required /></div>
                <div><label className="block text-xs text-gray-400 mb-1">Talla</label><input type="text" value={size} onChange={e => setSize(e.target.value)} className="w-full bg-[#0b0c0e] border border-[#1a1d24] rounded p-2 text-xs text-white" required /></div>
                <div><label className="block text-xs text-gray-400 mb-1">Stock</label><input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full bg-[#0b0c0e] border border-[#1a1d24] rounded p-2 text-xs text-white" required /></div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#181a20] text-[#cca152] border border-[#cca152]/40 text-xs py-3 rounded font-bold uppercase">{saving ? 'Guardando...' : 'Registrar Producto'}</button>
            </form>
          </div>
        )}

        {activeTab === 'delete-product' && (
          <div className="max-w-2xl bg-[#121418] p-6 rounded-xl border border-rose-500/20">
            <h2 className="text-base font-semibold mb-4 text-rose-400 uppercase">Eliminar por Serial</h2>
            <form onSubmit={handleSearchForDelete} className="flex gap-2 mb-4">
              <input type="text" placeholder="Ej: A-0001" value={searchSerial} onChange={e => setSearchSerial(e.target.value)} className="flex-1 bg-[#0b0c0e] border border-[#1a1d24] rounded p-2 text-xs text-white uppercase" required />
              <button type="submit" className="bg-[#181a20] text-gray-200 text-xs px-4 py-2 rounded font-bold">Buscar</button>
            </form>
            {foundProduct && (
              <div className="bg-[#0b0c0e] p-4 rounded border border-gray-800 flex justify-between items-center text-xs">
                <div><strong className="text-[#cca152]">{foundProduct.serial_code}</strong> — {foundProduct.name} (${foundProduct.price})</div>
                <button onClick={handleDeleteConfirmed} disabled={deleting} className="bg-rose-950 text-rose-300 px-3 py-1.5 rounded font-bold">Confirmar Eliminación</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cash-history' && (
          <div className="bg-[#121418] p-6 rounded-xl border border-[#1a1d24] space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <h2 className="text-base font-semibold uppercase text-gray-100">Movimientos de Caja / Declaración en Bolívares (Bs)</h2>
              <span className="text-xs text-gray-400">Registros expresados en Bolívares para presentación al Banco</span>
            </div>

            {cashSessions.length === 0 ? <div className="p-6 text-center text-gray-500 text-xs bg-[#0b0c0e] rounded">No hay turnos de caja registrados.</div> : (
              <div className="space-y-3">
                {cashSessions.map(s => {
                  const salesBs = (s.total_sales_usd || 0) * bcvRate;
                  const diffBs = (s.difference || 0) * bcvRate;
                  return (
                    <div key={s.id} className="p-4 bg-[#0b0c0e] rounded-xl border border-gray-800 flex flex-wrap justify-between items-center gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'OPEN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-300'}`}>
                            {s.status === 'OPEN' ? '🔓 CAJA ABIERTA' : '🔒 CAJA CERRADA'}
                          </span>
                          <span className="font-mono text-[#cca152] font-bold">Apertura: {new Date(s.opened_at).toLocaleString('es-VE')}</span>
                          {s.closed_at && <span className="font-mono text-gray-400">| Cierre: {new Date(s.closed_at).toLocaleString('es-VE')}</span>}
                        </div>
                        <div className="text-gray-300 font-mono text-xs">
                          Ventas Turno: <strong className="text-white text-sm">Bs. {salesBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</strong> 
                          <span className="mx-2 text-gray-600">|</span> 
                          Diferencia: <strong className={diffBs < 0 ? 'text-rose-400' : 'text-white'}>Bs. {diffBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</strong>
                        </div>
                      </div>

                      <button onClick={() => handleOpenSessionDetail(s)} className="bg-[#181a20] hover:bg-[#22252d] text-[#cca152] border border-[#cca152]/40 px-3.5 py-2 rounded-xl font-bold text-xs transition">
                        📄 Reporte Impresión / PDF (Banco)
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="bg-[#121418] p-6 rounded-xl border border-[#1a1d24] space-y-3">
            <h2 className="text-base font-semibold uppercase text-gray-100">Historial General de Movimientos (Kardex)</h2>
            {movements.length === 0 ? <div className="p-6 text-center text-gray-500 text-xs bg-[#0b0c0e] rounded">Sin movimientos registrados.</div> : (
              movements.map(m => (
                <div key={m.id} className="p-3 bg-[#0b0c0e] rounded border border-gray-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#cca152] mr-2">[{m.movement_type}]</span> 
                    <span className="text-gray-300">{m.reason}</span>
                  </div>
                  <div className="text-right">
                    <strong className="text-white">Qty: {m.quantity_change}</strong>
                    <span className="block text-[9px] text-gray-500">{new Date(m.created_at).toLocaleString('es-VE')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* MODAL EDITAR STOCK */}
      {showEditStockModal && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#121418] border border-amber-500/40 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase">✏️ Editar Stock de Inventario</h3>
              <button onClick={() => setShowEditStockModal(false)} className="text-gray-400 hover:text-white font-bold">✕</button>
            </div>

            <div>
              <p className="text-xs text-white font-bold mb-1">{editingProduct.name}</p>
              <p className="text-[10px] text-[#cca152] font-mono">Serial: {editingProduct.serial_code}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-300 block font-semibold">Nueva Cantidad de Unidades en Stock</label>
              <input 
                type="number" 
                step="1"
                value={manualStockInput} 
                onChange={e => setManualStockInput(e.target.value)} 
                className="w-full bg-[#0b0c0e] border border-amber-500/50 rounded-xl p-3 text-sm text-white font-mono font-bold focus:outline-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={() => setShowEditStockModal(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-xs font-bold">Cancelar</button>
              <button onClick={handleSaveStockAdjustment} className="bg-amber-500 hover:bg-amber-600 text-black py-2.5 rounded-xl text-xs font-extrabold uppercase">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPORTE BANCO */}
      {selectedSessionDetail && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div id="print-section" className="bg-[#121418] border border-[#cca152]/40 rounded-2xl max-w-3xl w-full p-6 text-white h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <div>
                <h2 className="text-base font-bold text-[#cca152] uppercase">📄 REPORTE DE DECLARACIÓN DE CAJA (BOLÍVARES - BS)</h2>
                <p className="text-xs text-gray-400">Documento Oficial para Auditoría Bancaria — INVERSIONES EJ</p>
              </div>
              <div className="flex gap-2 no-print">
                <button onClick={() => window.print()} className="bg-[#cca152] hover:bg-[#b88f43] text-black px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg">🖨️ Imprimir</button>
                <button onClick={() => setSelectedSessionDetail(null)} className="text-gray-400 hover:text-white bg-[#181a20] px-3 py-1 rounded-xl border border-gray-800">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 my-4">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#0b0c0e] text-[10px] uppercase text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="p-2.5">Hora</th>
                    <th className="p-2.5">Ticket #</th>
                    <th className="p-2.5">Método de Pago</th>
                    <th className="p-2.5 text-right">Monto Total (Bs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {sessionSalesList.map(sale => {
                    const saleBs = (parseFloat(sale.total_usd) || 0) * bcvRate;
                    return (
                      <tr key={sale.id} className="hover:bg-[#181a20]/60">
                        <td className="p-2.5 font-mono text-gray-400">{new Date(sale.created_at).toLocaleTimeString('es-VE')}</td>
                        <td className="p-2.5 font-mono text-[#cca152] font-bold">#{sale.ticket_number}</td>
                        <td className="p-2.5">{sale.payment_method}</td>
                        <td className="p-2.5 text-right font-bold text-white font-mono">Bs. {saleBs.toLocaleString('es-VE', {minimumFractionDigits:2})}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-gray-800 flex justify-between items-center text-xs">
              <span>Total Recaudado Turno: <strong className="text-white font-mono text-base ml-1">Bs. {((selectedSessionDetail.total_sales_usd || 0) * bcvRate).toLocaleString('es-VE', {minimumFractionDigits:2})}</strong></span>
              <button onClick={() => setSelectedSessionDetail(null)} className="bg-[#181a20] text-gray-300 px-5 py-2 rounded-xl font-bold border border-gray-800 no-print">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}