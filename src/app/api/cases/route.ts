import { NextRequest, NextResponse } from 'next/server';
import { createCase, getAllCases, getCaseById } from '@/lib/cases';
import { Case } from '@/lib/types';

// Obtener todos los expedientes
export async function GET() {
  try {
    const cases = await getAllCases();
    return NextResponse.json(cases);
  } catch (error: any) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Error al obtener expedientes', message: error.message },
      { status: 500 }
    );
  }
}

// Crear un nuevo expediente
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Se requiere un nombre para el expediente' },
        { status: 400 }
      );
    }
    
    const caseData: Partial<Case> = {
      name: data.name,
      description: data.description || '',
      status: data.status || 'active',
      metadata: data.metadata || {}
    };
    
    const caseId = await createCase(caseData);
    
    if (!caseId) {
      return NextResponse.json(
        { error: 'Error al crear el expediente' },
        { status: 500 }
      );
    }
    
    // Obtener el expediente recién creado
    const newCase = await getCaseById(caseId);
    
    return NextResponse.json(newCase);
  } catch (error: any) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Error al crear expediente', message: error.message },
      { status: 500 }
    );
  }
} 