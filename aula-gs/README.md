# 🎓 Aula 2.0 · Mi Grado Superior

Tu academia personal de bolsillo: **7 lecciones**, 84 fichas con repaso espaciado **SM-2** (el algoritmo de Anki), 40 ejercicios interactivos de 4 tipos, 3 casos prácticos con decisiones, 66 preguntas de examen con explicación, examen global cronometrado, XP, niveles, 16 logros, racha, estadísticas, glosario, plan de 30 días, audio de lecciones, modo oscuro y copia de seguridad. Funciona **sin conexión**.

## 🚀 Publicarla en GitHub Pages (5 minutos)

1. Entra en [github.com](https://github.com) e inicia sesión (o crea cuenta gratis).
2. Pulsa **+** → **New repository** → nombre `aula` → **Public** → **Create repository**.
3. Pulsa **uploading an existing file** y arrastra **TODOS los archivos de esta carpeta** (incluida la carpeta `icons`). **Commit changes**.
4. **Settings → Pages** → Source: **Deploy from a branch** → Branch **main** / **/ (root)** → **Save**.
5. En 1-2 minutos tu app estará en `https://TU-USUARIO.github.io/aula/`

## 📱 Instalarla en el iPhone

Abre la URL en **Safari** → botón **Compartir** → **Añadir a pantalla de inicio**. Listo: icono propio y funcionamiento offline.

## 🔄 Actualizar la app (cuando Claude te dé contenido nuevo)

1. En GitHub, sustituye los archivos que te indique (normalmente `data.js`, a veces todos).
2. Abre `sw.js` y sube la versión: `aula-v2` → `aula-v3` (esto fuerza al móvil a descargar lo nuevo).
3. En el iPhone, cierra y reabre la app (a veces dos veces).

> ⚠️ Si vienes de la versión 1: sube TODOS los archivos nuevos reemplazando los antiguos. Tu progreso se migra automáticamente.

## 📂 Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Estructura de la app |
| `styles.css` | Diseño (claro + oscuro) |
| `app.js` | Motor: SM-2, XP, logros, ejercicios, casos, exámenes, estadísticas |
| `data.js` | **El contenido del curso** (lo que iremos ampliando) |
| `manifest.json` / `sw.js` | PWA y modo offline |
| `icons/` | Iconos |

## 💾 Tu progreso

Se guarda en el móvil. En **Perfil → Exportar copia de seguridad** puedes descargar un archivo `.json` y restaurarlo cuando quieras (hazlo una vez por semana).
