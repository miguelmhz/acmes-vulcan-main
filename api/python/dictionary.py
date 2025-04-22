# Default field descriptions
DEFAULT_CONTRACT_FIELDS = {
    "contract_id": "Buscar en encabezado o primeras páginas, usualmente aparece como 'CONTRATO: AIFA-...' o en campos destacados tipo expediente.",
    "contract_type": "Buscar cláusula primera o encabezado del documento, identificar si se trata de prestación de servicios, arrendamiento o adquisición de bienes.",
    "beneficiary_name": "Extraer el nombre del beneficiario si está especificado como tal. En contratos AIFA puede no estar explícito, verificar en declaraciones.",
    "contractor_name": "Buscar en la parte inicial del contrato o declaraciones de 'EL PROVEEDOR' o 'la empresa' o 'LA OTRA PARTE'. Aparece como nombre de la empresa firmante.",
    "contract_date": "Buscar al final del contrato, junto a las firmas, normalmente aparece como 'Fecha de firma'.",
    "effective_date": "Buscar en cláusula de vigencia o cláusula quinta. Usualmente expresado como 'el día 1 de enero de...' o similar.",
    "expiration_date": "Buscar en la misma cláusula de vigencia, donde dice hasta qué día aplica el contrato.",
    "contract_amount": "Extraer los montos máximos y mínimos (sin IVA y con IVA) si es contrato abierto. Buscar en cláusula 'SEGUNDA' o 'MONTO'.",
    "payment_terms": "Buscar cláusula cuarta, llamada 'FORMA Y LUGAR DE PAGO'. Buscar mención de pagos a mes vencido, plazos (20 días), y condiciones.",
    "rfc": "Buscar su Registro Federal de Contribuyentes (RFC), es una clave de 13 caracteres alfanumérica.",
    "fecha": "Usar la misma que 'contract_date' si no hay distinción clara.",
    "vigencia": "Extraer rango de fechas desde cláusula de vigencia. Formato: '01/01/2025 - 31/12/2025'",
    "arrendador": "Solo si el contrato es de arrendamiento. Buscar quién es 'EL ARRENDADOR' o 'la entidad que da en arrendamiento'.",
    "arrendatario": "Extraer si aplica al tipo de contrato. Aparece como 'EL ARRENDATARIO'.",
    "direccion": "Buscar en cláusula quinta o en anexos donde se mencionan ubicación o ejecución del servicio, o tambien Localizar en las declaraciones del proveedor. Aparece como: 'Tiene establecido su domicilio en...', seguido por dirección completa incluyendo calle, número, colonia, C.P., ciudad y estado. A menudo termina con 'mismo que señala para los fines y efectos legales...",
    "monto": "Tomar de la cláusula de monto, extraer tanto mínimo como máximo si está en formato de contrato abierto.",
    "razon_social_contratante": "Siempre es 'Aeropuerto Internacional Felipe Ángeles, S.A. de C.V.'.",
    "razon_social_arrendador": "Aplicable solo si el AIFA arrienda un espacio, puede ser la razón social del AIFA o de la entidad que otorga el bien.",
    "razon_social_arrendatario": "Aplicar si el contrato es de arrendamiento. Buscar en la sección de declaraciones o cláusulas iniciales.",
    "clausulados": "Detectar secciones que comiencen con 'PRIMERA', 'SEGUNDA', etc. hasta el final del documento. Enumerarlas con su título. Incluye el nombre de la clausula (ejemplo: 'DÉCIMA SÉPTIMA. – TRANSPORTE.')",
    
    "cuota_servicios": "Buscar el porcentaje adicional por concepto de mantenimiento, aparece tras el monto o en cláusulas específicas.",
    "fianza_monto": "Buscar en cláusula de garantías o anexos, usualmente el 10% del monto máximo sin IVA. Aparece como cifra en pesos.",
    "fianza_detalles": "Extraer listado de requisitos que debe incluir la póliza de fianza. Aparece como puntos o incisos en cláusula de garantías.",
    "seguro_detalles": "Extraer condiciones obligatorias de la póliza de responsabilidad civil, incluyendo coberturas y montos.",
    "tipo_servicio_movilidad": "En contratos de movilidad, identificar si se refiere a taxi, autobús, estacionamiento, etc. Aparece en cláusula primera o descripción.",
    "tipo_subcontrato": "En contratos de prestadores aeroportuarios, identificar si se trata de arrendamiento, servicios o recaudación.",
    "tua_mecanismo_recaudacion": "Buscar en contratos de recaudación si se especifica el método de cobro de TUA, condiciones y porcentajes.",
    "naturaleza_obligaciones": "En cláusula de garantía, buscar si las obligaciones se describen como 'divisibles' o 'indivisibles'.",
    "jurisdiccion": "Buscar al final del contrato, después de las cláusulas, aparece como entidad responsable de resolución legal."
}


DEFAULT_FIANZA_FIELDS = {
    "fianza_id": "Número único de la póliza de fianza. Generalmente aparece como 'No. de Fianza' y puede ser numérico o alfanumérico.",
    "fiado": "Nombre completo de la empresa o persona afianzada (quien contrata la fianza). En el documento puede aparecer como 'Por' o junto a la dirección del fiado.",
    "beneficiary_name": "Nombre del beneficiario a favor de quien se emite la fianza. Usualmente identificado como 'ANTE:' o en la cláusula que menciona quién puede hacerla efectiva.",
    "beneficiary_address": "Domicilio del beneficiario (por ejemplo, el aeropuerto), si está disponible en el documento.",
    "contract_id": "Número del contrato vinculado a la fianza. Suele seguir un formato como 'AIFA-...' y aparece en el texto explicativo sobre las obligaciones garantizadas.",
    "contract_date": "Fecha en que fue firmado el contrato relacionado. Usualmente aparece como parte del párrafo que describe el contrato entre fiado y beneficiario.",
    "object_description": "Descripción del objeto o propósito de la fianza, como 'cumplimiento de contrato', 'servicios aeroportuarios', etc. Se puede encontrar en las cláusulas que describen qué se garantiza.",
    "validity_date": "Fechas de inicio y fin de vigencia de la fianza. Busca expresiones como 'INICIO DE VIGENCIA' o 'del [fecha] al [fecha]'.",
    "fianza_amount": "Monto total garantizado por la fianza. Aparece en texto numérico y en letras, por ejemplo '$457,325.13 (CUATROCIENTOS...)'.",
    "currency": "Moneda en la que está expresada la fianza. Generalmente aparece como 'MONEDA: PESOS' o similar.",
    "policy_statements": "Declaraciones y condiciones generales contenidas en la póliza. Aparecen en forma de incisos o listados que indican las reglas del contrato, la cancelación, la vigencia extendida, etc."
}


DEFAULT_SEGURO_FIELDS = {
    "poliza_id": "Número de la póliza",
    "aseguradora": "Nombre de la aseguradora o empresa emisora",
    "fecha_emision": "Fecha de emisión de la póliza",
    "fecha_inicio": "Fecha de inicio de cobertura",
    "fecha_fin": "Fecha de fin de cobertura",
    "asegurado": "Nombre del asegurado",
    "beneficiario": "Nombre del beneficiario si es diferente",
    "monto_cobertura": "Monto o suma asegurada",
    "prima": "Monto de la prima",
    "tipo_seguro": "Tipo de seguro (daños, vida, etc.)",
    "cobertura": "Descripción de la cobertura",
    "exclusiones": "Principales exclusiones si se mencionan"
}
