# ACMES Dictaminador - Next.js Version

Sistema avanzado para extracción, validación y análisis de documentos contractuales utilizando Next.js, Python, MongoDB y Mistral AI.

## Características

- **Extracción inteligente** de documentos contractuales (contratos, fianzas, seguros, etc.) utilizando OCR y procesamiento de lenguaje natural
- **Interfaz moderna** construida con Next.js y Tailwind CSS
- **API de extracción** para procesar documentos en diversos formatos
- **Validación automatizada** de documentos relacionados
- **Almacenamiento en MongoDB** para guardar y relacionar documentos extraídos
- **Flujo de trabajo guiado** con pasos dependientes (Paso 2 sólo se habilita después de procesar un contrato)
- **Procesamiento avanzado** utilizando Mistral AI para la extracción de información

## Requisitos Previos

- Node.js 18.x o superior
- Python 3.8 o superior
- MongoDB (local o remoto)
- API key de Mistral AI para OCR y extracción de texto

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/acmes-dictaminador.git
cd acmes-dictaminador-next
```

### 2. Instalar dependencias de Node.js

```bash
npm install
```

### 3. Instalar dependencias de Python

```bash
pip install requests pdfplumber python-dotenv mongodb
```

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```
MISTRAL_API_KEY=tu_api_key_de_mistral
MONGODB_URI=mongodb://localhost:27017
```

## Ejecución

### Desarrollo

```bash
npm run dev
```

Esto iniciará el servidor de desarrollo de Next.js en http://localhost:3000.

### Producción

```bash
npm run build
npm start
```

## Estructura del Proyecto

- `/src/app` - Páginas y rutas de Next.js App Router
- `/src/components` - Componentes React 
- `/src/lib` - Utilidades y servicios (MongoDB, etc.)
- `/src/app/api` - Rutas de API de Next.js
- `/api/python` - Scripts de Python para extracción de documentos
- `/temp` - Directorio para almacenamiento temporal de archivos

## Flujo de trabajo

1. **Paso 1: Análisis de Contratos**
   - Sube un contrato para su procesamiento
   - El sistema extrae información clave (ID, partes, montos, fechas)
   - La información se almacena en MongoDB para su uso posterior

2. **Paso 2: Análisis de Pólizas y Fianzas** (sólo disponible después de procesar un contrato)
   - Sube una póliza de fianza o seguro
   - El sistema relaciona automáticamente la póliza con el último contrato procesado
   - Se valida que la póliza cumpla con los requisitos del contrato

## API de Extracción

La API de extracción está disponible en `/api/extract` y acepta solicitudes POST con los siguientes parámetros:

- `file` - Archivo del documento (PDF, DOCX, TXT, etc.)
- `documentType` (opcional) - Tipo de documento (contract, fianza, seguro, complementario, other)
- `useOcr` (opcional) - Utilizar OCR para documentos escaneados (true/false)
- `relatedContractId` (opcional) - ID del contrato relacionado para pólizas de fianza o seguro

Ejemplo de respuesta:

```json
{
  "document_type": "contract",
  "document_id": "contract_12345",
  "fields": {
    "contract_id": "AIFA-DCS-SSC-024-2022",
    "contract_type": "Arrendamiento",
    "beneficiary_name": "AEROPUERTO INTERNACIONAL FELIPE ÁNGELES S.A. DE C.V.",
    "contractor_name": "BRITT SHOPS RETAIL DE MEXICO S.A DE C.V",
    "contract_date": "15 de abril de 2023",
    "effective_date": "15 de abril de 2023",
    "expiration_date": "14 de abril de 2024",
    "contract_amount": "$371,385.60 MXN",
    "payment_terms": "Mensual"
  },
  "processing_time": 3.45,
  "metadata": {
    "text_length": 24500,
    "use_ocr": true
  },
  "db_id": "65f8a1b2c3d4e5f6a7b8c9d0"
}
```

## Integración con MongoDB

El sistema utiliza MongoDB para:

1. Almacenar los resultados de extracción de documentos
2. Relacionar pólizas de fianza con sus contratos correspondientes
3. Mantener un historial de todos los documentos procesados

La estructura de colecciones es:

- `documents` - Contiene todos los documentos procesados con sus campos extraídos

## Integración con Mistral AI

El sistema utiliza la API de Mistral AI para:

1. Extraer texto de documentos escaneados (OCR)
2. Extraer campos específicos de texto utilizando procesamiento de lenguaje natural
3. Analizar documentos con instrucciones personalizadas

Para obtener una API key de Mistral, regístrate en [https://mistral.ai/](https://mistral.ai/).

## Extensión y Personalización

### Añadir nuevos tipos de documentos

Para añadir un nuevo tipo de documento, modifica los siguientes archivos:

1. `src/components/DocumentUploader.tsx` - Añadir el nuevo tipo al selector
2. `api/python/extractor.py` - Añadir definiciones y lógica de extracción
3. `src/lib/documents.ts` - Actualizar los tipos de documentos si es necesario

### Personalizar campos extraídos

Los campos extraídos se definen en `api/python/extractor.py` en las constantes:

- `DEFAULT_CONTRACT_FIELDS`
- `DEFAULT_DOCUMENT_FIELDS`

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## Contacto

Para consultas técnicas, contactar a [tu@email.com](mailto:tu@email.com).
