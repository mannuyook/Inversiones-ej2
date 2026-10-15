'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReturnRequestModal({ isOpen, onClose }) {
  const [ticketNumber, setTicketNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [serialCode, setSerialCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSearchTicket(ticketNum) {
    if (!ticketNum) return;
    const { data } = await supabase.from('inventory_movements').select('*').ilike('description', `%Ticket #${ticketNum}%`).maybeSingle();
    if (data) {
      setProductName(data.description);
      setRefundAmount(data.amount_usd ? data.amount_usd.toString() : '');
    } else {
      const { data: sData } = await supabase.from('sales').select('*').eq('ticket_number', parseInt(ticketNum)).maybeSingle();
      if (sData) {
        setRefundAmount(sData.total_usd ? sData.total_usd.toString() : '');
        setProductName(`Venta Ticket #${ticketNum}`);
      }
    }
  }

  async function handleSubmit() {
    if (!ticketNumber || !productName || !refundAmount) return alert('Completa los campos obligatorios');
    setSubmitting(true);
    const { error } = await supabase.from('return_requests').insert([{
      ticket_number: parseInt(ticketNumber),
      product_name: productName,
      serial_code: serialCode || 'GENERAL',
      quantity: parseInt(quantity) || 1,
      refund_amount: parseFloat(refundAmount),
      reason: reason,
      status: 'PENDING'
    }]);
    setSubmitting(false);
    if (!error) {
      alert('Devolución enviada al Admin');
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#121418] border border-[#cca152]/40 rounded-2xl max-w-md w-full p-5 text-white space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-gray-800">
          <h2 className="text-sm font-bold text-amber-400">↩️ Solicitar Devolución</h2>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 block mb-1"># Número de Ticket</label>
          <input type="number" placeholder="Ej: 1042" value={ticketNumber} onChange={e => setTicketNumber(e.target.value)} onBlur={e => handleSearchTicket(e.target.value)} className="w-full bg-[#0b0c0e] border border-gray-800 rounded p-2 text-xs" />
        </div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Detalle (Autocompletado)</label><input type="text" value={productName} onChange={e => setProductName(e.target.value)} className="w-full bg-[#0b0c0e] border border-gray-800 rounded p-2 text-xs text-amber-300 font-bold" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Monto ($ USD)</label><input type="number" step="0.01" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="w-full bg-[#0b0c0e] border border-gray-800 rounded p-2 text-xs text-emerald-400 font-bold" /></div>
        <div><label className="text-[10px] text-gray-400 block mb-1">Motivo</label><textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-[#0b0c0e] border border-gray-800 rounded p-2 text-xs h-16"></textarea></div>
        <button onClick={handleSubmit} disabled={submitting} className="w-full bg-amber-600 hover:bg-amber-700 py-2.5 rounded font-bold uppercase text-xs">Enviar Solicitud</button>
      </div>
    </div>
  );
}