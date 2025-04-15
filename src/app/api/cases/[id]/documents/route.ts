import { NextRequest, NextResponse } from 'next/server';
import { getCaseById, getDocumentsByCase, assignDocumentToCase } from '@/lib/cases';

// Obtener los documentos de un expediente
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;
    
    if (!caseId) {
      return NextResponse.json(
        { error: 'Se requiere un ID de expediente' },
        { status: 400 }
      );
    }
    
    // Verificar si el expediente existe
    const caseData = await getCaseById(caseId);
    
    if (!caseData) {
      return NextResponse.json(
        { error: 'Expediente no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener los documentos asociados
    const documents = await getDocumentsByCase(caseId);
    
    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('Error fetching case documents:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentos del expediente', message: error.message },
      { status: 500 }
    );
  }
}

// Asignar un documento a un expediente
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;
    const { documentId } = await request.json();
    
    if (!caseId) {
      return NextResponse.json(
        { error: 'Se requiere un ID de expediente' },
        { status: 400 }
      );
    }
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Se requiere un ID de documento' },
        { status: 400 }
      );
    }
    
    // Verificar si el expediente existe
    const caseData = await getCaseById(caseId);
    
    if (!caseData) {
      return NextResponse.json(
        { error: 'Expediente no encontrado' },
        { status: 404 }
      );
    }
    
    // Asignar el documento al expediente
    const success = await assignDocumentToCase(documentId, caseId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Error al asignar el documento al expediente' },
        { status: 500 }
      );
    }
    
    // Obtener los documentos actualizados
    const documents = await getDocumentsByCase(caseId);
    
    return NextResponse.json({
      success: true,
      message: 'Documento asignado correctamente',
      documents
    });
  } catch (error: any) {
    console.error('Error assigning document to case:', error);
    return NextResponse.json(
      { error: 'Error al asignar documento al expediente', message: error.message },
      { status: 500 }
    );
  }
} 