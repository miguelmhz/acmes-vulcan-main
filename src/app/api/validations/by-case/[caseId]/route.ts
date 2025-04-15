import { NextRequest, NextResponse } from 'next/server';
import { getValidationsByCaseId } from '@/lib/cases';

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const caseId = params.caseId;
  
  if (!caseId) {
    return NextResponse.json(
      { error: 'Se requiere un ID de caso' },
      { status: 400 }
    );
  }
  
  try {
    const validations = await getValidationsByCaseId(caseId);
    
    return NextResponse.json(validations);
  } catch (error: any) {
    console.error(`Error fetching validations for case ${caseId}:`, error);
    
    return NextResponse.json(
      { error: 'Error al obtener las validaciones', message: error.message },
      { status: 500 }
    );
  }
} 