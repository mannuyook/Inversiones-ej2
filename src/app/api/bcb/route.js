import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?monitor=bcv', {
      cache: 'no-store' // Para que traiga siempre la tasa fresca
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ price: 879.1225 }, { status: 500 });
  }
}