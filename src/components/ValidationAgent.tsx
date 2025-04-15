import React, { useState } from 'react';
import type { DocumentWithId } from '@/lib/documents';

interface ValidationResult {
  isValid: boolean;
  report: string;
  comparisonDetails: {
    contractorName: string;
    fianzaName: string;
    areEqual: boolean;
    notes: string;
  };
  validationTime: number;
  case_id?: string;
}

interface ValidationAgentProps {
  contractData: DocumentWithId;
  fianzaData: DocumentWithId;
  onValidationComplete?: (result: ValidationResult) => void;
}

export default function ValidationAgent({ 
  contractData, 
  fianzaData, 
  onValidationComplete 
}: ValidationAgentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runValidation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Determinar si hay un caso asociado
      const caseId = contractData.case_id as string || fianzaData.case_id as string || undefined;
      
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: contractData.document_id,
          fianzaId: fianzaData.document_id,
          caseId: caseId // Enviar el ID del caso si existe
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la validación');
      }
      
      const validationResult = await response.json();
      
      // Agregar el case_id al resultado si existe
      if (caseId) {
        validationResult.case_id = caseId;
      }
      
      setResult(validationResult);
      
      // Llamar al callback si existe
      if (onValidationComplete) {
        onValidationComplete(validationResult);
      }
    } catch (err: any) {
      console.error('Error validating documents:', err);
      setError(err.message || 'Error al procesar la validación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-md p-6 bg-white">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Agente de Validación IA
      </h3>
      
      <p className="text-sm text-gray-700 mb-4">
        El agente analizará los datos del contrato y la fianza para validar que el contratista y afianzado sean la misma entidad,
        incluso cuando tengan variaciones en su formato (ej. "S.A. de C.V." vs "Sociedad Anónima de Capital Variable").
      </p>
      
      {!result && (
        <button
          onClick={runValidation}
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
          }`}
        >
          {isLoading ? 'Procesando...' : 'Emitir Dictamen'}
        </button>
      )}
      
      {isLoading && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 text-green-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-green-800">El agente IA está analizando los documentos...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {result && (
        <div className={`mt-6 p-6 border ${result.isValid ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'} rounded-lg`}>
          <div className="flex items-start mb-4">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${result.isValid ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
              {result.isValid ? (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-4">
              <h4 className={`text-lg font-bold ${result.isValid ? 'text-green-800' : 'text-red-800'}`}>
                Dictamen: {result.isValid ? 'Positivo' : 'Negativo'}
              </h4>
              <p className="text-sm mt-1">
                Tiempo de análisis: {result.validationTime.toFixed(2)}s
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <h5 className="text-md font-semibold mb-2">Reporte de Validación</h5>
            <p className="text-sm whitespace-pre-line">{result.report}</p>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4 grid grid-cols-1 gap-4">
            <div>
              <h5 className="text-md font-semibold mb-2">Detalles de la Comparación</h5>
              <div className="bg-white rounded p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Contratista (Contrato):</span>
                    <p className="text-gray-800">{result.comparisonDetails.contractorName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Afianzado (Fianza):</span>
                    <p className="text-gray-800">{result.comparisonDetails.fianzaName}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium">Notas:</span>
                  <p className="text-gray-800 mt-1">{result.comparisonDetails.notes}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => setResult(null)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Iniciar Nueva Validación
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 