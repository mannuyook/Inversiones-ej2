import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. PRIMERO: Intentar obtener la tasa oficial en vivo desde la API del BCV
    const res = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?monitor=bcv', {
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.price) {
        // También guardamos automáticamente esta tasa fresca en Supabase
        await supabase
          .from('settings')
          .upsert({ key: 'bcv_rate', value: data.price.toString() });

        return NextResponse.json({ price: parseFloat(data.price), source: 'live-bcv' });
      }
    }

    // 2. SEGUNDO: Si la API en vivo falla, respaldar con el valor manual/guardado en Supabase
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'bcv_rate')
      .maybeSingle();

    if (setting && setting.value) {
      return NextResponse.json({ price: parseFloat(setting.value), source: 'supabase-fallback' });
    }

    // 3. TERCERO: Respaldo hardcoded de emergencia si falla Supabase también
    return NextResponse.json({ price: 880.1159, source: 'hardcoded-fallback' });

  } catch (error) {
    // Si ocurre un error de red, consultar Supabase antes de fallar
    try {
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'bcv_rate')
        .maybeSingle();

      if (setting && setting.value) {
        return NextResponse.json({ price: parseFloat(setting.value), source: 'supabase-fallback' });
      }
    } catch (_) {}

    return NextResponse.json({ price: 880.1159, source: 'emergency' }, { status: 500 });
  }
}

// POST: Permite al Administrador fijar la tasa manualmente si lo requiere
export async function POST(request) {
  try {
    const { rate } = await request.json();
    if (!rate || isNaN(parseFloat(rate))) {
      return NextResponse.json({ error: 'Tasa inválida' }, { status: 400 });
    }

    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'bcv_rate', value: rate.toString() });

    if (error) throw error;

    return NextResponse.json({ price: parseFloat(rate), message: 'Tasa actualizada correctamente' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}