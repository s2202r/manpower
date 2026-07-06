import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    { id: 'GENERAL_HELPER', label: 'General Helper' },
    { id: 'FORKLIFT_MHE', label: 'Forklift / MHE' },
    { id: 'SCANNER_TRAINED', label: 'Scanner Trained' },
    { id: 'COLD_STORAGE', label: 'Cold Storage' },
  ]);
}
