import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export type DocumentType = 'contract' | 'fianza' | 'seguro' | 'complementario' | 'other';

export interface DocumentData {
  document_type: DocumentType;
  document_id: string;
  fields: Record<string, any>;
  error?: string;
  processing_time: number;
  metadata: Record<string, any>;
  created_at?: Date;
  case_id?: string; // Referencia al expediente al que pertenece
}

export interface DocumentWithId extends DocumentData {
  _id: string;
}

const DB_NAME = 'acmes_dictaminador';
const COLLECTION_NAME = 'documents';

/**
 * Server-side check to ensure MongoDB operations only run on the server
 */
function isServer() {
  return typeof window === 'undefined';
}

/**
 * Save a document extraction result to MongoDB
 */
export async function saveDocument(document: DocumentData): Promise<string> {
  if (!isServer()) {
    console.warn('Attempted to call saveDocument on client side');
    return '';
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  
  const documentToInsert = {
    ...document,
    created_at: new Date()
  };
  
  const result = await collection.insertOne(documentToInsert);
  return result.insertedId.toString();
}

/**
 * Get all documents from the database
 */
export async function getAllDocuments(): Promise<DocumentWithId[]> {
  if (!isServer()) {
    // For client-side, fetch from API instead
    try {
      const response = await fetch('/api/documents/all');
      if (response.ok) {
        const { documents } = await response.json();
        return documents;
      }
      return [];
    } catch (error) {
      console.error('Error fetching all documents from API:', error);
      return [];
    }
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  
  const documents = await collection
    .find({})
    .sort({ created_at: -1 })
    .toArray();
  
  return documents.map(doc => ({
    ...doc,
    _id: doc._id.toString()
  })) as DocumentWithId[];
}

/**
 * Get the most recent contract document
 */
export async function getLatestContract(): Promise<DocumentWithId | null> {
  if (!isServer()) {
    // For client-side, fetch from API instead
    try {
      const response = await fetch('/api/documents/latest-contract');
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching latest contract from API:', error);
      return null;
    }
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  
  const document = await collection
    .find({ document_type: 'contract' })
    .sort({ created_at: -1 })
    .limit(1)
    .toArray();
  
  if (document.length === 0) {
    return null;
  }
  
  return {
    ...document[0],
    _id: document[0]._id.toString()
  } as DocumentWithId;
}

/**
 * Get all documents of a specific type
 */
export async function getDocumentsByType(type: DocumentType): Promise<DocumentWithId[]> {
  if (!isServer()) {
    // For client-side, fetch from API instead
    try {
      const response = await fetch(`/api/documents/by-type?type=${type}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error(`Error fetching documents of type ${type} from API:`, error);
      return [];
    }
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  
  const documents = await collection
    .find({ document_type: type })
    .sort({ created_at: -1 })
    .toArray();
  
  return documents.map(doc => ({
    ...doc,
    _id: doc._id.toString()
  })) as DocumentWithId[];
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string): Promise<DocumentWithId | null> {
  if (!isServer()) {
    // For client-side, fetch from API instead
    try {
      const response = await fetch(`/api/documents/${id}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error(`Error fetching document ${id} from API:`, error);
      return null;
    }
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  
  try {
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
      return null;
    }
    
    return {
      ...document,
      _id: document._id.toString()
    } as DocumentWithId;
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    return null;
  }
} 