"use client";

import {useState, useRef, ChangeEvent, FormEvent} from "react";
import DocumentResults from "./DocumentResults";

type DocumentType =
  | "contract"
  | "fianza"
  | "seguro"
  | "complementario"
  | "other";

interface UploadResult {
  document_type: DocumentType;
  document_id: string;
  fields: Record<string, any>;
  error?: string;
  processing_time: number;
  metadata: Record<string, any>;
  db_id?: string;
}

interface DocumentUploaderProps {
  defaultDocumentType?: DocumentType | "";
  onExtracted?: (result: UploadResult) => void;
  relatedContractId?: string;
  caseId?: string | null;
}

export default function DocumentUploader({
  defaultDocumentType = "",
  onExtracted,
  relatedContractId,
  caseId,
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | "">(
    defaultDocumentType,
  );
  const [useOcr, setUseOcr] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExtractedData, setShowExtractedData] = useState(false);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3 * 60 * 1000);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Por favor selecciona un archivo");
      return;
    }

    if (!documentType) {
      setError("Por favor selecciona un tipo de documento");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    formData.append("useOcr", useOcr.toString());

    if (relatedContractId) {
      formData.append("relatedContractId", relatedContractId);
    }

    if (caseId) {
      formData.append("caseId", caseId);
    }
    
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      console.log(response);
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al procesar el documento");
      }

      const result: UploadResult = await response.json();

      if (result.error) {
        // Detectar errores específicos de Mistral API
        if (
          result.error.includes("Mistral API error: 401") ||
          result.error.includes("Unauthorized")
        ) {
          setError(
            "Error de autenticación con Mistral API. Verifica la API key en el archivo .env.local",
          );
        } else {
          setError(result.error);
        }
        setIsLoading(false);
        return;
      }

      // Verificar si hay campos extraídos
      const hasExtractedFields =
        result.fields && Object.keys(result.fields).length > 0;

      if (!hasExtractedFields) {
        setError(
          "No se pudieron extraer datos del documento. Esto puede deberse a un error con el API de Mistral.",
        );
        setIsLoading(false);
        return;
      }

      setUploadResult(result);
      onExtracted && onExtracted(result);
      setShowExtractedData(true);

      // Reset form after 3 seconds but keep the results visible
      setTimeout(() => {
        setFile(null);
        setDocumentType(defaultDocumentType);
        setUseOcr(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 3000);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setError(error.message || "Error al procesar el documento");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="document-type"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Tipo de Documento
          </label>
          <select
            id="document-type"
            name="documentType"
            value={documentType}
            onChange={(e) =>
              setDocumentType(e.target.value as DocumentType | "")
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="">Seleccionar tipo de documento</option>
            <option value="contract">Contrato</option>
            <option value="fianza">Fianza</option>
            <option value="seguro">Póliza de Seguro</option>
            <option value="complementario">Documento Complementario</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="file-upload"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Documento (PDF, DOC, DOCX)
          </label>
          <div className="mt-1 flex items-center">
            <span className="inline-block h-12 w-12 overflow-hidden rounded-md bg-gray-100">
              <svg
                className="h-full w-full text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <input
              id="file-upload"
              name="file"
              type="file"
              ref={fileInputRef}
              className="sr-only"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              required
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ml-5 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Seleccionar archivo
            </button>
          </div>
          {file && (
            <p className="mt-2 text-sm text-gray-700">
              Archivo seleccionado: {file.name} (
              {(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="use-ocr"
            name="useOcr"
            type="checkbox"
            checked={useOcr}
            onChange={(e) => setUseOcr(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="use-ocr" className="ml-2 block text-sm text-gray-900">
            Usar OCR (para documentos escaneados)
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || !file || !documentType}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading || !file || !documentType
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
          >
            {isLoading ? "Procesando..." : "Procesar Documento"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              {error.includes("Mistral API") && (
                <p className="text-xs text-red-600 mt-1">
                  Asegúrate de que MISTRAL_API_KEY está correctamente
                  configurada en el archivo .env.local
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <svg
              className="animate-spin h-5 w-5 text-blue-500 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-blue-800">
              Extrayendo datos del documento...
            </span>
          </div>
          <div className="mt-2 text-sm text-blue-600">
            <p>
              Esto puede tomar hasta 30 segundos dependiendo del tamaño del
              documento
            </p>
            {useOcr && (
              <p className="mt-1">
                El OCR está habilitado, lo que puede aumentar el tiempo de
                procesamiento
              </p>
            )}
          </div>
        </div>
      )}

      {(uploadResult || showExtractedData) && !error && (
        <div className="mt-6">
          <div className="bg-white rounded-md shadow-sm p-4 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Datos Extraídos
              </h3>
              <button
                onClick={() => setShowExtractedData(!showExtractedData)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {showExtractedData ? "Ocultar Detalles" : "Mostrar Detalles"}
              </button>
            </div>

            {showExtractedData && uploadResult && (
              <>
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">
                    Resumen
                  </h4>
                  <p className="text-sm text-gray-600">
                    Tipo de Documento:{" "}
                    <span className="font-medium">
                      {uploadResult.document_type}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    ID:{" "}
                    <span className="font-medium">
                      {uploadResult.document_id}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Tiempo de Procesamiento:{" "}
                    <span className="font-medium">
                      {uploadResult.processing_time.toFixed(2)} segundos
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Campos Extraídos:{" "}
                    <span className="font-medium">
                      {Object.keys(uploadResult.fields).length}
                    </span>
                  </p>
                </div>

                <DocumentResults result={uploadResult} />
              </>
            )}

            {!showExtractedData && uploadResult && (
              <div className="flex space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {Object.keys(uploadResult.fields).length} campos
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {uploadResult.document_type}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {uploadResult.processing_time.toFixed(2)}s
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
