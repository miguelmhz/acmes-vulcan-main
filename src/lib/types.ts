// Tipos para documentos
export interface Document {
  _id: string;
  document_id: string;
  name: string;
  path: string;
  type: string;
  status: 'processing' | 'processed' | 'error';
  fields?: Record<string, any>;
  error?: string;
  error_details?: any;
  created_at: string;
  updated_at: string;
  metadata?: {
    processing_steps?: string[];
    api_responses?: any[];
    logs?: string[];
    extracted_text?: string;
    [key: string]: any;
  };
  case_id?: string; // Referencia al expediente al que pertenece
}

// Estados de expediente
export type CaseStatus = 'en_curso' | 'positivo' | 'negativo' | 'pendiente';

// Tipos para expedientes (casos)
export interface Case {
  _id: string;
  case_id: string;
  name: string;
  description?: string;
  status: CaseStatus;
  contract_id?: string;    // ID del documento de contrato principal
  fianza_ids?: string[];   // IDs de documentos de fianza relacionados
  validation_id?: string;  // ID de la última validación
  validation_result?: boolean; // Resultado de la validación (true = positivo, false = negativo)
  created_at: string;
  updated_at: string;
  metadata?: {
    [key: string]: any;
  };
}

// Tipos para la validación
export interface Validation {
  _id?: string;
  validation_id?: string;
  isValid: boolean;
  report: string;
  comparisonDetails: {
    contractorName: string;
    fianzaName: string;
    areEqual: boolean;
    notes: string;
  };
  timestamp?: string;
  documentIds?: {
    contractId: string;
    fianzaId: string;
  };
  case_id?: string;  // Referencia al expediente al que pertenece
}

// Interfaz para los resultados de validación
export interface ValidationResult extends Validation {
  contractDocument?: Document;
  fianzaDocument?: Document;
}

// Tipos para respuestas de API
export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
} 