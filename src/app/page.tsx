'use client';

import Link from 'next/link';
import DocumentUploader from '@/components/DocumentUploader';
import { useEffect, useState } from 'react';
import type { DocumentWithId } from '@/lib/documents';
import type { Case, CaseStatus } from '@/lib/types';
import DocumentResults from '@/components/DocumentResults';
import ValidationAgent from '@/components/ValidationAgent';
import CaseSelector from '@/components/CaseSelector';

// Home Page Component - client component
export default function Home() {
  const [contractData, setContractData] = useState<DocumentWithId | null>(null);
  const [step1Complete, setStep1Complete] = useState(false);
  const [step2Complete, setStep2Complete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fianzaData, setFianzaData] = useState<DocumentWithId | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [currentCase, setCurrentCase] = useState<Case | null>(null);

  // Function to handle successful contract extraction
  const onContractExtracted = (result: any) => {
    setContractData(result);
    setStep1Complete(true);
  };

  // Function to handle fianza/póliza extraction
  const onFianzaExtracted = (result: any) => {
    setFianzaData(result);
    setStep2Complete(true);
  };
  
  // Manejar el resultado de la validación para actualizar el estado del caso
  const handleValidationComplete = (validationResult: any) => {
    if (currentCase && validationResult.case_id) {
      // Actualizar el estado del caso localmente
      setCurrentCase({
        ...currentCase,
        status: validationResult.isValid ? 'positivo' : 'negativo' as CaseStatus,
        validation_result: validationResult.isValid
      });
    }
  };

  // Handle case selection
  const handleCaseSelected = async (caseId: string | null) => {
    setSelectedCaseId(caseId);
    
    // Reset current data when changing cases
    setContractData(null);
    setFianzaData(null);
    setStep1Complete(false);
    setStep2Complete(false);
    
    if (caseId) {
      setLoading(true);
      
      try {
        // Cargar información del expediente
        const caseResponse = await fetch(`/api/cases/${caseId}`);
        if (caseResponse.ok) {
          const caseData = await caseResponse.json();
          setCurrentCase(caseData);
          
          // Cargar documentos del expediente
          const documentsResponse = await fetch(`/api/cases/${caseId}/documents`);
          if (documentsResponse.ok) {
            const documents = await documentsResponse.json();
            
            // Identificar el contrato
            const contract = documents.find((doc: any) => doc.document_type === 'contract');
            if (contract) {
              setContractData(contract);
              setStep1Complete(true);
            }
            
            // Identificar la fianza (tomar la más reciente)
            const fianzas = documents.filter((doc: any) => 
              doc.document_type === 'fianza' || doc.document_type === 'seguro'
            ).sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            if (fianzas.length > 0) {
              setFianzaData(fianzas[0]);
              setStep2Complete(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading case data:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentCase(null);
      setLoading(false);
    }
  };

  // Obtener el color según el estado del expediente
  const getCaseStatusColor = () => {
    if (!currentCase) return '';
    
    switch (currentCase.status) {
      case 'pendiente':
        return 'bg-gray-50 border-gray-400';
      case 'en_curso':
        return 'bg-blue-50 border-blue-400';
      case 'positivo':
        return 'bg-green-50 border-green-400';
      case 'negativo':
        return 'bg-red-50 border-red-400';
      default:
        return 'bg-gray-50 border-gray-400';
    }
  };
  
  // Obtener el texto del estado del expediente
  const getCaseStatusText = () => {
    if (!currentCase) return '';
    
    switch (currentCase.status) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_curso':
        return 'En curso';
      case 'positivo':
        return 'Dictamen positivo';
      case 'negativo':
        return 'Dictamen negativo';
      default:
        return 'Desconocido';
    }
  };

  return (
    <main className="pt-8 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-600">
          <h1 className="page-title">
            Sistema de Dictaminación
          </h1>
          <p className="page-subtitle max-w-3xl mx-auto">
            Plataforma para la validación y dictaminación de expedientes mediante IA
          </p>
        </div>
        
        {/* Selector de expediente */}
        <CaseSelector 
          onCaseSelected={handleCaseSelected}
          selectedCaseId={selectedCaseId}
        />
        
        {/* Solo mostrar los pasos si hay un expediente seleccionado */}
        {selectedCaseId && currentCase ? (
          <>
            {/* Paso 1: Análisis de Contratos */}
            <div className="card shadow-xl rounded-lg overflow-hidden mb-10 border border-gray-200">
              <div className="p-6 md:p-8">
                <h2 className="section-title">
                  Paso 1: Análisis de Contratos
                </h2>
                <p className="text-lg text-gray-900 mb-6">
                  Sube un contrato para extraer automáticamente los datos más relevantes, incluyendo partes, fechas, montos y obligaciones.
                </p>
                
                {currentCase && (
                  <div className={`mb-6 p-4 rounded-lg border-l-4 ${getCaseStatusColor()}`}>
                    <h3 className="text-blue-800 flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2-2h12v2h-12V4zm0 3a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V7zm6 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V7zm-5 4a1 1 0 011-1h10a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      Expediente: {currentCase.name}
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {currentCase.description}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-blue-600">
                        ID: {currentCase.case_id}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        currentCase.status === 'pendiente' ? 'bg-gray-200 text-gray-800' :
                        currentCase.status === 'en_curso' ? 'bg-blue-200 text-blue-800' :
                        currentCase.status === 'positivo' ? 'bg-green-200 text-green-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {getCaseStatusText()}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                  <h3 className="mb-3 text-blue-800">Tipos de documentos soportados:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-900">
                    <li>Contratos de compraventa</li>
                    <li>Contratos de prestación de servicios</li>
                    <li>Contratos de obra pública</li>
                    <li>Contratos de arrendamiento</li>
                    <li>Otros contratos y anexos</li>
                  </ul>
                </div>
                
                {step1Complete && contractData && (
                  <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          <strong>Contrato procesado correctamente.</strong> Ahora puedes proceder al Paso 2 para analizar las pólizas relacionadas.
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          ID: {contractData.document_id}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <DocumentUploader 
                  defaultDocumentType="contract" 
                  onExtracted={onContractExtracted}
                  caseId={selectedCaseId}
                />
              </div>
            </div>
            
            {/* Paso 2: Análisis de Pólizas y Fianzas - Mostrar solo si el Paso 1 está completo o cargando */}
            {loading ? (
              <div className="bg-white shadow-xl rounded-lg overflow-hidden p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando información...</p>
              </div>
            ) : step1Complete ? (
              <div className="card shadow-xl rounded-lg overflow-hidden border border-gray-200 mb-10">
                <div className="p-6 md:p-8">
                  <h2 className="section-title">
                    Paso 2: Análisis de Pólizas y Fianzas
                  </h2>
                  <p className="text-lg text-gray-900 mb-6">
                    Sube una póliza de seguro o fianza para validar que cumple con los requisitos del contrato relacionado.
                  </p>
                  
                  <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                    <h3 className="mb-3 text-blue-800">Tipos de documentos soportados:</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-900">
                      <li>Pólizas de fianza de cumplimiento</li>
                      <li>Pólizas de garantía</li>
                      <li>Pólizas de seguro de responsabilidad civil</li>
                      <li>Pólizas de vicios ocultos</li>
                      <li>Endosos y anexos de pólizas</li>
                    </ul>
                  </div>
                  
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-amber-700">
                          <strong>Importante:</strong> Asegúrate de que la póliza cubra el monto y periodo del contrato referenciado.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {contractData && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <strong>Contrato relacionado:</strong> {contractData.fields.contract_id || contractData.document_id}
                          </p>
                          {contractData.fields.contractor_name && (
                            <p className="text-xs text-blue-600 mt-1">
                              Contratista: {contractData.fields.contractor_name}
                            </p>
                          )}
                          {contractData.fields.contract_amount && (
                            <p className="text-xs text-blue-600 mt-1">
                              Monto: {contractData.fields.contract_amount}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step2Complete && fianzaData && (
                    <div className="mt-6">
                      <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-green-700">
                              <strong>Documento procesado correctamente.</strong> Ahora puedes proceder al Paso 3 para validar la correspondencia.
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              ID: {fianzaData.document_id}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          Resultado del análisis:
                        </h3>
                        <DocumentResults result={fianzaData} />
                      </div>
                    </div>
                  )}
                  
                  <DocumentUploader 
                    defaultDocumentType="fianza" 
                    relatedContractId={contractData?.document_id}
                    onExtracted={onFianzaExtracted}
                    caseId={selectedCaseId}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 shadow-lg rounded-lg overflow-hidden border border-gray-300 mb-10">
                <div className="p-6 md:p-8">
                  <h2 className="text-3xl font-bold text-gray-500 mb-4 border-b-2 border-gray-200 pb-2">
                    Paso 2: Análisis de Pólizas y Fianzas
                  </h2>
                  <p className="text-lg text-gray-700 mb-6">
                    Completa el Paso 1 (análisis de contrato) antes de proceder a este paso.
                  </p>
                  
                  <div className="bg-gray-200 rounded-lg p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="mt-4 text-gray-500">Este paso se desbloqueará después de procesar un contrato.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Paso 3: Validación con Agente IA - Mostrar solo si los Pasos 1 y 2 están completos */}
            {step1Complete && step2Complete && contractData && fianzaData ? (
              <div className="card shadow-xl rounded-lg overflow-hidden border border-gray-200">
                <div className="p-6 md:p-8">
                  <h2 className="section-title">
                    Paso 3: Validación con Agente IA
                  </h2>
                  <p className="text-lg text-gray-900 mb-6">
                    El agente de IA analizará si el contratista del contrato y el afianzado de la fianza son la misma entidad, 
                    emitiendo un dictamen sobre la correspondencia entre ambos documentos.
                  </p>
                  
                  <div className="mb-6 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-purple-700">
                          <strong>Validación inteligente:</strong> El agente comparará los nombres considerando variaciones como:
                        </p>
                        <ul className="text-xs text-purple-600 mt-1 list-disc list-inside">
                          <li>Diferentes formatos del tipo de sociedad (S.A. de C.V. vs Sociedad Anónima de Capital Variable)</li>
                          <li>Variaciones en acentos, mayúsculas y signos de puntuación</li>
                          <li>Abreviaturas comunes (Cía., Hnos., etc.)</li>
                          <li>Errores tipográficos menores</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {currentCase && currentCase.status !== 'pendiente' && currentCase.status !== 'en_curso' && (
                    <div className={`mb-6 p-4 rounded-lg border-l-4 ${
                      currentCase.status === 'positivo' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                    }`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {currentCase.status === 'positivo' ? (
                            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">
                            <strong>Dictamen actual: {currentCase.status === 'positivo' ? 'Positivo' : 'Negativo'}</strong>
                          </p>
                          <p className="text-xs mt-1">
                            Puedes emitir un nuevo dictamen si lo deseas
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <ValidationAgent 
                    contractData={contractData}
                    fianzaData={fianzaData}
                    onValidationComplete={handleValidationComplete}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 shadow-lg rounded-lg overflow-hidden border border-gray-300">
                <div className="p-6 md:p-8">
                  <h2 className="text-3xl font-bold text-gray-500 mb-4 border-b-2 border-gray-200 pb-2">
                    Paso 3: Validación con Agente IA
                  </h2>
                  <p className="text-lg text-gray-700 mb-6">
                    Completa los Pasos 1 y 2 antes de proceder a la validación con el agente IA.
                  </p>
                  
                  <div className="bg-gray-200 rounded-lg p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-4 text-gray-500">Este paso se desbloqueará después de procesar un contrato y una fianza.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <svg className="mx-auto h-16 w-16 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Selecciona o crea un expediente</h2>
            <p className="mt-2 text-gray-600">Selecciona un expediente existente para comenzar el proceso de dictaminación o crea uno nuevo.</p>
          </div>
        )}
      </div>
    </main>
  );
}
