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
    "rfc": "Localiza el Registro Federal de Contribuyentes (RFC), que es una clave alfanumérica de 12 o 13 caracteres. El RFC usualmente sigue un formato específico (ej. AAA990101XXX o AAAA990101XXX o AVM590620FC3) y puede estar ubicado en las declaraciones iniciales del documento o en la sección de 'DECLARACIONES' relativas a EL ARRENDATARIO.",
    "fecha": "Usar la misma que 'contract_date' si no hay distinción clara.",
    "vigencia": "Extraer rango de fechas desde cláusula de vigencia. Formato: '01/01/2025 - 31/12/2025'",
    "arrendador": "Solo si el contrato es de arrendamiento. Buscar quién es 'EL ARRENDADOR' o 'la entidad que da en arrendamiento'.",
    "arrendatario": "Extraer si aplica al tipo de contrato. Aparece como 'EL ARRENDATARIO'.",
    "direccion": "Extrae las direcciones completas de todas las entidades mencionadas en el contrato. Busca frases como 'tiene su domicilio en', 'tiene establecido su domicilio en', o busca en las secciones de 'DECLARACIONES', en el encabezado del contrato o revisa si hay una seccion 'DIRECCION'. Incluye todos los componentes de la dirección (calle, número, colonia, código postal, ciudad, estado) si están disponibles. Extrae todas las direcciones presentes. Ej. 'AVE DE LOS 100 METROS 733, Col. Nueva Industrial Vallejo, Gustavo A. Madero, Ciudad de Mexico, CP. 07700'.",
    "monto": "Tomar de la cláusula de monto, extraer tanto mínimo como máximo si está en formato de contrato abierto.",
    "razon_social_contratante": "Siempre es 'Aeropuerto Internacional Felipe Ángeles, S.A. de C.V.'.",
    "razon_social_arrendador": "Aplicable solo si el AIFA arrienda un espacio, puede ser la razón social del AIFA o de la entidad que otorga el bien.",
    "razon_social_arrendatario": "Aplicar si el contrato es de arrendamiento. Buscar en la sección de declaraciones o cláusulas iniciales.",
    "clausulados": "Detectar secciones que comiencen con 'PRIMERA', 'SEGUNDA', etc. hasta el final del documento. Enumerarlas con su título. SIEMPRE incluye el nombre de la clausula (ejemplo: 'DÉCIMA SÉPTIMA.- TRANSPORTE.'), agrupar en un array de la forma [{title: 'DÉCIMA SÉPTIMA.- TRANSPORTE.', 'content': 'TODO el contenido sin resumir hasta el inicio de la siguiente cláusula'}].",
    
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
    "fianza_id": "Número único de la fianza. Generalmente aparece como 'No. de Fianza' o 'Fianza Número' y puede ser numérico o alfanumérico. Ejemplo: '1102-02725-0'. de no encontrarlo, indica que no se encuentra.",
    "fiado": "Nombre completo de la empresa o persona afianzada (quien contrata la fianza). En el documento puede aparecer como 'Por' o junto a la dirección del fiado.",
    "beneficiary_name": "Nombre del beneficiario a favor de quien se emite la fianza. Usualmente identificado como 'ANTE:' o 'A favor de:'",
    "domicilio": "Domicilio del beneficiario (por ejemplo, el aeropuerto), si está disponible en el documento.",
    "contrato_id": "Número del contrato vinculado a la fianza. Suele seguir un formato como 'AIFA-...' y aparece en el texto explicativo sobre las obligaciones garantizadas.",
    "contrato_fecha": "Fecha en que fue firmado el contrato relacionado. Usualmente aparece como parte del párrafo que describe el contrato entre fiado y beneficiario o en 'lugar y fecha de expedición'.",
    "objecto": "Descripción del objeto o propósito de la fianza, como 'cumplimiento de contrato', 'servicios aeroportuarios', etc. Se puede encontrar en las cláusulas que describen qué se garantiza.",
    "vigencia": "Fechas de inicio y fin de vigencia de la fianza. Busca expresiones como 'INICIO DE VIGENCIA' o 'del [fecha] al [fecha]'. Puede no contener una fecha de fin, si no una condicion como 'y hasta que x haya cumplido con todas...', ACOMODA las fechas en el formato 'del [fecha] al [fecha]' en caso de que haya una fecha de fin, si no, retorna la fecha de inicio y la condicion como fecha de fin.",
    "monto": "Monto total garantizado por la fianza. Aparece en texto numérico y puede aparecer en letras, por ejemplo '$457,325.13 (CUATROCIENTOS...)'.",
    "declaraciones": "Declaraciones y condiciones generales contenidas en la póliza. Aparecen en forma de incisos o listados que indican las reglas del contrato, la cancelación, la vigencia extendida, etc., enlista en un array",
}


DEFAULT_SEGURO_FIELDS = {
    "poliza_id": "Número de la póliza. Generalmente aparece como 'No. de Póliza' y puede ser numérico o alfanumérico, tambien suele contener guiones (ejemplo: '01-046-07000354-00000-01').",
    "asegurado": "Nombre de la aseguradora o empresa emisora, retorna un array con la razón social del contrato y su filial si es diferente. Ejemplo: ['Aeropuerto Internacional Felipe Ángeles, S.A. de C.V.', 'AIFA'] ",
    "vigencia": "La fecha de inicio y fin de la póliza, generalmente aparece como 'INICIO DE VIGENCIA' o 'del [fecha] al [fecha]' ejemplo: '01 de abril del 2024 al 01 de abril del 2025'.",
    "ubicacion_riesgo": "es una descripción de la ubicación del riesgo, generalmente una dirección o indicador de ubicación, aparece como 'Ubicación del riesgo: ' ejemplo: 'Adyacente a la Plataforma del M.R.O., frente a la Terminal de Carga y Aduana dentro del Aeropuerto Internacional Felipe Ángeles.'.",
    "cobertura": "Tipo o tipos de responsabilidad civil que tiene la póliza de seguro, generalmente aparece como 'TIPO DE COBERTURA' o 'TIPO DE SEGURO' ejemplo: 'Responsabilidad Civil Hangares predios y operaciones incluyendo daños a Aeronaves secciones II'.",
    "clausulas_beneficiario": "Aparece como 'beneficiario preferente' o como 'Interés Asegurado'  y se menciona el aeropuerto y el texto que lo acompaña antes y despues, de no encontrarlo, indica que no se encuentra o N/A.",
    "clausulas_poliza": "Extrae en un array las clausulas de la póliza, suelen estar enlistadas por incisos o puntos y estar seguidos de 'conviene que:', de no encontrarlo, indica que no se encuentra o N/A.",
}
