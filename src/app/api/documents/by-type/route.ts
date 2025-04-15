import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'acmes_dictaminador';
const COLLECTION_NAME = 'documents';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    
    if (!type) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
    
    const documents = await collection
      .find({ document_type: type })
      .sort({ created_at: -1 })
      .toArray();
    
    // Convert MongoDB _id to string for JSON serialization
    const results = documents.map(doc => ({
      ...doc,
      _id: doc._id.toString()
    }));
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching documents by type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
} 