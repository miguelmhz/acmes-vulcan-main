import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'acmes_dictaminador';
const VALIDATIONS_COLLECTION = 'validations';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const collection = client.db(DB_NAME).collection(VALIDATIONS_COLLECTION);
    
    const validations = await collection
      .find({})
      .sort({ created_at: -1 })
      .limit(100)  // Limitar a 100 resultados
      .toArray();
    
    return NextResponse.json(
      validations.map(validation => ({
        ...validation,
        _id: validation._id.toString()
      }))
    );
  } catch (error: any) {
    console.error('Error fetching all validations:', error);
    
    return NextResponse.json(
      { error: 'Error al obtener las validaciones', message: error.message },
      { status: 500 }
    );
  }
} 