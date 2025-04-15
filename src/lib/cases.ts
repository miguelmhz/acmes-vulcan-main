import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';
import { Case, CaseStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'acmes_dictaminador';
const COLLECTION_NAME = 'cases';
const DOCUMENTS_COLLECTION = 'documents';
const VALIDATIONS_COLLECTION = 'validations';

/**
 * Server-side check to ensure MongoDB operations only run on the server
 */
function isServer() {
  return typeof window === 'undefined';
}

/**
 * Crea un nuevo expediente
 */
export async function createCase(caseData: Partial<Case>): Promise<string> {
  if (!isServer()) {
    console.warn('Attempted to call createCase on client side');
    return '';
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  
  const now = new Date().toISOString();
  
  // Create a new object without the _id property to avoid type issues
  const { _id, ...caseDataWithoutId } = caseData;
  
  const caseToInsert = {
    ...caseDataWithoutId,
    case_id: caseData.case_id || uuidv4(),
    status: caseData.status || 'en_curso' as CaseStatus,
    created_at: now,
    updated_at: now
  };
  
  try {
    const result = await collection.insertOne(caseToInsert);
    return result.insertedId.toString();
  } catch (error) {
    console.error('Error creating case:', error);
    return '';
  }
}

/**
 * Obtiene todos los expedientes
 */
export async function getAllCases(): Promise<Case[]> {
  if (!isServer()) {
    // Para el lado del cliente, hacer fetch desde API
    try {
      const response = await fetch('/api/cases');
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching cases from API:', error);
      return [];
    }
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  
  const cases = await collection
    .find({})
    .sort({ created_at: -1 })
    .toArray();
  
  return cases.map(caseItem => ({
    ...caseItem,
    _id: caseItem._id.toString()
  })) as Case[];
}

/**
 * Obtiene un expediente por su ID
 */
export async function getCaseById(id: string): Promise<Case | null> {
  if (!isServer()) {
    // Para el lado del cliente, hacer fetch desde API
    try {
      const response = await fetch(`/api/cases/${id}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error(`Error fetching case ${id} from API:`, error);
      return null;
    }
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  
  try {
    let caseItem = null;
    
    // Intentar buscar por MongoDB _id primero
    if (ObjectId.isValid(id)) {
      caseItem = await collection.findOne({ _id: new ObjectId(id) });
    }
    
    // Si no se encuentra, intentar buscar por case_id
    if (!caseItem) {
      caseItem = await collection.findOne({ case_id: id });
    }
    
    if (!caseItem) {
      return null;
    }
    
    return {
      ...caseItem,
      _id: caseItem._id.toString()
    } as Case;
  } catch (error) {
    console.error('Error fetching case by ID:', error);
    return null;
  }
}

/**
 * Actualiza un expediente por su ID
 */
export async function updateCase(id: string, updates: Partial<Case>): Promise<boolean> {
  if (!isServer()) {
    console.warn('Attempted to call updateCase on client side');
    return false;
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);
  
  try {
    let filter;
    
    // Determinar el filtro basado en si el ID es un ObjectId válido
    if (ObjectId.isValid(id)) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = { case_id: id };
    }
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Eliminar _id si está presente en las actualizaciones para evitar errores
    if ('_id' in updateData) {
      delete updateData._id;
    }
    
    const result = await collection.updateOne(filter, { $set: updateData });
    return result.matchedCount > 0;
  } catch (error) {
    console.error('Error updating case:', error);
    return false;
  }
}

/**
 * Asigna un documento a un expediente
 */
export async function assignDocumentToCase(documentId: string, caseId: string): Promise<boolean> {
  if (!isServer()) {
    console.warn('Attempted to call assignDocumentToCase on client side');
    return false;
  }

  const client = await clientPromise;
  const documentsCollection = client.db(DB_NAME).collection(DOCUMENTS_COLLECTION);
  const casesCollection = client.db(DB_NAME).collection(COLLECTION_NAME);
  
  try {
    // Primero, encontrar el documento
    let document = null;
    
    // Intentar buscar por MongoDB _id primero
    if (ObjectId.isValid(documentId)) {
      document = await documentsCollection.findOne({ _id: new ObjectId(documentId) });
    }
    
    // Si no se encuentra, intentar buscar por document_id
    if (!document) {
      document = await documentsCollection.findOne({ document_id: documentId });
    }
    
    if (!document) {
      console.error(`Document not found: ${documentId}`);
      return false;
    }
    
    // Actualizar el documento con el case_id
    let documentFilter;
    if (ObjectId.isValid(documentId) && document._id) {
      documentFilter = { _id: document._id };
    } else {
      documentFilter = { document_id: documentId };
    }
    
    await documentsCollection.updateOne(documentFilter, { 
      $set: { 
        case_id: caseId,
        updated_at: new Date().toISOString()
      } 
    });
    
    // Ahora, actualizar el caso según el tipo de documento
    const documentType = document.document_type;
    
    // Encontrar el caso
    const caseItem = await getCaseById(caseId);
    
    if (!caseItem) {
      console.error(`Case not found: ${caseId}`);
      return false;
    }
    
    // Actualizaciones para el caso
    const caseUpdates: Partial<Case> = { updated_at: new Date().toISOString() };
    
    // Si es un contrato, actualizar el contract_id
    if (documentType === 'contract') {
      caseUpdates.contract_id = document.document_id;
    }
    
    // Si es una fianza o seguro, añadir a fianza_ids
    if (documentType === 'fianza' || documentType === 'seguro') {
      const fianzaIds = caseItem.fianza_ids || [];
      if (!fianzaIds.includes(document.document_id)) {
        caseUpdates.fianza_ids = [...fianzaIds, document.document_id];
      }
    }
    
    // Actualizar el caso
    await updateCase(caseId, caseUpdates);
    
    return true;
  } catch (error) {
    console.error('Error assigning document to case:', error);
    return false;
  }
}

/**
 * Obtiene los documentos asociados a un expediente
 */
export async function getDocumentsByCase(caseId: string): Promise<any[]> {
  if (!isServer()) {
    // Para el lado del cliente, hacer fetch desde API
    try {
      const response = await fetch(`/api/cases/${caseId}/documents`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error(`Error fetching documents for case ${caseId} from API:`, error);
      return [];
    }
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(DOCUMENTS_COLLECTION);
  
  try {
    const documents = await collection
      .find({ case_id: caseId })
      .toArray();
    
    return documents.map(doc => ({
      ...doc,
      _id: doc._id.toString()
    }));
  } catch (error) {
    console.error('Error fetching documents by case:', error);
    return [];
  }
}

/**
 * Actualizar el estado del caso basado en el resultado de la validación
 */
export async function updateCaseStatusFromValidation(
  caseId: string, 
  validationId: string, 
  isValid: boolean
): Promise<boolean> {
  if (!isServer()) {
    console.warn('Attempted to call updateCaseStatusFromValidation on client side');
    return false;
  }

  // Determinar el estado basado en el resultado de la validación
  const newStatus: CaseStatus = isValid ? 'positivo' : 'negativo';
  
  // Actualizar el caso
  return updateCase(caseId, {
    status: newStatus,
    validation_id: validationId,
    validation_result: isValid
  });
}

/**
 * Guardar un resultado de validación
 */
export async function saveValidationResult(validation: any): Promise<string> {
  if (!isServer()) {
    console.warn('Attempted to call saveValidationResult on client side');
    return '';
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(VALIDATIONS_COLLECTION);
  
  const now = new Date().toISOString();
  const validationToInsert = {
    ...validation,
    validation_id: validation.validation_id || uuidv4(),
    timestamp: validation.timestamp || now,
    created_at: now
  };
  
  try {
    const result = await collection.insertOne(validationToInsert);
    const validationId = result.insertedId.toString();
    
    // Si hay un case_id, actualizar el estado del caso
    if (validation.case_id) {
      await updateCaseStatusFromValidation(
        validation.case_id,
        validationToInsert.validation_id,
        validation.isValid
      );
    }
    
    return validationId;
  } catch (error) {
    console.error('Error saving validation result:', error);
    return '';
  }
}

/**
 * Obtiene un resultado de validación por ID
 */
export async function getValidationById(id: string): Promise<any | null> {
  if (!isServer()) {
    // Para el lado del cliente, hacer fetch desde API
    try {
      const response = await fetch(`/api/validations/${id}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error(`Error fetching validation ${id} from API:`, error);
      return null;
    }
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(VALIDATIONS_COLLECTION);
  
  try {
    let validation = null;
    
    // Intentar buscar por MongoDB _id primero
    if (ObjectId.isValid(id)) {
      validation = await collection.findOne({ _id: new ObjectId(id) });
    }
    
    // Si no se encuentra, intentar buscar por validation_id
    if (!validation) {
      validation = await collection.findOne({ validation_id: id });
    }
    
    if (!validation) {
      return null;
    }
    
    return {
      ...validation,
      _id: validation._id.toString()
    };
  } catch (error) {
    console.error('Error fetching validation by ID:', error);
    return null;
  }
}

/**
 * Obtiene validaciones por case_id
 */
export async function getValidationsByCaseId(caseId: string): Promise<any[]> {
  if (!isServer()) {
    // Para el lado del cliente, hacer fetch desde API
    try {
      const response = await fetch(`/api/validations/by-case/${caseId}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error(`Error fetching validations for case ${caseId} from API:`, error);
      return [];
    }
  }

  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(VALIDATIONS_COLLECTION);
  
  const validations = await collection
    .find({ case_id: caseId })
    .sort({ created_at: -1 })
    .toArray();
  
  return validations.map(validation => ({
    ...validation,
    _id: validation._id.toString()
  }));
} 