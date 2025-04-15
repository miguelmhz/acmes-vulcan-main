import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'acmes_dictaminador';
const COLLECTION_NAME = 'documents';

export async function GET() {
  try {
    const client = await clientPromise;
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
    
    const document = await collection
      .find({ document_type: 'contract' })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();
    
    if (document.length === 0) {
      return NextResponse.json(null);
    }
    
    // Convert MongoDB _id to string for JSON serialization
    const result = {
      ...document[0],
      _id: document[0]._id.toString()
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching latest contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest contract' },
      { status: 500 }
    );
  }
} 