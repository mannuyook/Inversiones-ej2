import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Obtiene la tasa para la tienda y el POS (Prioriza Supabase, luego API)
export async function GET() {
  try {
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'bcv_rate')
      .maybeSingle();

    if (setting && setting.value) {
      return NextResponse.json({ price: parseFloat(setting.value), source: 'manual-or-synced' });
    }

    const res = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?monitor=bcv', {
      cache: 'no-store'
    });
    const data = await res.json();
    if (data && data.price) {
      return NextResponse.json(data);
    }

    return NextResponse.json({ price: 879.1225 });
  } catch (error) {
    return NextResponse.json({ price: 879.1225 }, { status: 500 });
  }
}

// POST: Permite al Administrador fijar la tasa manualmente
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

    return NextResponse.json({ success: true, price: parseFloat(rate) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}