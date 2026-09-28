# Jarvis · asistente personal

Asistente de agenda por voz y texto que funciona **entero dentro del iPhone**. No tiene servidor, cuentas ni claves de API, y cuesta 0 €.

## Qué hace

- **Entiende frases normales**, por ejemplo:
  - «el jueves a las cinco tengo que ir al banco»
  - «pásame lo del martes al miércoles»
  - «¿qué tengo esta semana?»
  - «organízame el viernes»
- **Turnos de trabajo:**
  - por voz o texto: «trabajo el lunes de 16 a 24», «libro el martes»;
  - en Semana › Turnos, en una tabla;
  - admite turnos partidos y turnos que cruzan la medianoche.
- **Conflictos:** nunca crea solapamientos en silencio. Te avisa y te propone el hueco libre más cercano a la hora que pediste.
- **Confirmación obligatoria:** mover, borrar y reprogramar siempre piden un «sí». Si no confirmas, la propuesta caduca a los 10 minutos.
- **«Encájalo tú»:** busca huecos respetando turnos, horas de sueño, tus preferencias y un margen de desplazamiento.
- **Memoria:** recuerda lo que le cuentas, como «no me pongas nada antes de las 9» o «los lunes tengo clase de 18 a 20». Lo ves y lo editas en Ajustes › Memoria.
- **Proactividad:**
  - briefing al abrir la app por primera vez cada día;
  - aviso de la víspera y resumen semanal;
  - recordatorios antes de cada evento;
  - no molesta en horas de silencio ni durante un turno.
- **IA en el iPhone (opcional):** un modelo Qwen 2.5 que se descarga una vez y funciona sin internet.
  - Solo interpreta las frases que el intérprete propio no entiende y permite conversar.
  - Las fechas, los conflictos y los cambios en la agenda los calcula siempre el código.

## Instalarla en el iPhone

1. Abre en Safari la dirección de la app (con GitHub Pages activado: `https://kaeldafae.github.io/aula/jarvis/`).
2. Pulsa **Compartir** › **Añadir a pantalla de inicio**.
3. Ábrela desde el icono y pulsa **Empezar**.
4. En **Ajustes › Avisos**, pulsa **Activar avisos**.
5. Si quieres la IA: **Ajustes › IA en el iPhone › Activar IA**. Hazlo con wifi la primera vez.

## Límites que conviene conocer

| Tema | Qué pasa | Qué hacer |
|---|---|---|
| Avisos con la app cerrada | Sin servidor, iOS no deja que una web mande avisos si está cerrada del todo | Semana › **Pasar al Calendario**: el Calendario del iPhone te avisa aunque Jarvis esté cerrada |
| Dictado | El botón de hablar usa el reconocimiento de Safari. En la app instalada puede no estar disponible | Usa el micrófono del teclado: funciona siempre |
| IA local | Necesita WebGPU en Safari (iOS 26 o posterior) y memoria suficiente | Si el modelo «Normal» no cabe, la app pasa sola al «Ligero». Si tampoco cabe, sigue con el intérprete propio |
| Datos | Solo existen en ese iPhone | Ajustes › **Exportar copia** de vez en cuando |
| Foto del cuadrante | Leer fotos sin servicios externos no es fiable | Mete los turnos en Semana › Turnos. Son 7 filas |

## Privacidad

Nada sale del teléfono. Lo único que se descarga de fuera es:
- la librería WebLLM, versión fijada 0.2.85, desde jsDelivr;
- el modelo de IA, desde Hugging Face, solo si la activas.

Al ser de uso personal, el RGPD no se aplica: art. 2.2.c del Reglamento (UE) 2016/679, la llamada "exención doméstica".

## Para quien mantenga el código

- **Sin compilación:** módulos JavaScript tal cual, con tipos comprobados por TypeScript (`checkJs` estricto).
- **Comprobaciones:** `npm ci && npm run check`, que ejecuta lint, tipos y tests. El CI las repite en cada cambio de `jarvis/`.
- **Publicar una versión nueva:** sube `version` en `package.json` y `VERSION` en `sw.js`. Un test impide que se desincronicen. Así el iPhone muestra «Nueva versión disponible» en vez de servir la antigua.
- **Cambiar la personalidad:** `src/persona.js`.
- **Cambiar los modelos de IA:** `MODELS` en `src/ai.js`. Deben existir en el catálogo de la versión fijada de WebLLM.
- **Estructura:**
  - `src/time.js`: fechas en Europe/Madrid, incluidos los cambios de hora;
  - `src/nlu.js`: intérprete de frases;
  - `src/agenda.js`: huecos y conflictos;
  - `src/assistant.js`: diálogo y confirmaciones;
  - `src/app.js`: interfaz.
