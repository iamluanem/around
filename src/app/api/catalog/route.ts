import { NextResponse } from 'next/server';
import { catalogRepository } from '@/repositories';

export async function GET() {
  return NextResponse.json(await catalogRepository.getCatalog());
}
