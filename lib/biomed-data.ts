import {
  Activity,
  Baby,
  Bolt,
  ClipboardCheck,
  Droplets,
  Flame,
  Gauge,
  HeartPulse,
  Monitor,
  Radio,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Thermometer,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type EquipmentId =
  | "patient-monitor"
  | "infusion-pump"
  | "defibrillator"
  | "ventilator"
  | "autoclave"
  | "neonatal-incubator"
  | "electrosurgery";

export type LayerMode = "surface" | "layers" | "cross-section" | "compare";

export interface EquipmentHotspot {
  id: string;
  label: string;
  subsystem: string;
  description: string;
  position: [number, number, number];
}

export interface PracticeLink {
  label: string;
  quizCategory: string;
  caseCategory: string;
  reportType: string;
}

export interface EquipmentItem {
  id: EquipmentId;
  name: string;
  shortName: string;
  category: string;
  status: "operativo" | "revision" | "alto riesgo";
  icon: LucideIcon;
  summary: string;
  learningGoal: string;
  subsystems: string[];
  signals: string[];
  technicalFacts: Array<{ label: string; value: string }>;
  safetyRisks: Array<{ risk: string; level: "bajo" | "medio" | "alto" }>;
  commonFailures: string[];
  maintenanceChecklist: string[];
  documentation: string[];
  hotspots: EquipmentHotspot[];
  practice: PracticeLink;
}

export const moduleLinks = {
  core:
    process.env.NEXT_PUBLIC_BIOMED_CORE_URL ??
    "https://biomedtools-mx-core.vercel.app",
  quiz:
    process.env.NEXT_PUBLIC_QUIZ_ARENA_URL ??
    "https://biomed-quiz-arena.vercel.app",
  case:
    process.env.NEXT_PUBLIC_CASE_SIMULATOR_URL ??
    "https://biomed-case-simulator.vercel.app",
  report:
    process.env.NEXT_PUBLIC_REPORT_BUILDER_URL ??
    "https://clinical-report-builder.vercel.app",
};

export const equipmentCatalog: EquipmentItem[] = [
  {
    id: "patient-monitor",
    name: "Monitor multiparametrico",
    shortName: "Monitor",
    category: "Monitoreo de signos vitales",
    status: "operativo",
    icon: Monitor,
    summary:
      "Integra ECG, SpO2, presion no invasiva, temperatura y alarmas para vigilancia continua.",
    learningGoal:
      "Relacionar sensores, senales, alarmas y verificacion tecnica inicial sin sustituir protocolos clinicos.",
    subsystems: [
      "Modulo ECG",
      "Oximetria SpO2",
      "NIBP",
      "Alarmas",
      "Fuente y bateria",
    ],
    signals: ["ECG", "SpO2", "NIBP", "Temperatura"],
    technicalFacts: [
      { label: "Uso tipico", value: "Hospitalizacion, urgencias y UCI" },
      { label: "Entrada critica", value: "Sensores y cables del paciente" },
      { label: "Salida", value: "Pantalla, alarmas, tendencias y red" },
      { label: "Revision inicial", value: "Sensor, cable, modulo, paciente simulado" },
    ],
    safetyRisks: [
      { risk: "Alarma silenciada sin seguimiento", level: "alto" },
      { risk: "Lectura falsa por sensor mal colocado", level: "medio" },
      { risk: "Cable deteriorado o contaminado", level: "medio" },
    ],
    commonFailures: [
      "SpO2 sin lectura por sensor desconectado o mal colocado.",
      "Ruido ECG por electrodos secos, cable danado o mala preparacion de piel.",
      "NIBP no infla por fuga, brazalete incorrecto o manguera doblada.",
      "Bateria con baja autonomia o cargador no conectado.",
    ],
    maintenanceChecklist: [
      "Inspeccion visual de cables, sensores y conectores.",
      "Prueba con simulador multiparametrico.",
      "Verificacion de alarmas audibles y visuales.",
      "Revision de bateria, fuente y etiqueta de mantenimiento.",
    ],
    documentation: [
      "Resultado de prueba con simulador.",
      "Accesorios revisados.",
      "Condicion de alarmas.",
      "Acciones correctivas y evidencia fotografica.",
    ],
    hotspots: [
      {
        id: "screen",
        label: "Pantalla y tendencias",
        subsystem: "Interfaz",
        description:
          "Presenta senales, valores numericos, tendencias y prioridad de alarmas.",
        position: [-1.05, 0.28, 0.72],
      },
      {
        id: "spo2",
        label: "Entrada SpO2",
        subsystem: "Oximetria",
        description:
          "La lectura depende de sensor, perfusion, movimiento y conexion al modulo.",
        position: [1.12, 0.08, 0.72],
      },
      {
        id: "ecg",
        label: "Modulo ECG",
        subsystem: "Biosenales",
        description:
          "Adquiere senales de baja amplitud; el ruido suele venir de electrodos, cableado o preparacion.",
        position: [0.04, -0.55, 0.78],
      },
      {
        id: "battery",
        label: "Fuente y bateria",
        subsystem: "Energia",
        description:
          "La autonomia y carga deben revisarse antes de uso en traslado o emergencia.",
        position: [0.92, -0.58, 0.18],
      },
    ],
    practice: {
      label: "Monitor sin lectura de SpO2",
      quizCategory: "Monitoreo de signos vitales",
      caseCategory: "monitor",
      reportType: "correctivo",
    },
  },
  {
    id: "infusion-pump",
    name: "Bomba de infusion volumetrica",
    shortName: "Bomba",
    category: "Bombas de infusion y terapia",
    status: "revision",
    icon: Syringe,
    summary:
      "Administra volumen programado mediante mecanismo de impulsion, sensores y alarmas de seguridad.",
    learningGoal:
      "Identificar flujo, presion, oclusion, puerta, bateria y criterios de prueba funcional.",
    subsystems: [
      "Mecanismo peristaltico",
      "Sensor de presion",
      "Detector de aire",
      "Puerta",
      "Bateria",
    ],
    signals: ["Presion de linea", "Tasa de flujo", "Volumen infundido"],
    technicalFacts: [
      { label: "Parametro clave", value: "mL/h y volumen total" },
      { label: "Alarma tipica", value: "Oclusion, aire en linea, puerta abierta" },
      { label: "Prueba sugerida", value: "Flujo, presion, bateria y alarmas" },
      { label: "Accesorio critico", value: "Equipo de venoclisis compatible" },
    ],
    safetyRisks: [
      { risk: "Oclusion no atendida o linea pinzada", level: "alto" },
      { risk: "Set incorrecto o mal instalado", level: "alto" },
      { risk: "Bateria insuficiente en traslado", level: "medio" },
    ],
    commonFailures: [
      "Alarma de oclusion por linea pinzada u obstruccion distal.",
      "Error de puerta por sensor o cierre incompleto.",
      "Desviacion de flujo por set incompatible o mecanismo desgastado.",
      "No retiene carga por bateria degradada.",
    ],
    maintenanceChecklist: [
      "Inspeccion de carcasa, puerta, teclado y display.",
      "Prueba de alarma de oclusion y aire en linea.",
      "Prueba de flujo con volumen medido.",
      "Revision de bateria y adaptador de corriente.",
    ],
    documentation: [
      "Modelo y numero de serie.",
      "Prueba de flujo realizada.",
      "Condicion de alarmas.",
      "Set usado durante verificacion.",
    ],
    hotspots: [
      {
        id: "display",
        label: "Display de parametros",
        subsystem: "Interfaz",
        description:
          "Muestra tasa, volumen, estado de bateria y mensajes de alarma.",
        position: [-1.1, 0.26, 0.7],
      },
      {
        id: "cassette",
        label: "Canal de infusion",
        subsystem: "Flujo",
        description:
          "La linea debe asentarse correctamente para evitar errores de flujo o puerta.",
        position: [0.18, -0.1, 0.84],
      },
      {
        id: "pressure",
        label: "Sensor de presion",
        subsystem: "Seguridad",
        description:
          "Detecta incremento de presion asociado a oclusion o resistencia distal.",
        position: [0.74, 0.12, 0.76],
      },
      {
        id: "battery",
        label: "Bateria",
        subsystem: "Energia",
        description:
          "Debe sostener operacion durante traslado segun especificacion del fabricante.",
        position: [-0.56, -0.65, 0.22],
      },
    ],
    practice: {
      label: "Alarma de oclusion",
      quizCategory: "Bombas de infusion y terapia",
      caseCategory: "bomba",
      reportType: "correctivo",
    },
  },
  {
    id: "defibrillator",
    name: "Desfibrilador monitor",
    shortName: "Desfibrilador",
    category: "Desfibrilador y urgencias",
    status: "alto riesgo",
    icon: HeartPulse,
    summary:
      "Equipo critico para emergencia que combina monitoreo, carga, descarga sincronizada y pruebas de energia.",
    learningGoal:
      "Reconocer energia, baterias, palas, electrodos, pruebas de descarga y restricciones de seguridad.",
    subsystems: [
      "Carga de energia",
      "Palas/electrodos",
      "ECG",
      "Bateria",
      "Impresora",
    ],
    signals: ["ECG", "Energia de descarga", "Impedancia"],
    technicalFacts: [
      { label: "Riesgo principal", value: "Alta energia en modo descarga" },
      { label: "Prueba clave", value: "Entrega de energia a analizador" },
      { label: "Modo", value: "Manual, sincronizado o DEA segun modelo" },
      { label: "Accesorios", value: "Palas, pads, cable ECG y bateria" },
    ],
    safetyRisks: [
      { risk: "Descarga accidental por mala manipulacion", level: "alto" },
      { risk: "Equipo sin bateria lista en emergencia", level: "alto" },
      { risk: "Pads vencidos o palas en mal estado", level: "medio" },
    ],
    commonFailures: [
      "No carga energia por bateria, capacitor o fuente.",
      "No reconoce palas o pads por conector danado.",
      "Sin trazo ECG por cable o modulo.",
      "Impresora sin papel o con mecanismo trabado.",
    ],
    maintenanceChecklist: [
      "Autotest y registro de resultado.",
      "Prueba de descarga con analizador certificado.",
      "Revision de bateria, pads y palas.",
      "Verificacion de sincronizacion si aplica.",
    ],
    documentation: [
      "Energia programada vs medida.",
      "Estado de bateria y accesorios.",
      "Resultado de autotest.",
      "Fecha de proxima verificacion.",
    ],
    hotspots: [
      {
        id: "energy",
        label: "Modulo de carga",
        subsystem: "Alta energia",
        description:
          "Almacena energia antes de la descarga; requiere prueba con analizador, no con paciente.",
        position: [-0.18, 0.4, 0.76],
      },
      {
        id: "paddles",
        label: "Palas / pads",
        subsystem: "Entrega",
        description:
          "La condicion de electrodos y conectores afecta impedancia y entrega de energia.",
        position: [1.14, -0.04, 0.54],
      },
      {
        id: "sync",
        label: "Sincronizacion",
        subsystem: "ECG",
        description:
          "Debe marcar onda R cuando el modo sincronizado esta activo.",
        position: [-0.92, 0.14, 0.76],
      },
      {
        id: "battery",
        label: "Bateria critica",
        subsystem: "Energia",
        description:
          "El equipo debe estar listo para emergencia; una bateria degradada es falla critica.",
        position: [0.8, -0.6, 0.12],
      },
    ],
    practice: {
      label: "Desfibrilador que no carga",
      quizCategory: "Desfibrilador y urgencias",
      caseCategory: "desfibrilador",
      reportType: "correctivo",
    },
  },
  {
    id: "ventilator",
    name: "Ventilador mecanico",
    shortName: "Ventilador",
    category: "Soporte respiratorio",
    status: "revision",
    icon: Wind,
    summary:
      "Controla flujo, presion, volumen y alarmas respiratorias con circuitos, sensores y suministro de gases.",
    learningGoal:
      "Distinguir componentes tecnicos, alarmas y verificacion con pulmon de prueba o analizador.",
    subsystems: [
      "Turbina/mezclador",
      "Valvulas",
      "Sensores de flujo",
      "Alarmas",
      "Circuito paciente",
    ],
    signals: ["Presion", "Flujo", "Volumen", "FiO2"],
    technicalFacts: [
      { label: "Prueba segura", value: "Pulmon de prueba o analizador" },
      { label: "Entradas", value: "Aire, oxigeno, energia y circuito" },
      { label: "Alarmas", value: "Alta presion, baja presion, fuga" },
      { label: "Riesgo", value: "Fuga, circuito mal armado o sensor obstruido" },
    ],
    safetyRisks: [
      { risk: "Circuito mal conectado o fuga significativa", level: "alto" },
      { risk: "Sensor de flujo contaminado u obstruido", level: "alto" },
      { risk: "Filtro saturado", level: "medio" },
    ],
    commonFailures: [
      "Alarma de alta presion por obstruccion o circuito doblado.",
      "Volumen bajo por fuga o mala conexion.",
      "Lectura erratica por sensor de flujo sucio.",
      "Error de suministro de gas o presion de red.",
    ],
    maintenanceChecklist: [
      "Inspeccion de circuito, filtros y valvulas.",
      "Prueba con pulmon de prueba.",
      "Verificacion de sensores de flujo y presion.",
      "Revision de bateria interna y alarmas.",
    ],
    documentation: [
      "Modo y parametros de prueba.",
      "Accesorios utilizados.",
      "Resultados de alarmas.",
      "Condicion de filtros/circuito.",
    ],
    hotspots: [
      {
        id: "flow",
        label: "Sensor de flujo",
        subsystem: "Medicion",
        description:
          "Convierte flujo respiratorio en senal para volumen, curvas y alarmas.",
        position: [0.82, 0.28, 0.72],
      },
      {
        id: "valves",
        label: "Valvulas",
        subsystem: "Control",
        description:
          "Regulan inspiracion y espiracion; fallas alteran presion y volumen.",
        position: [0.06, -0.18, 0.84],
      },
      {
        id: "oxygen",
        label: "Entrada de gases",
        subsystem: "Suministro",
        description:
          "Requiere presion adecuada y conexiones seguras para FiO2 estable.",
        position: [-1.04, -0.2, 0.46],
      },
      {
        id: "alarm",
        label: "Alarmas",
        subsystem: "Seguridad",
        description:
          "Las alarmas deben verificarse con escenarios controlados, no en paciente.",
        position: [-0.68, 0.5, 0.78],
      },
    ],
    practice: {
      label: "Alarma de baja presion",
      quizCategory: "Monitoreo de signos vitales",
      caseCategory: "ventilador",
      reportType: "preventivo",
    },
  },
  {
    id: "autoclave",
    name: "Autoclave hospitalario",
    shortName: "Autoclave",
    category: "Esterilizacion",
    status: "operativo",
    icon: Thermometer,
    summary:
      "Usa vapor, presion, temperatura y tiempo para esterilizacion controlada de material compatible.",
    learningGoal:
      "Relacionar ciclo, validacion, indicadores, sellos, drenaje y mantenimiento preventivo.",
    subsystems: [
      "Camara",
      "Generacion de vapor",
      "Drenaje",
      "Sensores",
      "Puerta y sello",
    ],
    signals: ["Temperatura", "Presion", "Tiempo", "Indicador biologico"],
    technicalFacts: [
      { label: "Variables criticas", value: "Tiempo, temperatura y presion" },
      { label: "Validacion", value: "Indicadores fisicos, quimicos y biologicos" },
      { label: "Riesgo", value: "Quemadura, presion residual, ciclo invalido" },
      { label: "Revision", value: "Sello, drenaje, filtros y sensores" },
    ],
    safetyRisks: [
      { risk: "Apertura con presion residual", level: "alto" },
      { risk: "Ciclo invalido no documentado", level: "alto" },
      { risk: "Sello deteriorado o fuga de vapor", level: "medio" },
    ],
    commonFailures: [
      "No alcanza temperatura por fuga o generador deficiente.",
      "Fuga en puerta por sello gastado.",
      "Drenaje obstruido o filtro saturado.",
      "Registro de ciclo incompleto.",
    ],
    maintenanceChecklist: [
      "Inspeccion de sello de puerta y bisagras.",
      "Revision de drenaje y filtros.",
      "Verificacion de temperatura/presion.",
      "Prueba de ciclo y registro.",
    ],
    documentation: [
      "Ciclo probado.",
      "Temperatura/presion alcanzada.",
      "Resultado de indicador.",
      "Acciones de limpieza y mantenimiento.",
    ],
    hotspots: [
      {
        id: "chamber",
        label: "Camara",
        subsystem: "Esterilizacion",
        description:
          "Debe distribuir vapor y temperatura sin obstrucciones por carga mal acomodada.",
        position: [0.08, 0.12, 0.84],
      },
      {
        id: "seal",
        label: "Sello de puerta",
        subsystem: "Contencion",
        description:
          "Un sello danado provoca fugas y ciclos incompletos.",
        position: [-0.86, 0.14, 0.72],
      },
      {
        id: "gauge",
        label: "Sensor / manometro",
        subsystem: "Medicion",
        description:
          "La lectura de presion y temperatura es evidencia del ciclo.",
        position: [0.88, 0.52, 0.58],
      },
      {
        id: "drain",
        label: "Drenaje",
        subsystem: "Vapor",
        description:
          "Obstrucciones afectan evacuacion de condensado y desempeno del ciclo.",
        position: [0.48, -0.56, 0.32],
      },
    ],
    practice: {
      label: "Autoclave no alcanza temperatura",
      quizCategory: "Esterilizacion y autoclave",
      caseCategory: "autoclave",
      reportType: "preventivo",
    },
  },
  {
    id: "neonatal-incubator",
    name: "Incubadora neonatal",
    shortName: "Incubadora",
    category: "Soporte neonatal",
    status: "revision",
    icon: Baby,
    summary:
      "Mantiene microambiente termico mediante control de temperatura, humedad, flujo de aire y alarmas.",
    learningGoal:
      "Identificar sensores, resistencia, ventilacion, alarmas y puntos de seguridad electrica.",
    subsystems: [
      "Control termico",
      "Sensores",
      "Humidificacion",
      "Ventilador",
      "Alarmas",
    ],
    signals: ["Temperatura aire", "Temperatura piel", "Humedad", "Alarmas"],
    technicalFacts: [
      { label: "Control", value: "Servo-control o aire segun modelo" },
      { label: "Medicion", value: "Sonda de piel y sensor de aire" },
      { label: "Riesgo", value: "Sobrecalentamiento o alarma inactiva" },
      { label: "Prueba", value: "Estabilidad termica y alarmas" },
    ],
    safetyRisks: [
      { risk: "Sonda desprendida o lectura incorrecta", level: "alto" },
      { risk: "Ventilador obstruido", level: "medio" },
      { risk: "Humedad sin limpieza adecuada", level: "medio" },
    ],
    commonFailures: [
      "Temperatura inestable por sensor, ventilador o resistencia.",
      "Alarma de sonda por cable danado.",
      "Ruido excesivo por ventilador.",
      "Humidificador con residuos o fuga.",
    ],
    maintenanceChecklist: [
      "Limpieza segun protocolo institucional.",
      "Verificacion de sensores de temperatura.",
      "Prueba de alarmas de temperatura.",
      "Revision de ventilador, puertas y seguros.",
    ],
    documentation: [
      "Temperatura programada vs medida.",
      "Alarmas probadas.",
      "Condicion de sonda y sensores.",
      "Limpieza y accesorios revisados.",
    ],
    hotspots: [
      {
        id: "canopy",
        label: "Cupula",
        subsystem: "Microambiente",
        description:
          "Ayuda a mantener temperatura y humedad; puertas y sellos impactan estabilidad.",
        position: [0.02, 0.5, 0.68],
      },
      {
        id: "probe",
        label: "Sonda de piel",
        subsystem: "Medicion",
        description:
          "Debe estar integra y conectada; una lectura falsa altera el control.",
        position: [-0.94, -0.06, 0.78],
      },
      {
        id: "heater",
        label: "Resistencia",
        subsystem: "Control termico",
        description:
          "Se evalua por estabilidad, seguridad y respuesta a cambios programados.",
        position: [0.72, -0.42, 0.46],
      },
      {
        id: "alarm",
        label: "Alarmas",
        subsystem: "Seguridad",
        description:
          "Temperatura alta/baja y falla de sonda deben verificarse periodicamente.",
        position: [0.92, 0.12, 0.72],
      },
    ],
    practice: {
      label: "Temperatura inestable",
      quizCategory: "Seguridad electrica hospitalaria",
      caseCategory: "incubadora",
      reportType: "preventivo",
    },
  },
  {
    id: "electrosurgery",
    name: "Unidad de electrocirugia",
    shortName: "Electrobisturi",
    category: "Instrumental quirurgico",
    status: "alto riesgo",
    icon: Flame,
    summary:
      "Genera energia de radiofrecuencia para corte y coagulacion con retorno seguro por placa paciente.",
    learningGoal:
      "Entender potencia, modo, placa de retorno, accesorios activos y riesgos de quemadura.",
    subsystems: [
      "Generador RF",
      "Placa de retorno",
      "Accesorio activo",
      "Pedal",
      "Alarmas REM",
    ],
    signals: ["Potencia RF", "Impedancia", "Estado REM"],
    technicalFacts: [
      { label: "Energia", value: "Radiofrecuencia para corte/coagulacion" },
      { label: "Seguridad", value: "Monitoreo de placa de retorno si aplica" },
      { label: "Prueba", value: "Analizador ESU con carga adecuada" },
      { label: "Riesgo", value: "Quemadura por mala placa o accesorio danado" },
    ],
    safetyRisks: [
      { risk: "Placa de retorno mal adherida", level: "alto" },
      { risk: "Cable activo con aislamiento danado", level: "alto" },
      { risk: "Potencia no verificada", level: "medio" },
    ],
    commonFailures: [
      "Alarma REM por placa o cable de retorno.",
      "No activa con pedal por conector danado.",
      "Salida fuera de tolerancia en corte/coagulacion.",
      "Accesorio activo con aislamiento deteriorado.",
    ],
    maintenanceChecklist: [
      "Inspeccion de cables y accesorios.",
      "Prueba de salida con analizador ESU.",
      "Verificacion de alarma de placa.",
      "Revision de pedal y conectores.",
    ],
    documentation: [
      "Modo y potencia probada.",
      "Carga usada en analizador.",
      "Estado de cables/accesorios.",
      "Resultado de alarma REM.",
    ],
    hotspots: [
      {
        id: "rf",
        label: "Generador RF",
        subsystem: "Energia",
        description:
          "Produce salida de corte/coagulacion; se verifica con analizador especializado.",
        position: [-0.16, 0.28, 0.82],
      },
      {
        id: "return",
        label: "Placa de retorno",
        subsystem: "Seguridad",
        description:
          "El retorno deficiente puede concentrar energia y provocar quemaduras.",
        position: [1.04, -0.2, 0.54],
      },
      {
        id: "active",
        label: "Accesorio activo",
        subsystem: "Salida",
        description:
          "El aislamiento y conexion deben estar integros antes de uso.",
        position: [-1.02, -0.36, 0.55],
      },
      {
        id: "pedal",
        label: "Pedal",
        subsystem: "Control",
        description:
          "Activa modos segun configuracion; fallas de pedal pueden impedir salida.",
        position: [0.62, -0.66, 0.18],
      },
    ],
    practice: {
      label: "Alarma de placa de retorno",
      quizCategory: "Seguridad electrica hospitalaria",
      caseCategory: "electrocirugia",
      reportType: "preventivo",
    },
  },
];

export const categoryIcons: Record<string, LucideIcon> = {
  "Monitoreo de signos vitales": Activity,
  "Bombas de infusion y terapia": Droplets,
  "Desfibrilador y urgencias": Bolt,
  "Soporte respiratorio": Wind,
  Esterilizacion: ShieldCheck,
  "Soporte neonatal": Baby,
  "Instrumental quirurgico": Radio,
};

export const labMetrics = [
  { label: "Equipos modelados", value: equipmentCatalog.length.toString(), icon: Stethoscope },
  { label: "Hotspots tecnicos", value: "28", icon: Gauge },
  { label: "Pruebas guiadas", value: "7", icon: ClipboardCheck },
  { label: "Checklist local", value: "Offline", icon: Wrench },
];

export const workflowSteps = [
  {
    title: "Explorar",
    text: "Selecciona un equipo y revisa sus subsistemas en el visor 3D.",
  },
  {
    title: "Diagnosticar",
    text: "Usa fallas comunes, riesgos y senales para construir hipotesis tecnicas.",
  },
  {
    title: "Documentar",
    text: "Registra evidencia y envia el flujo a Report Builder cuando aplique.",
  },
];

export const externalReferenceResources = [
  {
    title: "NIH 3D",
    label: "Modelos 3D",
    href: "https://3d.nih.gov/",
    text: "Portal abierto para modelos bioscientificos y medicos que pueden servir como referencia o reemplazo de GLB cuando la licencia del modelo lo permita.",
  },
  {
    title: "NIH BioArt Source",
    label: "Ilustracion biomedica",
    href: "https://bioart.niaid.nih.gov/",
    text: "Biblioteca profesional de ilustraciones biomedicas para mejorar diagramas, paneles educativos y materiales docentes.",
  },
  {
    title: "Health Icons",
    label: "Iconografia",
    href: "https://healthicons.org/",
    text: "Iconos abiertos de salud para interfaces educativas, tarjetas de equipos y senalizacion de funciones.",
  },
  {
    title: "FDA Medical Device Databases",
    label: "Consulta tecnica",
    href: "https://www.fda.gov/medical-devices/device-advice-comprehensive-regulatory-assistance/medical-device-databases",
    text: "Bases publicas para consulta formativa de clases de dispositivos, codigos, 510(k), PMA y contexto regulatorio.",
  },
] as const;

export function buildQuizUrl(item: EquipmentItem) {
  return `${moduleLinks.quiz}?category=${encodeURIComponent(item.practice.quizCategory)}`;
}

export function buildCaseUrl(item: EquipmentItem) {
  return `${moduleLinks.case}?category=${encodeURIComponent(item.practice.caseCategory)}`;
}

export function buildReportUrl(item: EquipmentItem) {
  const params = new URLSearchParams({
    activity: "biomed-3d-lab",
    equipment: item.name,
    reportType: item.practice.reportType,
  });

  return `${moduleLinks.report}?${params.toString()}`;
}
