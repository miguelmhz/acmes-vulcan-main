import { NextRequest, NextResponse } from 'next/server';
import { getCaseById, updateCase } from '@/lib/cases';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Obtener un expediente específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Case ID is required' },
      { status: 400 }
    );
  }

  try {
    const caseItem = await getCaseById(id);
    
    if (!caseItem) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(caseItem);
  } catch (error) {
    console.error(`Error fetching case ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    );
  }
}

// Actualizar un expediente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Case ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const updatedCase = await request.json();
    
    // Validate required fields
    if (!updatedCase.name) {
      return NextResponse.json(
        { error: 'Case name is required' },
        { status: 400 }
      );
    }
    
    const success = await updateCase(id, updatedCase);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Case not found or update failed' },
        { status: 404 }
      );
    }
    
    // Get the updated case to return
    const caseItem = await getCaseById(id);
    
    return NextResponse.json(caseItem);
  } catch (error) {
    console.error(`Error updating case ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Case ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const updates = await request.json();
    
    // Validate updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }
    
    const success = await updateCase(id, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Case not found or update failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error updating case ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Case ID is required' },
      { status: 400 }
    );
  }
  
  try {
    const client = await clientPromise;
    const DB_NAME = 'acmes_dictaminador';
    const casesCollection = client.db(DB_NAME).collection('cases');
    const documentsCollection = client.db(DB_NAME).collection('documents');
    const validationsCollection = client.db(DB_NAME).collection('validations');
    
    // Find the case first to verify it exists
    let filter;
    if (ObjectId.isValid(id)) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = { case_id: id };
    }
    
    const caseItem = await casesCollection.findOne(filter);
    
    if (!caseItem) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }
    
    // Delete the case
    await casesCollection.deleteOne(filter);
    
    // Delete related documents (optional)
    await documentsCollection.updateMany(
      { case_id: id },
      { $unset: { case_id: "" } }
    );
    
    // Delete related validations (optional)
    await validationsCollection.updateMany(
      { case_id: id },
      { $unset: { case_id: "" } }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Case deleted successfully' 
    });
  } catch (error) {
    console.error(`Error deleting case ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete case' },
      { status: 500 }
    );
  }
} 