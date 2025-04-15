import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById } from '@/lib/documents';
import { execFileSync } from 'child_process';
import path from 'path';
import { Validation } from '@/lib/types';

// Ruta para validar los documentos (contrato y fianza)
export async function POST(req: NextRequest) {
  try {
    // Recibir los IDs de los documentos a validar
    const { contractId, fianzaId } = await req.json();

    if (!contractId || !fianzaId) {
      return NextResponse.json(
        { error: 'Se requieren los IDs del contrato y fianza' },
        { status: 400 }
      );
    }

    console.log(`Validando documentos: Contrato ${contractId}, Fianza ${fianzaId}`);

    // Obtener documentos de MongoDB
    const contract = await getDocumentById(contractId);
    const fianza = await getDocumentById(fianzaId);

    if (!contract || !fianza) {
      return NextResponse.json(
        { 
          error: 'No se encontraron los documentos',
          details: {
            contractFound: !!contract,
            fianzaFound: !!fianza
          }
        },
        { status: 404 }
      );
    }

    // Verificar que los documentos tengan los campos requeridos
    if (!contract.fields || !fianza.fields) {
      return NextResponse.json(
        { 
          error: 'Los documentos no tienen campos extraídos',
          details: {
            contractHasFields: !!contract.fields,
            fianzaHasFields: !!fianza.fields
          }
        },
        { status: 400 }
      );
    }

    // Convertir los documentos a JSON
    const contractJson = JSON.stringify(contract);
    const fianzaJson = JSON.stringify(fianza);

    // Path al script de validación
    const validatorPath = path.resolve(process.cwd(), 'api/python/validator.py');
    console.log(`Ejecutando validador: ${validatorPath}`);

    // Ejecutar script de Python para validación
    try {
      const result = execFileSync('python3', [validatorPath, contractJson, fianzaJson], {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 60000 // 60 segundos
      });

      // Extraer la respuesta JSON del resultado
      const jsonStartIndex = result.indexOf('---JSON_START---');
      const jsonEndIndex = result.indexOf('---JSON_END---');
      
      if (jsonStartIndex === -1 || jsonEndIndex === -1) {
        console.error('Formato de respuesta de validación inválido:', result);
        return NextResponse.json(
          { error: 'Formato de respuesta inválido', fullOutput: result },
          { status: 500 }
        );
      }
      
      const jsonStr = result.substring(
        jsonStartIndex + '---JSON_START---'.length, 
        jsonEndIndex
      ).trim();
      
      // Convertir la respuesta a objeto
      const validationResult = JSON.parse(jsonStr) as Validation;
      
      // Agregar timestamp a la validación
      const validationWithMeta = {
        ...validationResult,
        timestamp: new Date().toISOString(),
        documentIds: {
          contractId,
          fianzaId
        }
      };
      
      console.log('Validación completada exitosamente');
      return NextResponse.json(validationWithMeta);
      
    } catch (execError: any) {
      console.error('Error al ejecutar el validador:', execError);
      
      return NextResponse.json(
        { 
          error: 'Error en el proceso de validación',
          message: execError.message,
          stderr: execError.stderr?.toString() || 'No disponible',
          stdout: execError.stdout?.toString() || 'No disponible'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error en la API de validación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error.message },
      { status: 500 }
    );
  }
} 