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

## Modelos 3D profesionales

La app carga automaticamente un archivo GLB si existe en:

```text
public/models/{equipment-id}.glb
```

Ids soportados:

```text
patient-monitor.glb
infusion-pump.glb
defibrillator.glb
ventilator.glb
autoclave.glb
neonatal-incubator.glb
electrosurgery.glb
```

Si no existe el GLB, la app usa un modelo procedural de respaldo en Three.js.

### Generar modelos con Blender

Instala Blender y asegúrate de que el comando `blender` exista en PATH. Luego ejecuta:

```bash
npm run assets:blender
```

Esto corre:

```bash
blender --background --python tools/blender/create-biomed-models.py
```

Y exporta los GLB a `public/models`.

### Usar Tripo AI u otra API

Tambien puedes generar modelos externos con Tripo, Fal, Meshy, Spline o Sketchfab, siempre que tengas licencia de uso compatible. Exporta cada equipo como GLB y guárdalo con el nombre esperado en `public/models`.

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
