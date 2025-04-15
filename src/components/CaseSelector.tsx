'use client';

import React, { useState, useEffect } from 'react';
import { Case, CaseStatus } from '@/lib/types';

interface CaseSelectorProps {
  onCaseSelected: (caseId: string | null) => void;
  selectedCaseId?: string | null;
}

export default function CaseSelector({ onCaseSelected, selectedCaseId }: CaseSelectorProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [newCaseDescription, setNewCaseDescription] = useState('');
  const [showAllCases, setShowAllCases] = useState(false);
  
  // Estados para edición de expedientes
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editCaseName, setEditCaseName] = useState('');
  const [editCaseDescription, setEditCaseDescription] = useState('');
  const [editCaseStatus, setEditCaseStatus] = useState<CaseStatus>('pendiente');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estados para eliminación de expedientes
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Cargar los expedientes al montar el componente
  useEffect(() => {
    loadCases();
  }, []);
  
  // Filtrar expedientes cuando se cargan o cuando cambia el estado del filtro
  useEffect(() => {
    if (showAllCases) {
      setFilteredCases(cases);
    } else {
      // Filtrar solo expedientes activos (pendiente o en_curso)
      setFilteredCases(cases.filter(caseItem => 
        caseItem.status === 'pendiente' || caseItem.status === 'en_curso'
      ));
    }
  }, [cases, showAllCases]);
  
  // Función para cargar los expedientes
  async function loadCases() {
    try {
      setLoading(true);
      const response = await fetch('/api/cases');
      if (!response.ok) {
        throw new Error('Error al cargar los expedientes');
      }
      const data = await response.json();
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los expedientes');
      console.error('Error fetching cases:', err);
    } finally {
      setLoading(false);
    }
  }
  
  // Función para crear un nuevo expediente
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseName.trim()) return;
    
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCaseName,
          description: newCaseDescription,
          status: 'pendiente' as CaseStatus
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al crear el expediente');
      }
      
      const newCase = await response.json();
      setCases(prevCases => [newCase, ...prevCases]);
      setNewCaseName('');
      setNewCaseDescription('');
      setShowNewCaseForm(false);
      
      // Seleccionar automáticamente el nuevo expediente
      onCaseSelected(newCase.case_id);
    } catch (err: any) {
      setError(err.message || 'Error al crear el expediente');
      console.error('Error creating case:', err);
    }
  };
  
  // Iniciar edición de un expediente
  const startEditing = (caseItem: Case, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se seleccione el expediente
    setEditingCaseId(caseItem.case_id);
    setEditCaseName(caseItem.name);
    setEditCaseDescription(caseItem.description || '');
    setEditCaseStatus(caseItem.status);
  };
  
  // Guardar cambios en un expediente
  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaseId || !editCaseName.trim() || isUpdating) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/cases/${editingCaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCaseName,
          description: editCaseDescription,
          status: editCaseStatus
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el expediente');
      }
      
      const updatedCase = await response.json();
      
      // Actualizar la lista de expedientes
      setCases(prevCases => prevCases.map(caseItem => 
        caseItem.case_id === editingCaseId ? updatedCase : caseItem
      ));
      
      // Limpiar estado de edición
      cancelEditing();
      
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el expediente');
      console.error('Error updating case:', err);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Cancelar edición
  const cancelEditing = () => {
    setEditingCaseId(null);
    setEditCaseName('');
    setEditCaseDescription('');
    setEditCaseStatus('pendiente');
  };
  
  // Obtener el color basado en el estado
  const getStatusColor = (status: CaseStatus): string => {
    switch (status) {
      case 'pendiente':
        return 'bg-gray-200 text-gray-800';
      case 'en_curso':
        return 'bg-blue-200 text-blue-800';
      case 'positivo':
        return 'bg-green-200 text-green-800';
      case 'negativo':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };
  
  // Obtener el texto del estado
  const getStatusText = (status: CaseStatus): string => {
    switch (status) {
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
  
  // Función para iniciar el proceso de eliminación
  const startDeleting = (caseItem: Case, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se seleccione el expediente
    setDeletingCaseId(caseItem.case_id);
    setShowDeleteConfirm(true);
  };
  
  // Función para eliminar un expediente
  const handleDeleteCase = async () => {
    if (!deletingCaseId || isDeleting) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/cases/${deletingCaseId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el expediente');
      }
      
      // Actualizar la lista de expedientes
      setCases(prevCases => prevCases.filter(caseItem => 
        caseItem.case_id !== deletingCaseId
      ));
      
      // Si el expediente eliminado era el seleccionado, deseleccionarlo
      if (selectedCaseId === deletingCaseId) {
        onCaseSelected(null);
      }
      
      // Limpiar estado de eliminación
      cancelDeleting();
      
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el expediente');
      console.error('Error deleting case:', err);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Cancelar eliminación
  const cancelDeleting = () => {
    setDeletingCaseId(null);
    setShowDeleteConfirm(false);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Expedientes</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAllCases(!showAllCases)}
            className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition text-sm"
          >
            {showAllCases ? 'Mostrar activos' : 'Mostrar todos'}
          </button>
          <button
            onClick={() => setShowNewCaseForm(!showNewCaseForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {showNewCaseForm ? 'Cancelar' : 'Nuevo Expediente'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Cerrar
          </button>
        </div>
      )}
      
      {showNewCaseForm && (
        <form onSubmit={handleCreateCase} className="mb-6 bg-gray-50 p-4 rounded-md">
          <div className="mb-4">
            <label htmlFor="caseName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Expediente *
            </label>
            <input
              type="text"
              id="caseName"
              value={newCaseName}
              onChange={(e) => setNewCaseName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contrato AIFA-DCS-2023"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="caseDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              id="caseDescription"
              value={newCaseDescription}
              onChange={(e) => setNewCaseDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción breve del expediente..."
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Crear Expediente
            </button>
          </div>
        </form>
      )}
      
      {/* Modal de edición de expediente */}
      {editingCaseId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Expediente</h3>
            <form onSubmit={handleUpdateCase}>
              <div className="mb-4">
                <label htmlFor="editCaseName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Expediente *
                </label>
                <input
                  type="text"
                  id="editCaseName"
                  value={editCaseName}
                  onChange={(e) => setEditCaseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="editCaseDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  id="editCaseDescription"
                  value={editCaseDescription}
                  onChange={(e) => setEditCaseDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="editCaseStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado del Expediente
                </label>
                <select
                  id="editCaseStatus"
                  value={editCaseStatus}
                  onChange={(e) => setEditCaseStatus(e.target.value as CaseStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_curso">En curso</option>
                  <option value="positivo">Dictamen positivo</option>
                  <option value="negativo">Dictamen negativo</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                  disabled={isUpdating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Eliminar Expediente</h3>
            <p className="mb-4 text-gray-700">
              ¿Estás seguro de que deseas eliminar este expediente? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCase}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Eliminando...
                  </>
                ) : 'Eliminar expediente'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">
            {cases.length === 0 
              ? 'No hay expedientes disponibles' 
              : 'No hay expedientes activos. Cambia el filtro para ver todos los expedientes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredCases.map((caseItem) => (
              <div 
                key={caseItem.case_id}
                className={`border rounded-md p-4 cursor-pointer transition hover:border-blue-400 ${selectedCaseId === caseItem.case_id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => onCaseSelected(caseItem.case_id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{caseItem.name}</h3>
                    {caseItem.description && (
                      <p className="text-sm text-gray-600 mt-1">{caseItem.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Creado: {new Date(caseItem.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${getStatusColor(caseItem.status)}`}>
                      {getStatusText(caseItem.status)}
                    </span>
                    {/* Acciones */}
                    <div className="flex space-x-2">
                      {/* Botón de edición */}
                      <button
                        onClick={(e) => startEditing(caseItem, e)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Editar
                      </button>
                      {/* Botón de eliminación */}
                      <button
                        onClick={(e) => startDeleting(caseItem, e)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
                {selectedCaseId === caseItem.case_id && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    Seleccionado actualmente
                  </div>
                )}
              </div>
            ))}
          </div>
          {showAllCases && filteredCases.length > 0 && (
            <button
              onClick={() => onCaseSelected(null)}
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              Sin expediente
            </button>
          )}
        </div>
      )}
    </div>
  );
} 