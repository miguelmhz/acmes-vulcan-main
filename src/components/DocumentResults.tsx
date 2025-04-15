'use client';

import { useState, useMemo } from 'react';
import ErrorDisplay from './ErrorDisplay';

type DocumentType = 'contract' | 'fianza' | 'seguro' | 'complementario' | 'other';

interface UploadResult {
  document_type: DocumentType;
  document_id: string;
  fields: Record<string, any>;
  error?: string;
  processing_time: number;
  metadata: Record<string, any>;
}

interface DocumentResultsProps {
  result: UploadResult;
}

// Field display names for better readability
const fieldDisplayNames: Record<string, string> = {
  contract_id: 'Número de Contrato',
  contract_type: 'Tipo de Contrato',
  beneficiary_name: 'Nombre del Beneficiario',
  contractor_name: 'Nombre del Contratista',
  contract_date: 'Fecha del Contrato',
  effective_date: 'Fecha de Inicio',
  expiration_date: 'Fecha de Vencimiento',
  contract_amount: 'Monto del Contrato',
  payment_terms: 'Términos de Pago',
  document_title: 'Título del Documento',
  document_date: 'Fecha del Documento',
  document_type: 'Tipo de Documento',
  involved_parties: 'Partes Involucradas',
  bond_amount: 'Monto de la Fianza',
  insurance_amount: 'Monto del Seguro',
  coverage_details: 'Detalles de Cobertura',
  required_clauses: 'Cláusulas Requeridas',
  additional_clauses: 'Cláusulas Adicionales',
  property_details: 'Detalles de la Propiedad',
  referenced_contract: 'Contrato Referenciado',
  document_number: 'Número de Documento/Póliza',
  issuing_authority: 'Autoridad Emisora',
  // Campos adicionales en español
  rfc: 'RFC',
  fecha: 'Fecha',
  vigencia: 'Vigencia',
  arrendador: 'Arrendador',
  arrendatario: 'Arrendatario',
  direccion: 'Dirección',
  monto: 'Monto',
  razon_social_contratante: 'Razón Social del Contratante',
  razon_social_arrendador: 'Razón Social del Arrendador',
  razon_social_arrendatario: 'Razón Social del Arrendatario',
  clausulados: 'Clausulados',
  // Campos de fianzas
  applicant_name: 'Nombre del Solicitante',
  insured_amount: 'Monto Asegurado',
  document_start_date: 'Fecha de Inicio',
  document_end_date: 'Fecha de Fin',
  contractor_rfc: 'RFC del Contratista',
  beneficiary_rfc: 'RFC del Beneficiario',
  beneficiary_address: 'Dirección del Beneficiario',
  related_contract_id: 'ID de Contrato Relacionado'
};

