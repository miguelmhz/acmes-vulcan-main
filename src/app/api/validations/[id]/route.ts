import { NextRequest, NextResponse } from 'next/server';
import { getValidationById } from '@/lib/cases';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json({ error: 'Validation ID is required' }, { status: 400 });
  }

  try {
    const validation = await getValidationById(id);
    
    if (!validation) {
      return NextResponse.json({ error: 'Validation not found' }, { status: 404 });
    }
    
    return NextResponse.json(validation);
  } catch (error) {
    console.error(`Error fetching validation ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch validation' },
      { status: 500 }
    );
  }
} 