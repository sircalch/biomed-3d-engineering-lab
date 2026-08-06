# BioMed 3D Engineering Lab

Laboratorio web interactivo para estudiar equipos medicos desde una perspectiva de Ingenieria Biomedica: subsistemas, senales, riesgos, fallas, mantenimiento y evidencia tecnica.

Forma parte del ecosistema BioMedTools MX Core y complementa:

- BioMed Quiz Arena
- BioMed Case Simulator
- Clinical Report Builder

## Objetivo

Convertir el aprendizaje de equipos medicos en una experiencia visual y practica:

1. Explorar un equipo en 3D.
2. Revisar hotspots tecnicos por subsistema.
3. Activar capas, corte y comparacion.
4. Relacionar senales con fallas comunes.
5. Registrar notas locales.
6. Enviar la actividad a Quiz, Caso o Reporte.

## Modulos incluidos

- Monitor multiparametrico
- Bomba de infusion volumetrica
- Desfibrilador monitor
- Ventilador mecanico
- Autoclave hospitalario
- Incubadora neonatal
- Unidad de electrocirugia

Cada equipo incluye:

- Resumen tecnico
- Objetivo de aprendizaje
- Subsistemas
- Senales relacionadas
- Hotspots 3D
- Riesgos
- Fallas comunes
- Checklist de mantenimiento
- Documentacion esperada
- Practica relacionada

## Integracion BioMedTools

Las ligas se configuran con variables publicas:

```env
NEXT_PUBLIC_BIOMED_CORE_URL=https://biomedtools-mx-core.vercel.app
NEXT_PUBLIC_QUIZ_ARENA_URL=https://biomed-quiz-arena.vercel.app
NEXT_PUBLIC_CASE_SIMULATOR_URL=https://biomed-case-simulator.vercel.app
NEXT_PUBLIC_REPORT_BUILDER_URL=https://clinical-report-builder.vercel.app
```

Flujo recomendado:

```text
BioMed 3D Lab -> Quiz Arena -> Case Simulator -> Report Builder
```

## Desarrollo local

```bash
npm install
npm run dev
```

Abre:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Deploy en Vercel

1. Crea un proyecto en Vercel desde este repositorio.
2. Agrega las variables de entorno si deseas cambiar las URLs por defecto.
3. Ejecuta deploy.

Comando opcional:

```bash
npx vercel --prod
```

## Uso educativo

Este proyecto es educativo. No sustituye protocolos clinicos, normativas institucionales, supervision profesional ni mantenimiento biomedico certificado.
