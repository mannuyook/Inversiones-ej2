'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CashRegisterModal({ isOpen, onClose, bcvRate, onSessionChange }) {
  const [activeSession, setActiveSession] = useState(null);
  const [openingCash, setOpeningCash] = useState('');
  const [actualCashCount, setActualCashCount] = useState('');
  const [salesSummary, setSalesSummary] = useState({
    efectivo: 0,
    pagoMovil: 0,
    tarjeta: 0,
    binance: 0,
    cashea: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkActiveSession();
    }
  }, [isOpen]);

  async function checkActiveSession() {
    setLoading(true);
    // Buscar si hay una sesión abierta
    const { data, error } = await supabase
      .from('cash_register_sessions')
      .select('*')
      .eq('status', 'OPEN')
      .order('opened_at', { ascending: false })
      .maybeSingle();

    if (!error && data) {
      setActiveSession(data);
      calculateTodaySales(data.opened_at);
    } else {
      setActiveSession(null);
    }
    setLoading(false);
  }

  // Calcular resumen de ventas desde que se abrió la caja
  async function calculateTodaySales(openedAt) {
    const { data: sales } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', openedAt)
      .eq('status', 'COMPLETED');

    let ef = 0, pm = 0, tj = 0, bn = 0, cs = 0, total = 0;

    (sales || []).forEach((s) => {
      const method = s.payment_method || '';
      const amt = parseFloat(s.total_usd || 0);
      total += amt;

      if (method.includes('Efectivo')) ef += amt;
      else if (method.includes('Pago Móvil')) pm += amt;
      else if (method.includes('Tarjeta') || method.includes('Puntos')) tj += amt;
      else if (method.includes('Binance')) bn += amt;
      else if (method.includes('Cashea')) cs += amt;
      else ef += amt;
    });

    setSalesSummary({
      efectivo: ef,
      pagoMovil: pm,
      tarjeta: tj,
      binance: bn,
      cashea: cs,
      totalSales: total,
    });
  }

  // Abrir la caja
  async function handleOpenRegister() {
    const amount = parseFloat(openingCash) || 0;
    const { data, error } = await supabase
      .from('cash_register_sessions')
      .insert([
        {
          opening_cash: amount,
          status: 'OPEN',
        },
      ])
      .select()
      .single();

    if (!error) {
      // Registrar en el historial de movimientos
      await supabase.from('inventory_movements').insert([
        {
          type: 'APERTURA_CAJA',
          description: `Apertura de caja con fondo inicial en efectivo: $${amount.toFixed(2)} USD`,
          amount_usd: amount,
        },
      ]);

      alert('¡Caja ABIERTA con éxito!');
      if (onSessionChange) onSessionChange(true);
      checkActiveSession();
    } else {
      alert('Error al abrir la caja: ' + error.message);
    }
  }

  // Cerrar la caja
  async function handleCloseRegister() {
    if (!activeSession) return;

    const countedCash = parseFloat(actualCashCount) || 0;
    const expectedCash = activeSession.opening_cash + salesSummary.efectivo;
    const diff = countedCash - expectedCash;

    const { error } = await supabase
      .from('cash_register_sessions')
      .update({
        closing_cash_expected: expectedCash,
        closing_cash_actual: countedCash,
        total_pago_movil: salesSummary.pagoMovil,
        total_tarjeta: salesSummary.tarjeta,
        total_binance: salesSummary.binance,
        total_cashea: salesSummary.cashea,
        total_sales_usd: salesSummary.totalSales,
        difference: diff,
        status: 'CLOSED',
        closed_at: new Date().toISOString(),
      })
      .eq('id', activeSession.id);

    if (!error) {
      await supabase.from('inventory_movements').insert([
        {
          type: 'CIERRE_CAJA',
          description: `Cierre de caja. Total Ventas: $${salesSummary.totalSales.toFixed(2)} USD. Diferencia efectivo: $${diff.toFixed(2)} USD`,
          amount_usd: salesSummary.totalSales,
        },
      ]);

      alert('¡Caja CERRADA correctamente!');
      if (onSessionChange) onSessionChange(false);
      onClose();
    } else {
      alert('Error al cerrar caja: ' + error.message);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121418] border border-[#cca152]/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white">
        
        <div className="flex justify-between items-center pb-3 border-b border-gray-800">
          <h2 className="text-base font-bold uppercase text-[#cca152] flex items-center gap-2">
            💵 Gestor de Turno de Caja (POS)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold">✕</button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-gray-500">Cargando estado de la caja...</div>
        ) : !activeSession ? (
          /* APERTURA DE CAJA */
          <div className="mt-4 space-y-4">
            <p className="text-xs text-gray-300">
              No hay una caja abierta actualmente. Ingresa el monto base de efectivo inicial con el que arrancas el turno:
            </p>

            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Efectivo Inicial Base ($ USD)</label>
              <input
                type="number"
                placeholder="Ej: 50.00"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="w-full bg-[#0b0c0e] border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#cca152]"
              />
              <span className="text-[10px] text-[#cca152] mt-1 block">
                Equivalente en Bs (Tasa BCV {bcvRate}): <strong>Bs. {((parseFloat(openingCash) || 0) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>

            <button
              onClick={handleOpenRegister}
              className="w-full bg-[#3b5336] hover:bg-[#466341] text-white py-3 rounded-xl font-bold uppercase text-xs transition"
            >
              🔓 Abrir Caja / Iniciar Turno
            </button>
          </div>
        ) : (
          /* CIERRE DE CAJA / ARQUEO */
          <div className="mt-4 space-y-4">
            <div className="bg-[#0b0c0e] p-3 rounded-xl border border-gray-800 text-xs space-y-1.5">
              <div className="flex justify-between text-gray-400">
                <span>Abierta el:</span>
                <span className="text-white font-mono">{new Date(activeSession.opened_at).toLocaleString('es-VE')}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Efectivo Inicial:</span>
                <strong className="text-emerald-400">${activeSession.opening_cash?.toFixed(2)} USD</strong>
              </div>
            </div>

            {/* RESUMEN DE VENTAS DEL TURNO DESGLOSADO EN USD Y BS */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-400">Ventas en el Turno (Por Medio de Pago)</span>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#181a20] p-2 rounded-lg border border-gray-800">
                  <span className="text-[9px] text-gray-400 block">Efectivo USD</span>
                  <span className="font-bold text-emerald-400">${salesSummary.efectivo.toFixed(2)} USD</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Bs. {(salesSummary.efectivo * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="bg-[#181a20] p-2 rounded-lg border border-gray-800">
                  <span className="text-[9px] text-gray-400 block">Pago Móvil</span>
                  <span className="font-bold text-sky-400">${salesSummary.pagoMovil.toFixed(2)} USD</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Bs. {(salesSummary.pagoMovil * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="bg-[#181a20] p-2 rounded-lg border border-gray-800">
                  <span className="text-[9px] text-gray-400 block">Tarjeta / Puntos</span>
                  <span className="font-bold text-purple-400">${salesSummary.tarjeta.toFixed(2)} USD</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Bs. {(salesSummary.tarjeta * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="bg-[#181a20] p-2 rounded-lg border border-gray-800">
                  <span className="text-[9px] text-gray-400 block">Cashea / Binance</span>
                  <span className="font-bold text-amber-400">${(salesSummary.cashea + salesSummary.binance).toFixed(2)} USD</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Bs. {((salesSummary.cashea + salesSummary.binance) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="bg-[#0b0c0e] p-2.5 rounded-xl border border-[#cca152]/30 flex justify-between items-center mt-2">
                <div>
                  <span className="text-[9px] text-[#cca152] uppercase font-bold block">Total Recaudado Turno</span>
                  <span className="text-xs font-mono text-gray-400">Bs. {(salesSummary.totalSales * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
                <span className="text-base font-extrabold text-emerald-400">${salesSummary.totalSales.toFixed(2)} USD</span>
              </div>
            </div>

            {/* INGRESAR EFECTIVO FÍSICO Y ARQUEO */}
            <div>
              <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Efectivo Físico Contado en Caja ($ USD)</label>
              <input
                type="number"
                placeholder="Monto real en billetes"
                value={actualCashCount}
                onChange={(e) => setActualCashCount(e.target.value)}
                className="w-full bg-[#0b0c0e] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#cca152]"
              />
              <p className="text-[9px] text-gray-400 mt-1">
                Deberías tener en efectivo: <strong>${(activeSession.opening_cash + salesSummary.efectivo).toFixed(2)} USD</strong> (Base + Ventas Efectivo)
              </p>
            </div>

            <button
              onClick={handleCloseRegister}
              className="w-full bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 py-3 rounded-xl font-bold uppercase text-xs transition"
            >
              🔒 Cerrar Caja y Registrar Arqueo
            </button>
          </div>
        )}

      </div>
    </div>
  );
}