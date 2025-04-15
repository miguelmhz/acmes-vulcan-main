import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById } from '@/lib/documents';
import { spawn } from 'child_process';
import path from 'path';
import { saveValidationResult } from '@/lib/cases';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { contractId, fianzaId, caseId } = await request.json();
    
    if (!contractId || !fianzaId) {
      return NextResponse.json(
        { error: 'Se requieren los IDs de contrato y fianza' },
        { status: 400 }
      );
    }
    
    // Obtener documentos de MongoDB
    const contractData = await getDocumentById(contractId);
    const fianzaData = await getDocumentById(fianzaId);
    
    if (!contractData) {
      return NextResponse.json(
        { error: 'No se encontró el contrato' },
        { status: 404 }
      );
    }
    
    if (!fianzaData) {
      return NextResponse.json(
        { error: 'No se encontró la fianza' },
        { status: 404 }
      );
    }
    
    // Path al script Python del agente validador
    const scriptPath = path.resolve(process.cwd(), 'api/python/validator.py');
    
    // Path to virtual environment Python
    const pythonPath = path.resolve(process.cwd(), 'venv/bin/python');
    
    // Ejecutar el script Python con los documentos como argumentos
    const response = await new Promise<NextResponse>((resolve, reject) => {
      const startTime = Date.now();
      
      const pythonProcess = spawn(pythonPath, [
        scriptPath,
        JSON.stringify(contractData),
        JSON.stringify(fianzaData)
      ]);
      
      let stdoutData = '';
      let stderrData = '';
      
      // Recolectar salida estándar
      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      // Recolectar errores
      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error(`Validator stderr: ${data.toString()}`);
      });
      
      pythonProcess.on('close', async (code) => {
        console.log(`Validation process exited with code ${code}`);
        
        if (code !== 0) {
          console.error('Python validation error:', stderrData);
          resolve(
            NextResponse.json(
              { error: 'Error en el proceso de validación', details: stderrData },
              { status: 500 }
            )
          );
          return;
        }
        
        try {
          // Extraer JSON de la salida
          const jsonPattern = /---JSON_START---\n([\s\S]*?)---JSON_END---/;
          const jsonMatch = stdoutData.match(jsonPattern);
          const jsonString = jsonMatch ? jsonMatch[1] : null;
            
          if (!jsonString) {
            throw new Error('No se encontró JSON en la respuesta del validador');
          }
            
          // Analizar el JSON
          const validationResult = JSON.parse(jsonString);
          
          // Añadir tiempo de procesamiento
          validationResult.validationTime = (Date.now() - startTime) / 1000;
          
          // Verificar si hay DICTAMEN explícito al inicio del reporte
          const dictamenMatch = validationResult.report.match(/DICTAMEN:\s*\[([^\]]+)\]/i);
          if (dictamenMatch) {
            const dictamenTexto = dictamenMatch[1].trim().toUpperCase();
            const esPositivo = dictamenTexto.includes('POSITIVO');
            // Corregir isValid si es necesario para alinearlo con el texto del dictamen
            if (validationResult.isValid !== esPositivo) {
              console.log(`Corrigiendo isValid de ${validationResult.isValid} a ${esPositivo} según el texto del dictamen`);
              validationResult.isValid = esPositivo;
            }
          }
          
          // Añadir info del caso si existe
          if (caseId) {
            validationResult.case_id = caseId;
            
            // Guardar el resultado de validación y actualizar el estado del caso
            try {
              await saveValidationResult({
                ...validationResult,
                case_id: caseId,
                documentIds: {
                  contractId,
                  fianzaId
                }
              });
              console.log(`Validation result saved and case ${caseId} updated`);
            } catch (err) {
              console.error('Error saving validation result:', err);
              // Continuar aunque haya error al guardar
            }
          }
          
          resolve(NextResponse.json(validationResult));
        } catch (err: any) {
          console.error('Error parsing validation result:', err);
          resolve(
            NextResponse.json(
              { 
                error: 'Error al analizar los resultados de validación',
                details: err.message,
                stdout: stdoutData
              },
              { status: 500 }
            )
          );
        }
      });
      
      pythonProcess.on('error', (err) => {
        console.error('Failed to start validation process:', err);
        resolve(
          NextResponse.json(
            { error: 'Error al iniciar el proceso de validación', details: err.message },
            { status: 500 }
          )
        );
      });
    });
    
    return response;
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', details: error.message },
      { status: 500 }
    );
  }
} 