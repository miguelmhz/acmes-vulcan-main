import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const DB_NAME = 'acmes_dictaminador';
const COLLECTION_NAME = 'documents';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid document ID' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
    
    let document;
    
    // Try to find by MongoDB _id first
    if (ObjectId.isValid(id)) {
      document = await collection.findOne({ _id: new ObjectId(id) });
    }
    
    // If not found or not a valid ObjectId, try to find by document_id
    if (!document) {
      document = await collection.findOne({ document_id: id });
    }
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Convert MongoDB _id to string for JSON serialization
    const result = {
      ...document,
      _id: document._id.toString()
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
} 