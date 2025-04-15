import React, { useState } from 'react';

interface ErrorDisplayProps {
  error: string;
  details?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, details }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-grow">
          <h3 className="text-sm font-medium text-red-800">Error al procesar el documento</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
            
            {details && (
              <div className="mt-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs font-medium text-red-700 underline"
                >
                  {showDetails ? 'Ocultar detalles' : 'Mostrar detalles técnicos'}
                </button>
                
                {showDetails && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-40">
                    {details}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay; 