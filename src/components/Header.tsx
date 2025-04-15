import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 flex items-center justify-center bg-blue-700 text-white rounded-md font-bold text-xl">
                A
              </div>
            </div>
            <div className="ml-3">
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-700 transition">
                ACMES Dictaminador
              </Link>
              <p className="text-sm text-gray-800">Sistema de Análisis Documental</p>
            </div>
          </div>
          <nav className="flex space-x-4">
            <Link 
              href="/" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:text-blue-700 hover:bg-blue-50 transition"
            >
              Inicio
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 