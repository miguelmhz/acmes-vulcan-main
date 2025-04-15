import { NextResponse } from 'next/server';
import { getAllDocuments } from '@/lib/documents';

export async function GET() {
  try {
    const documents = await getAllDocuments();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching all documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
} 