export default function DocumentResults({ result }: DocumentResultsProps) {
  const [showRawData, setShowRawData] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showTableView, setShowTableView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Comprobar si hay campos extraídos
  const hasExtractedFields = result.fields && Object.keys(result.fields).length > 0;

  // Check if API response is included in metadata
  const hasApiResponse = result.metadata?.api_response || result.metadata?.mistral_response;

  // Filter fields based on search term
  const filteredFields = useMemo(() => {
    if (!searchTerm || !result.fields) return Object.keys(result.fields);
    
    return Object.keys(result.fields).filter(key => {
      const displayName = fieldDisplayNames[key] || key;
      const value = result.fields[key];
      const keyMatches = key.toLowerCase().includes(searchTerm.toLowerCase());
      const displayNameMatches = displayName.toLowerCase().includes(searchTerm.toLowerCase());
      const valueMatches = value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
      
      return keyMatches || displayNameMatches || valueMatches;
    });
  }, [searchTerm, result.fields]);

  if (result.error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al procesar el documento</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{result.error}</p>
              {result.metadata?.traceback && (
                <details className="mt-2">
                  <summary className="text-xs font-medium text-red-700 cursor-pointer">Ver detalles técnicos</summary>
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                    {result.metadata.traceback}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get document type name in Spanish
  const getDocumentTypeName = (type: DocumentType): string => {
    const typeNames: Record<DocumentType, string> = {
      contract: 'Contrato',
      fianza: 'Fianza',
      seguro: 'Seguro',
      complementario: 'Documento Complementario',
      other: 'Otro Documento',
    };
    
    return typeNames[type] || 'Documento';
  };
  
  // Format field value for display
  const formatFieldValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">No disponible</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside">
          {value.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    }
    
    // Handle special key formatting
    if (key.includes('amount') && typeof value === 'string') {
      return <span className="font-semibold">{value}</span>;
    }
    
    return String(value);
  };
  
  // Asegurar que los campos importantes se muestren primero
  const getPriorityFields = (): string[] => {
    if (result.document_type === 'contract') {
      return [
        'contract_id', 
        'contract_type', 
        'contractor_name', 
        'beneficiary_name', 
        'contract_date', 
        'effective_date', 
        'expiration_date', 
        'contract_amount', 
        'payment_terms'
      ];
    } else if (result.document_type === 'fianza' || result.document_type === 'seguro') {
      return [
        'document_number',
        'applicant_name',
        'beneficiary_name',
        'bond_amount',
        'insured_amount',
        'document_start_date',
        'document_end_date',
        'referenced_contract',
        'issuing_authority',
        'contractor_rfc'
      ];
    }
    
    // Para otros tipos de documentos
    return [];
  };

  const getRelevantFields = (): string[] => {
    // Primero incluir los campos prioritarios
    const priorityFields = getPriorityFields();
    
    // Luego incluir todos los demás campos
    const allFields = Object.keys(result.fields);
    
    // Combinar los prioritarios con el resto, evitando duplicados
    const otherFields = allFields.filter(field => !priorityFields.includes(field));
    
    return [...priorityFields, ...otherFields];
  };
  
  // Check if a field should be displayed (has a value and is relevant)
  const shouldDisplayField = (key: string): boolean => {
    // Si estamos mostrando los datos crudos, mostrar todo
    if (showRawData) {
      return true;
    }
    
    // Si el campo no tiene valor, no mostrarlo
    if (result.fields[key] === null || result.fields[key] === undefined || 
        (typeof result.fields[key] === 'string' && result.fields[key].trim() === '')) {
      return false;
    }
    
    // Para fianzas y seguros, mostrar todos los campos con valor
    if (result.document_type === 'fianza' || result.document_type === 'seguro') {
      return true;
    }
    
    // Para otros tipos, mostrar solo campos relevantes según el tipo
    const relevantFields = getRelevantFields();
    return relevantFields.includes(key);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-blue-700 text-white px-6 py-4">
        <h2 className="text-2xl font-bold text-white">{getDocumentTypeName(result.document_type)}</h2>
        <p className="text-blue-100">ID: {result.document_id}</p>
      </div>
      
      <div className="p-6">
        {result.error ? (
          <ErrorDisplay error={result.error} />
        ) : !hasExtractedFields ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Sin datos extraídos</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>No se pudieron extraer datos del documento.</p>
                  <p className="mt-1">Esto puede deberse a un problema con el API de Mistral o con el formato del documento.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Toggle buttons for different views */}
            <div className="mb-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowTableView(true);
                  setShowRawData(false);
                  setShowDebugInfo(false);
                }}
                className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                  showTableView 
                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Vista de Tabla
              </button>
              
              <button
                onClick={() => {
                  setShowTableView(false);
                  setShowRawData(false);
                  setShowDebugInfo(false);
                }}
                className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                  !showTableView && !showRawData && !showDebugInfo
                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Vista Normal
              </button>
            </div>
            
            {/* Table view of extracted fields */}
            {showTableView && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Campos Extraídos - Vista de Tabla
                </h3>
                
                {/* Search input */}
                <div className="mb-4">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Buscar campos..."
                    />
                    {searchTerm && (
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setSearchTerm('')}
                      >
                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {filteredFields.length} de {Object.keys(result.fields).length} campos mostrados
                  </p>
                </div>
                
                {/* Table of fields */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Campo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredFields.map((key) => (
                        <tr key={key} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                            {fieldDisplayNames[key] || key}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 break-words">
                            {formatFieldValue(key, result.fields[key])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredFields.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No se encontraron campos que coincidan con la búsqueda
                  </div>
                )}
              </div>
            )}
            
            {/* Regular view of extracted fields */}
            {!showTableView && !showRawData && !showDebugInfo && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Información Extraída
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getRelevantFields().map(key => (
                    shouldDisplayField(key) ? (
                      <div key={key} className="border-b border-gray-100 pb-2">
                        <p className="text-sm font-medium text-gray-500">
                          {fieldDisplayNames[key] || key}
                        </p>
                        <div className="mt-1 text-base text-gray-900">
                          {formatFieldValue(key, result.fields[key])}
                        </div>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            )}
            
            {result.document_type === 'fianza' && result.fields.referenced_contract && !showTableView && !showRawData && !showDebugInfo && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Relación con Contrato
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-900">
                    <span className="font-medium">Contrato Referenciado:</span> {result.fields.referenced_contract}
                  </p>
                  {result.fields.coverage_details && (
                    <p className="text-gray-900 mt-2">
                      <span className="font-medium">Detalles de Cobertura:</span> {result.fields.coverage_details}
                    </p>
                  )}
                  {result.fields.required_clauses && (
                    <div className="mt-2">
                      <span className="font-medium text-gray-900">Cláusulas Requeridas:</span>
                      <ul className="list-disc list-inside text-gray-900 mt-1">
                        {Array.isArray(result.fields.required_clauses) ? 
                          result.fields.required_clauses.map((clause: string, i: number) => (
                            <li key={i}>{clause}</li>
                          )) : 
                          <li>{result.fields.required_clauses}</li>
                        }
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Metadatos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-b border-gray-100 pb-2">
              <p className="text-sm font-medium text-gray-500">Tiempo de Procesamiento</p>
              <p className="mt-1 text-base text-gray-900">{result.processing_time.toFixed(2)} segundos</p>
            </div>
            {result.metadata && Object.keys(result.metadata)
              .filter(key => !['logs', 'processing_steps', 'api_response', 'api_content', 'prompt', 'traceback', 'exception_traceback'].includes(key))
              .map(key => (
                <div key={key} className="border-b border-gray-100 pb-2">
                  <p className="text-sm font-medium text-gray-500">
                    {key === 'text_length' ? 'Longitud del Texto' : 
                     key === 'use_ocr' ? 'OCR Utilizado' : key}
                  </p>
                  <p className="mt-1 text-base text-gray-900">
                    {key === 'text_length' ? `${result.metadata[key]} caracteres` :
                     key === 'use_ocr' ? (result.metadata[key] ? 'Sí' : 'No') : 
                     typeof result.metadata[key] === 'object' ? '[Objeto]' :
                     String(result.metadata[key])}
                  </p>
                </div>
            ))}
          </div>
        </div>
        
        {/* Button to toggle raw data view */}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={() => {
              setShowTableView(false);
              setShowRawData(false);
              setShowDebugInfo(!showDebugInfo);
            }}
            className={`inline-flex items-center px-4 py-2 border ${
              showDebugInfo ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700'
            } shadow-sm text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {showDebugInfo ? "Ocultar Información de Depuración" : "Ver Información de Depuración"}
          </button>
          
          <button
            onClick={() => {
              setShowTableView(false);
              setShowDebugInfo(false);
              setShowRawData(!showRawData);
            }}
            className={`inline-flex items-center px-4 py-2 border ${
              showRawData ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700'
            } shadow-sm text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {showRawData ? "Ocultar Datos Crudos" : "Ver Datos Crudos"}
          </button>
        </div>
        
        {/* Debug information display */}
        {showDebugInfo && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Información de Depuración
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Resultado Completo</h4>
                <pre className="text-xs text-gray-800 bg-gray-100 p-3 rounded overflow-auto max-h-60 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              
              {hasApiResponse && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Respuesta de API</h4>
                  <pre className="text-xs text-gray-800 bg-gray-100 p-3 rounded overflow-auto max-h-60 whitespace-pre-wrap">
                    {JSON.stringify(result.metadata?.api_response || result.metadata?.mistral_response, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.metadata?.processing_steps && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Pasos de Procesamiento</h4>
                  <ol className="list-decimal ml-4 text-sm">
                    {result.metadata.processing_steps.map((step: string, i: number) => (
                      <li key={i} className="text-gray-700 mb-1">{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              
              {result.metadata?.logs && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Logs de Extracción</h4>
                  <pre className="text-xs text-gray-800 bg-gray-100 p-3 rounded overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                    {result.metadata.logs}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Raw data display */}
        {showRawData && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              Datos Crudos Extraídos
            </h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(result.fields, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 