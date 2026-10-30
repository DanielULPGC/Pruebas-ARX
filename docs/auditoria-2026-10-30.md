# Auditoría técnica · «Las manos que construyeron la historia» · v3.12.2 → v3.12.3

**Fecha:** 30-10-2026 · **Repositorio:** `DanielULPGC/Pruebas-ARX` · **Versión auditada:** commit `4d40206` (v3.12.2) · **Correcciones:** v3.12.3

## 1. Alcance y método

Se auditaron la integridad del paquete, la seguridad y la privacidad del código, el funcionamiento de las ocho páginas (cinco capítulos con 25 etapas, bienvenida, área del profesorado y laboratorio de maquetas), el modo de realidad mixta y la accesibilidad.

| Área | Procedimiento |
|---|---|
| Integridad | `sha256sum -c MANIFIESTO.txt`; recálculo de las huellas SRI de los *importmaps*; comprobación de que las páginas encuentran todo lo que importan de `lib/motor.js`. |
| Seguridad y privacidad | Revisión del código: patrones de riesgo (`eval`, `new Function`, `document.write`), usos de `innerHTML` y origen de sus datos, escape de los textos del alumnado, exportación CSV, almacenamiento local, cifrado del área del profesorado y peticiones de red. |
| Funcionamiento | Recorrido automático de las 25 etapas en Chromium sin interfaz (modo táctil, `?docente`), comparado campo a campo con la v3.11.4 publicada. |
| Realidad mixta | Visor emulado Meta Quest 3 (IWER 2.7.0): entrada y salida de la sesión en los cinco capítulos, cambio de etapa y arrastre real del pilar en «Nivelar el canal». |
| Accesibilidad | axe-core 4.14 (WCAG 2.0, 2.1 y 2.2, niveles A y AA) en 30 estados: portadas, inicio, etapas, contexto, «Saber más», móvil, área del profesorado y laboratorio. |
| HTML | html-validate 11.17 (perfil `document`). |

## 2. Resultados

### 2.1. Sin incidencias

- **Integridad.** Los 27 archivos del manifiesto coinciden con sus huellas. Las huellas SRI de `three.module.js` y `vision_bundle.mjs` son correctas en todas las páginas. Las importaciones del motor son coherentes (101 nombres exportados).
- **Peticiones externas.** No hay ninguna. La única URL externa es un enlace bibliográfico (DOI) en la bienvenida, que no se carga automáticamente. El modelo remoto sigue desactivado (`PERMITIR_MODELO_REMOTO = false`).
- **Código de riesgo.** No hay `eval`, `new Function` ni `document.write`. Todos los `innerHTML` reciben contenido propio y fijo. Los textos que escribe el alumnado (nombre o código y comentario) se escapan antes de insertarse y en el pasaporte descargado.
- **Área del profesorado.** Usa AES-256-GCM con clave derivada por PBKDF2-SHA-256 con 600 000 iteraciones, sal de 16 bytes y vector de inicialización de 12 bytes, mediante Web Crypto.
- **Funcionamiento.** Las 25 etapas cargan sin errores y sin peticiones externas. De los 200 campos comparados con la v3.11.4 (títulos, métricas, mensajes, controles, contextos y «Saber más»), los que difieren solo cambian por los valores aleatorios de partida: el orden de las respuestas, la orientación inicial del dolmen y los giros iniciales de las piezas de la Alhambra.
- **Realidad mixta.** La sesión se abre y se cierra en los cinco capítulos sin errores. Al arrastrar el pilar con el mando su altura pasa de 2,00 m a 2,45 m, y al salir la escena vuelve a la pantalla.
- **HTML.** El único aviso es la regla opcional `require-sri` sobre `<link rel="stylesheet">` en una hoja propia del mismo origen; no es un error de validez.

### 2.2. Hallazgos corregidos en la v3.12.3

| N.º | Severidad | Hallazgo | Corrección |
|---|---|---|---|
| H1 | Media | **Inyección de fórmulas en la exportación CSV** (CWE-1236). Un nombre o comentario que empiece por `=`, `+`, `-` o `@` se ejecuta como fórmula al abrir el CSV en una hoja de cálculo; las comillas no lo impiden. Viene de la v3.10. | Esos campos se exportan precedidos de un apóstrofo, siguiendo la recomendación de OWASP. Comprobado con `=HYPERLINK(...)`, `+1`, `-2` y `@SUM(...)`. |
| H2 | Media | **Nombre accesible de los botones de etapa (WCAG 2.5.3, «Etiqueta en el nombre»).** El botón muestra «1 Terreno», pero su nombre accesible era «Etapa 1: Leer el terreno…», así que el control por voz no lo encuentra por lo que se ve. Viene de versiones anteriores a la v3.12. | El nombre accesible empieza ahora por el texto visible: «1 Terreno. Etapa 1: Leer el terreno…». axe ya no lo marca. |
| H3 | Media | **Sin texto en las gafas.** Según lo que se informa en los foros de desarrolladores de Meta (sin confirmación oficial), el navegador de Quest no concede la superposición de la página (*dom-overlay*). En ese caso el alumno no ve el enunciado, los mensajes, las pistas, las métricas ni el contexto histórico, y no puede pulsar «¡Manos a la obra!». | Cuando el visor no concede la superposición, aparece sobre la maqueta un panel 3D con la etapa, el mensaje, la pista y las métricas. Si hay abierto un panel de la página (contexto, «Saber más»…), se muestra su texto y una pinza lo cierra. En los móviles, donde sí se concede, nada cambia. Probado con el visor emulado. |

### 2.3. Recomendaciones pendientes, sin corregir

| N.º | Severidad | Hallazgo | Recomendación |
|---|---|---|---|
| R1 | Baja | No hay política de seguridad de contenidos (CSP). GitHub Pages no permite enviar cabeceras propias. | Valorar una CSP en `<meta>` (`default-src 'self'`, con los *hashes* de los guiones en línea). Exige recalcularlos en cada cambio, por lo que no se aplica sin decisión expresa. |
| R2 | Baja | `lib/motor.js`, `lib/xr-adapter.js` y `lib/estilos.css` no tienen huella SRI; solo los cubre el manifiesto. | Añadirla si se publica fuera de GitHub Pages o en un servidor compartido. |
| R3 | Informativa | La seguridad del área del profesorado depende de la contraseña: el texto cifrado es público y admite ataques sin conexión. | Usar una frase de paso larga (cuatro o más palabras) y no reutilizarla. |
| R4 | Informativa | three.js es la r160 (finales de 2023). En el *bundle* de MediaPipe no consta la versión. | No se han comprobado vulnerabilidades publicadas; revisar ambas bibliotecas antes del curso siguiente. |
| R5 | Informativa | La interacción en realidad mixta solo se ha verificado de extremo a extremo en una de las 25 etapas, y siempre con emulación. | Prueba en el aula con gafas reales y con un móvil Android: legibilidad del panel, precisión de la pinza y comodidad (sesiones cortas). |

## 3. Limitaciones de esta auditoría

- No se ha revisado el contenido histórico, curricular ni matemático de las 25 etapas: la auditoría es técnica.
- La accesibilidad automática detecta solo una parte de los problemas posibles. No sustituye una prueba con lector de pantalla, solo teclado y control por voz.
- La prueba en Chromium sin interfaz usa renderizado por software. No mide el rendimiento en las tabletas del centro.
- El uso de la cámara con menores, el pasaporte y la descarga de datos deben valorarse con el delegado o la delegada de protección de datos del centro, como ya indica el LEEME.
