# Las manos que construyeron la historia · v3.12 (edición para GitHub Pages)

Proyecto «Las manos que construyeron la historia». Geometría, patrimonio histórico y realidad aumentada en Educación Primaria (5.º y 6.º).

## Marco del proyecto

La página se abre con la portada del proyecto «Las manos que construyeron la historia», que incluye una línea del tiempo. El recorrido va **desde la Prehistoria en adelante**: Prehistoria, Edad Antigua, Edad Media, Edad Moderna y Edad Contemporánea. Los cinco capítulos están disponibles:

| Edad | Capítulo | Archivo |
|---|---|---|
| Prehistoria | **Las primeras manos** | `prehistoria.html` |
| Edad Antigua | **Misión Roma · El acueducto** | `index.html` (abre la portada; `index.html#roma` abre el capítulo directamente) |
| Edad Media | **El compás y la piedra** | `edad-media.html` |
| Edad Moderna | **Nuevos horizontes** | `edad-moderna.html` |
| Edad Contemporánea | **Hierro, luz y viento** | `edad-contemporanea.html` |

Al terminar cada capítulo, un botón lleva al siguiente, en orden cronológico, hasta la Edad Contemporánea.

**Navegación:**
- «← Línea del tiempo» vuelve a la portada y apaga la cámara.
- «← Etapa anterior» y «Siguiente etapa →» mueven entre etapas.
- El botón «atrás» del navegador o de la tableta recorre el mismo camino a la inversa.

## Bienvenida y pasaporte del aprendiz (`bienvenida.html`, v3.9)

Es la **pantalla de inicio del sitio**: quien abre `https://danielulpgc.github.io/Mision-Roma/` llega a la bienvenida.

| Para abrir… | Dirección |
|---|---|
| La bienvenida (inicio) | `…/Mision-Roma/` o `…/bienvenida.html` |
| La línea del tiempo | `…/index.html#linea` (botón «Ver la línea del tiempo» de la bienvenida) |
| Misión Roma directamente | `…/index.html#roma` |
| Modo docente, sin pasar por la bienvenida | `…/?docente` |

Los botones «← Línea del tiempo» de los capítulos llevan a la línea del tiempo, no a la bienvenida. Al recargar la línea del tiempo se sigue en ella.

- **La mano en la pared.** La página abre con la pared de una cueva. El alumnado mantiene pulsado (o usa el botón del teclado) y sopla pigmento alrededor de una mano dibujada; al retirarla queda la mano en negativo. Un texto breve la relaciona con la mano de El Castillo (Cantabria), de al menos 37 300 años (Pike et al., 2012, https://doi.org/10.1126/science.1219957). La mano es un dibujo, no la de quien juega: no se usa la cámara.
- **El pasaporte.** Tiene una tapa con la mano que se ha dejado en la cueva y una página por capítulo, en orden cronológico. Cada página muestra qué se hará con las manos, cuántas etapas están hechas (lee el progreso que guarda cada capítulo) y un enlace para entrar o seguir.
- **Ideas previas.** Antes de entrar, cada página plantea una pregunta sencilla con tres opciones, sin nota. Al completar el capítulo, se estampa el sello y aparece «Antes pensabas…» junto con la respuesta comprobada. Sirve para iniciar la sesión en el aula activando conocimientos previos.
- **Sellos.** Son dibujos originales (pintadera, arcos, rosetón, carabela y faro). La primera vez que se ve un sello nuevo, se estampa con una animación, que no aparece si el sistema pide reducir el movimiento.
- **Privacidad.** Solo se guardan en el navegador la miniatura de la mano dibujada, las ideas elegidas y los sellos ya vistos. Sin nombres ni datos personales. El botón «Borrar mi pasaporte» los elimina y conserva el progreso de los capítulos.

## Novedades de la v3.10 (revisión de la usuaria del 26-10-2026)

**Con la cámara, la pinza también pulsa botones.** Al acercar la pinza a un botón, un enlace, una casilla o un deslizador, este se marca en verde; al juntar los dedos se pulsa (o se arrastra el deslizador). La mano dibujada se ve ahora por encima de los paneles, para poder apuntar.

**Bienvenida y pasaporte:**
- **Mano real con la cámara** (botón «Usar mi mano real»). Con una mano abierta y quieta, el pigmento se sopla solo alrededor de su silueta real. Con dos manos, una queda abierta en la pared y la otra hace pinza y sopla donde está, como un tubo soplador. La imagen se procesa en el dispositivo y no se graba ni se envía.
- **Nombre o código** en la tapa del pasaporte, para el seguimiento docente. Se recomienda un código.
- **Registro por etapa** en los cinco capítulos: tiempo de trabajo (solo cuenta con la etapa a la vista y sin terminar), intentos fallidos y pistas usadas.
- **Valoración por edad:** al completar cada capítulo, el alumnado indica si los retos le han parecido fáciles, justos o difíciles, cuánto le han gustado y, si quiere, un comentario.
- **Descargas:** «Descargar mi pasaporte» genera un archivo HTML imprimible (con los datos también en formato JSON dentro del archivo); «Descargar los datos (CSV)» genera una tabla para hoja de cálculo. El alumnado los entrega por la vía que indique el docente. No hay servidor: nada se envía automáticamente.
- **Empezar de cero** (con doble pulsación de confirmación) borra el pasaporte y el progreso de los cinco capítulos en ese navegador, para repetir la experiencia o dejar la tableta lista para otra persona.

**Contexto histórico de cada reto (Prehistoria).** Al entrar por primera vez en cada etapa se abre un panel «Contexto» con la época, la situación histórica y el reto, y puede volver a abrirse con el botón «Contexto». El motor lo admite en los cinco capítulos; de momento solo lo tienen las etapas de la Prehistoria.

**Prehistoria:**
- **Tallar.** Primero se elige la piedra entre cuatro: nódulo de sílex, canto pequeño, sílex con grietas y arenisca, con la explicación de por qué solo sirve el primero. Los golpes ya no se pasan de la línea, de modo que la forma y la simetría llegan exactamente al 100 %, y solo entonces se completa la talla. Al final, el alumnado traza el eje de simetría con la pinza (o elige entre vertical, horizontal e inclinado).
- **Pintar.** La mano mide ahora exactamente 4 cuadros (20 cm) desde la línea de la muñeca. La pregunta aclara que se mide la longitud, no la superficie, y se señalan la muñeca y la punta del dedo corazón. Se añaden dos preguntas de tercer ciclo: la superficie que tapa la mano (contando cuadros de 25 cm²) y la pared que queda libre (un panel de 44 × 32 cm menos la mano; la pared representa ahora 44 × 32 cm para que la mano se vea grande). Al final se comenta cuántas manos cabrían sin huecos y por qué en realidad caben menos.
- **Modelar.** Tras decorar la vasija, se mide su capacidad con jarras de 2 L, 1 L y 0,5 L: se vierte (o se saca, con el cartel «verter/sacar») hasta llenarla justo hasta el borde. La vasija se ve transparente para seguir el nivel del agua. Después se elige su capacidad aproximada.
- **Orientar.** El corredor empieza cada vez en una posición distinta (marcada con una línea discontinua). Tras orientarlo al este, el alumnado indica cuántos grados lo ha girado, por el camino más corto, y qué tipo de ángulo forma (agudo, recto, obtuso o llano). Un sector azul muestra el giro.
- **Canarias.** El menú de forma, técnica, orden y esquemas se muestra siempre, también con la cámara. «Borrar» deja la pintadera y el papel como al principio, y hay además «Limpiar solo el papel».

## Novedades de la v3.12 (30-10-2026)

**Motor común en módulos.** El código que se repetía en los cinco capítulos (utilidades, motor gráfico, decorados, materiales, ayudas de juego, sonido, encuadre y etiquetas) está ahora en `lib/motor.js`, y los estilos comunes en `lib/estilos.css`. Cada capítulo conserva **sin cambios** sus cinco etapas, su gestor, sus textos y sus paneles. Se eliminan unas 4 200 líneas duplicadas: un arreglo del motor se hace ahora en un solo sitio. La extracción se hizo de forma automática y verificable (`docs/registro-decisiones.md`): las 6 724 cadenas de texto de la v3.11.4 siguen presentes, el HTML fuera del código es idéntico y el recorrido de las 25 etapas en el navegador da los mismos textos, métricas y paneles que antes.

**Modo opcional «Construir en realidad mixta (maqueta 3D)».** En gafas o móviles que admiten WebXR inmersivo aparece un botón más en la pantalla de inicio de cada capítulo. La etapa se muestra como una maqueta de 55 cm de ancho a unos 65 cm, delante del alumno; se manipula apuntando con la mano (pinza del sistema) o con el mando, y los puntos que se pueden mover se señalan con esferas. Funciona con las 25 etapas sin reescribirlas. En ordenadores y en la mayoría de tabletas el botón no aparece y todo funciona como antes. Este modo no usa la cámara de MediaPipe: el seguimiento lo hace el propio visor. Se ha probado con un visor emulado (Meta Quest 3, IWER); falta probarlo con gafas reales en el aula.

**No se incorpora XR Blocks.** Se valoró la biblioteca XR Blocks de Google y se descartó por ahora: está orientada a Chrome con Android XR, su forma documentada de carga es un CDN, fija su propia versión de three.js, no consta que pueda trabajar sobre el motor existente y sus funciones de IA envían datos a servidores externos. El modo de realidad mixta usa solo WebXR, la interfaz estándar del navegador.

## Novedades de la v3.11.2 (29-10-2026)

**Mano de la bienvenida.** La mano que se deja en la pared tiene ahora una silueta anatómica, la misma para el ratón, el teclado y la cámara. Se construye a partir de los 21 puntos del modelo de manos: los dedos se estrechan hacia la punta y se abren en abanico, hay membranas entre los dedos, el pulgar nace de la base de la palma y la muñeca se prolonga en un antebrazo que se desvanece, como en las manos en negativo de las cuevas. Cada huella varía un poco en la apertura de los dedos, el pulgar y la longitud de los dedos. Desde la v3.11.3, mientras se sopla, la mano apoyada muestra el dorso con volumen, nudillos, pliegues y uñas; al retirarla, el pigmento queda algo más denso junto al borde, como en las manos reales. Desde la v3.11.4, la pared se dibuja a la resolución real de la pantalla (hasta el doble en tabletas y pantallas Retina), el pigmento es más fino y se concentra junto al contorno de los dedos, de modo que la silueta queda nítida; la mano apoyada se calcula una sola vez para no perder fluidez.

## Novedades de la v3.11 (propuestas de mejora del 26-10-2026)

**Máquina del tiempo · área del profesorado** (`maquina-del-tiempo.html`). Se enlaza desde la bienvenida y desde la línea del tiempo. Contiene la guía didáctica, la fundamentación curricular, las instrucciones de uso y evaluación (con rúbrica), material de apoyo y ampliación por capítulo y el solucionario de las 25 etapas. El contenido se publica **cifrado** (AES-256-GCM con clave derivada por PBKDF2-SHA-256, 600 000 iteraciones) y solo se descifra en el navegador con la contraseña. En un sitio estático no se puede «ocultar» una página: sin cifrado, cualquiera podría leer el solucionario en el código fuente. El texto en claro y la herramienta de cifrado no están en el repositorio. Para cambiar la contraseña o el contenido, se vuelve a cifrar con `cifrar.mjs` (se entrega aparte).

**Contexto histórico en las 25 etapas.** El panel «Contexto» que ya tenía la Prehistoria se extiende a la Edad Antigua, la Media, la Moderna y la Contemporánea.

**Sin respuestas a la vista.** Se ha revisado «Saber más», las métricas y los enunciados de los cinco capítulos para que no adelanten la solución: por ejemplo, la medida de la tela en metros, «casi 5 veces», el 20 %, el ángulo interior del pentágono, los 40° de Toledo o los 20 cm de la mano. Donde hacía falta un ejemplo, se usan otros números.

**Prehistoria.** La mano de la cueva encaja con la cuadrícula: la palma y los dedos se recortan sobre cuadros de 5 cm, y la superficie se cuenta con cuadros enteros (verdes) y trozos (amarillos), que valen medio cuadro. La respuesta sale del dibujo real, no de una cifra fija.

**Edad Antigua (Misión Roma).**
- *Terreno:* el alumnado calcula la altura de la arcada restando cotas (canal − valle).
- *Nivelar:* se añade el problema de la pendiente del −8 % en un tramo de 2,5 m y se quita el volumen del prisma.
- *Construir:* primero se calcula cuántos sillares hacen falta para el pilar de 3,20 m; después se apilan; por último, se calculan el volumen del pilar y el de los sillares y se comparan.
- *Medir:* el enunciado de la etapa 4 es más claro.
- *Cantonera:* cada boca tiene una regla de 0 a 80 cm con la abertura rotulada; al final, el reparto se aplica sin tantear a una abertura nueva.

**Edad Media.**
- *Arcos:* se añaden una regla de 0 a 2 m y una mira con la distancia a A para localizar el punto medio.
- *Rosetón:* primero hay que abrir el compás hasta el radio.
- *Alhambra:* las piezas empiezan en posiciones al azar y, para cada una, se pregunta cuántos grados se ha girado y qué tipo de ángulo es.
- *Portulano:* la distancia se mide con un compás de puntas abierto como la barra de escala (500 km), paso a paso.

**Edad Moderna.**
- *Velas:* se explica que en la época «vela redonda» designaba la vela cuadrada o rectangular, y el alumnado calcula las dos áreas y cuántas veces es mayor la rectangular.
- *Perspectiva:* se corrige el aviso que pedía mover el cuadro y se añade una pregunta sobre posiciones de rectas (secantes, paralelas, perpendiculares, tangentes).
- *Ciudadela:* al colocar cada baluarte se ven el sector y los grados; desaparece la suma de 540° y se usa el enunciado propuesto (180° − 72°), con una pregunta sobre el tipo de los ángulos central e interior.
- *Meridiano:* primero se calcula el ángulo de la cumbre y después se mide la distancia con un compás de puntas y una escala visible (tramos de 2 km).
- *Ingenio:* antes de probar, el alumnado calcula los dientes (40 : 4) y luego lo comprueba.

**Edad Contemporánea.**
- *Metro:* el enunciado ya no da la medida en metros y centímetros.
- *Faro:* nuevo modelo de barco de vapor. Se exigen 3 haces y 15 s, y no basta cualquier combinación que dé 5 s. Los controles siguen activos durante la pregunta.
- *Población:* los datos del censo aparecen en un cuadro blanco con letra grande y oscura, sin sombras.
- *Gorona del Viento:* razonamiento guiado. En cada momento del día se calcula primero si sobra o falta energía y cuánta, y después se decide si bombear, turbinar o no hacer nada. Se sustituyen los arrastres de agua, que funcionaban mal.

## Capítulo «Las primeras manos» (Prehistoria)

| Etapa | Área | Qué hace el alumnado con las manos | Contenidos |
|---|---|---|---|
| 1. Tallar un bifaz | Geometría | Golpea el borde de una piedra para quitar lascas hasta que los dos lados son iguales. | Simetría axial, eje de simetría. |
| 2. La mano en la pared | Arte rupestre, medida | Sopla pigmento alrededor de una mano apoyada y mide el negativo con una cuadrícula de 5 cm. | Negativo/positivo, medida, multiplicación. |
| 3. Modelar una vasija | Geometría, medida | Ensancha o estrecha los anillos del barro hasta encajar con el modelo y lo decora con conchas. | Cuerpo de revolución, capacidad en litros, friso (traslación). |
| 4. Orientar el dolmen | Geografía, geometría | Gira el corredor del dolmen hasta que el sol del equinoccio entra en la cámara. | Ángulos en grados, puntos cardinales. |
| 5. La pintadera canaria | Patrimonio canario, geometría | Dibuja en un sector de la pintadera, que se repite al girar, y la estampa. | Simetría de rotación (360° : n), reflexión al estampar. |

**Fuentes del capítulo:**
- Lepre et al. (2011), *Nature*, 477, 82-85, https://doi.org/10.1038/nature10372
- Vallverdú et al. (2014), *PLoS ONE*, 9(7), e103634, https://doi.org/10.1371/journal.pone.0103634
- Pike et al. (2012), *Science*, 336, 1409-1413, https://doi.org/10.1126/science.1219957
- Hoffmann et al. (2018), *Science*, 359, 912-915, https://doi.org/10.1126/science.aap7778 (presentado como debate)
- White et al. (2020), *Journal of Human Evolution*, 144, 102640, https://doi.org/10.1016/j.jhevol.2019.102640
- Zilhão (2001), *PNAS*, 98(24), 14180-14185, https://doi.org/10.1073/pnas.241522898
- Lozano Rodríguez et al. (2024), *Science Advances*, https://doi.org/10.1126/sciadv.adp1295
- UNESCO, bienes n.º 310 (Altamira y arte rupestre del norte de España) y «Antequera Dolmens Site» (2016)
- El Museo Canario, catálogo «Pintaderas»
- Velasco-Vázquez et al. (2021), *Complutum*, 32(1), 167-189, https://doi.org/10.5209/cmpl.76453

**Simplificaciones declaradas:**
- La piedra, la mano (20 cm), la vasija y el dolmen son modelos.
- En la etapa 4, el horizonte es plano.
- La pintadera es circular, para mostrar la simetría de rotación; las reales son mayoritariamente rectangulares.
- La fecha de llegada de la primera población a Canarias («hace unos dos mil años») se presenta como discutida.

## Capítulo «El compás y la piedra» (Edad Media)

| Etapa | Área | Qué hace el alumnado con las manos | Contenidos |
|---|---|---|---|
| 1. Medir con el astrolabio | Historia de la ciencia, geometría | Gira la alidada hasta que la luz del sol pasa por sus dos agujeros y calcula lo que falta para 90°. | Medida de ángulos, ángulos complementarios, latitud. |
| 2. Del medio punto al arco apuntado | Arte, geometría | Clava el compás en el punto medio (románico) y después en cada apoyo (gótico). | Radio, diámetro y luz; triángulo equilátero; comparación de alturas. |
| 3. Trazar el rosetón | Geometría | Marca seis puntos con el compás abierto como el radio y colorea los pétalos. | Hexágono regular, simetría de rotación (órdenes 6 y 3). |
| 4. La lacería de la Alhambra | Patrimonio, geometría | Gira cuadrados hasta formar estrellas de ocho puntas. | Giros de 45°, 360° : 8, teselados. |
| 5. El portulano y Canarias | Geografía, medida | Gira una regla desde Mallorca hasta Lanzarote y estima la distancia con la escala. | Rumbos, rosa de 16 vientos (22,5°), escala. |

**Fuentes del capítulo:**
- History of Science Museum (Universidad de Oxford), Astrolabe Catalogue, inv. 55331 (al-Sahli, Toledo, 1068)
- UNESCO: «Burgos Cathedral» (1984), Caminos de Santiago (1993), «Alhambra, Generalife and Albayzín, Granada» (1984)
- Díez Jorge, M. E. (2007), *Archivo Español de Arte*, 80(317), 25-43
- Quartapelle, A. (2017), *Revista de Historia Canaria*, 199, 11-37
- Quartapelle, A. (2023), *Revista de Historia Canaria*, 205, 323-336, https://doi.org/10.25145/j.histcan.2023.205.13

**Simplificaciones declaradas:**
- Altura del sol a mediodía en un equinoccio, en Toledo (≈ 50°).
- El arco apuntado es el «equilátero».
- La lacería es un patrón de dos cuadrados.
- El portulano es un esquema de costas orientativo, no una reproducción; los rumbos se miden en el plano del mapa.

## Capítulo «Nuevos horizontes» (Edad Moderna)

| Etapa | Qué hace el alumnado con las manos | Contenidos |
|---|---|---|
| 1. Las velas de la carabela (Gran Canaria, 1492) | Arrastra la esquina de la vela latina (triangular) hasta convertirla en redonda (rectangular). | Área del triángulo y del rectángulo; escala de Colón en Canarias. |
| 2. La perspectiva del Renacimiento | Mueve el punto de fuga hasta donde convergen los bordes de la plaza. | Horizonte, punto de fuga, rectas paralelas y semejanza (Alberti, 1435). |
| 3. La ciudadela de Jaca (1592) | Coloca cinco baluartes girando la mano alrededor del centro. | Pentágono regular: 360° : 5 = 72°; ángulo interior de 108°. |
| 4. La expedición al meridiano (1735-1744) | Orienta dos rayos con los ángulos medidos hasta que se cortan en la cumbre. | Triangulación, ángulos de un triángulo y escala (Jorge Juan y Antonio de Ulloa). |
| 5. Canarias: el ingenio de azúcar (s. XVI) | Abre la compuerta de la acequia y cambia la rueda dentada del molino. | Proporcionalidad inversa: 40 : 10 = 4 vueltas. |

## Capítulo «Hierro, luz y viento» (Edad Contemporánea)

| Etapa | Qué hace el alumnado con las manos | Contenidos |
|---|---|---|
| 1. El metro (ley de 1849) | Mide una tela con varas de Burgos y después con metros. | Unidades antiguas y sistema métrico; 3 × 0,835905 m ≈ 2,51 m. |
| 2. El Puente de Vizcaya (1893) | Carga la barquilla y pone diagonales en la viga. | Rigidez del triángulo frente al cuadrado. |
| 3. El faro de Maspalomas (1890) | Ajusta el número de haces y el tiempo de cada vuelta. | 360° : n; un destello cada T : n segundos. |
| 4. La población de Canarias (1900-2001) | Sube cada barra hasta el dato del censo. | Gráfico de barras, escala y comparación (casi ×5). |
| 5. Canarias: Gorona del Viento (2014) | Reparte bombeo y turbinas para que a la isla lleguen 5 MW. | Igualdades, fracciones y porcentajes; isla sostenible. |

## Capítulo «Misión Roma» (Edad Antigua): el proceso evolutivo

La actividad sigue el orden de una obra hidráulica real, en cinco etapas. Cada etapa se desbloquea al completar la anterior.

| Etapa | Área | Qué hace el alumnado con las manos | Contenidos |
|---|---|---|---|
| 1. Leer el terreno | Geografía | Estira las alturas del perfil y señala el valle donde el canal queda en el aire. | Perfil topográfico, cota, exageración vertical. |
| 2. Nivelar el canal | Matemáticas | Sube o baja el pilar hasta que los dos tramos bajan igual. | Pendiente en porcentaje, números enteros. |
| 3. Construir el pilar | Medida y geometría | Coloca sillares de 0,40 m hasta llegar a 3,20 m. | Prisma, volumen, arco de medio punto (radio y luz). |
| 4. Cómo lo hacían los romanos | Historia | Nivela un corobate con una cuña y quita la exageración del canal. | Instrumentos romanos, pendiente real, patrimonio. |
| 5. El agua en Canarias | Transferencia al territorio | Sube o baja las tablas de una cantonera para repartir el agua en 1/2, 1/4 y 1/4. | Fracciones, porcentajes, proporcionalidad, patrimonio hidráulico canario. |

Todas las etapas se pueden hacer de tres formas:
- con las manos ante la cámara, haciendo pinza;
- con el dedo o el ratón;
- con los controles de «Otra forma de mover» (deslizadores y botones accesibles con teclado).

## Para el profesorado

- **Ayudas de juego (v3.8).** Son comunes a los cinco capítulos:
  - **Pista.** Cada etapa tiene dos pistas graduadas: la primera dice qué hacer y dónde; la segunda orienta el razonamiento sin dar la respuesta hecha. El botón se ilumina tras dos errores o tras 45 segundos sin avances.
  - **Anillos de agarre.** Unos anillos azules marcan lo que se puede mover mientras la etapa no está terminada. Con la cámara, el círculo de la pinza se pone verde cuando está sobre uno de ellos. En las etapas donde elegir el lugar es la propia tarea (el valle, el centro del arco, el borde del bifaz) no se muestran, para no dar la solución.
  - **Respuesta a la pinza.** Una onda verde confirma que se ha agarrado algo; una onda naranja discontinua indica que la pinza no ha tocado nada. Tras tres pinzas fallidas seguidas aparece una ayuda.
  - **Celebración.** Al completar una etapa por primera vez aparece un rótulo, confeti (no se muestra si el sistema pide reducir el movimiento) y el botón «Siguiente etapa» se ilumina.
  - **Sonido.** Sonidos breves y suaves, sintetizados en el navegador sin archivos: acierto, error, agarre y fanfarria final. El botón «Sonido» del panel superior los activa o desactiva, y la elección se recuerda en el navegador. Ningún mensaje depende solo del sonido.
  - **Faro de Maspalomas.** Los haces y los segundos por vuelta se controlan ahora por separado: la linterna cambia los haces y la esfera de la relojería, el tiempo. Antes, un mismo gesto cambiaba las dos cosas.
- **Máquina del tiempo (v3.11).** Área del profesorado cifrada con contraseña: `maquina-del-tiempo.html`. Guía, currículo, evaluación, material de apoyo y solucionario.
- **Modo docente.** Añade `?docente` a la dirección (por ejemplo, `http://localhost:8000/?docente`) para abrir cualquier etapa sin completar las anteriores.
- **Progreso.** Las etapas completadas se recuerdan solo en ese navegador. Para reiniciar, borra los datos del sitio en el navegador.
- **«Saber más».** Cada etapa tiene un panel con la explicación, preguntas y la fuente.
- **Decorados (v3.5).** Cada etapa tiene un telón pintado en el navegador acorde con su época y lugar (sabana del lago Turkana, cueva, aldea neolítica, cumbres de Gran Canaria, valle de Segovia, barranco con bancales, Toledo, obra de una catedral, nave gótica, patio nazarí, puerto de Mallorca), con suelo, niebla y luz propios. Al mostrar la imagen de la cámara, el decorado se retira.
- **Bifaz (v3.5).** El nódulo empieza cubierto de córtex; cada golpe saca una lasca invasora de una cara distinta (talla bifacial), con negativos en abanico, ondas de percusión y retoque final del filo. Puede conservar córtex en la base, como muchos bifaces.
- **Cerámica cardial (v3.5).** Pasta parda bruñida con manchas de cocción. Las impresiones se graban en la superficie de la vasija (siguen su curvatura) y reproducen el borde dentado de la valva de berberecho; se ordenan en una franja del hombro, como en la decoración cardial.
- **Pintadera (v3.6).** Se añaden la excisión (vaciar una figura que acompaña a la forma del campo; 60 piezas del catálogo) y la forma rómbica (3 piezas).
- **Pintadera (v3.5.1).** Rehecha a partir de Cruz de Mercadal, Delgado Darias y Velasco Vázquez (2013), *Pintaderas de El Museo Canario* (ISBN 978-84-695-6874-3). Tiene cuerpo (campo, laterales y dorso) y apéndice perforado, que se ve al girar la pieza. Se elige entre las cuatro formas más frecuentes del catálogo: rectangular (77 de 183 matrices simples), cuadrada (34), circular (29) y triangular (29). Cada forma tiene su simetría: orden 2, 4, 3 o libre en la circular. Se decora con punzón (impresión, la técnica más frecuente) o con incisión. El botón «Esquema del museo» muestra hileras que siguen la forma del campo, como en los esquemas pautados del catálogo. La medida real y el área del campo se muestran en pantalla. Al estampar, la imagen sale al revés (reflejo) y en negativo.
- **Calidad gráfica.** Por defecto se usa la calidad alta: materiales con textura (granito, caliza, barro, sílex, latón, estuco, vidriado, pergamino y madera), sombras suaves, reflejos, aristas biseladas, trazos con grosor real y lienzos de 1024 a 1536 píxeles. Las texturas se generan en el propio navegador, sin descargar imágenes. Si el equipo no llega a 24 imágenes por segundo durante unos 4 segundos, la actividad quita las sombras y baja la resolución por sí sola.
  - `?calidad=ligera` arranca directamente en modo ligero (útil en tabletas antiguas).
  - `?calidad=alta` mantiene siempre la calidad máxima (útil para proyectar en la pizarra digital o hacer capturas).
  - Se pueden combinar: `?docente&calidad=ligera`.

### Datos inventados y simplificaciones (declarados en la propia actividad)
- El terreno de la etapa 1 y las fincas y cifras de la etapa 5 son inventados.
- Las etapas 2 y 3 usan exageración vertical (−8 %). La etapa 4 muestra la pendiente de ejemplo, 0,3 %.
- En la cantonera, el caudal de cada boca se toma proporcional a su abertura y las tablas encajan cada 5 cm.

### Fuentes de contenido
- Vitruvio, *De architectura*, VIII, 5: descripción del corobate. VIII, 6: pendiente de los canales.
- Lewis, M. (1999). Vitruvius and Greek aqueducts. *Papers of the British School at Rome*, *67*, 145-172. https://doi.org/10.1017/S0068246200004530. Explica que los manuscritos de Vitruvio y de Plinio dan cifras de pendiente distintas.
- UNESCO, «Old Town of Segovia and its Aqueduct», inscrito en 1985: https://whc.unesco.org/en/list/311
- Real Academia Española, *Tesoro de los diccionarios históricos de la lengua española*, entrada «cantonera»: https://www.rae.es/tdhle/cantonera
- Las fuentes de los capítulos de la Edad Moderna y de la Edad Contemporánea figuran en el panel «Saber más» de cada etapa y en [`docs/matriz-evidencias.md`](docs/matriz-evidencias.md).
- Heredad de Aguas de Arucas y Firgas. Se cita sin fecha porque solo se ha consultado una fuente secundaria; conviene contrastarla con la bibliografía del Archivo Histórico Provincial o de la propia Heredad.

### Encaje curricular (Decreto 211/2022, Canarias)

La matriz completa está en [`docs/alineacion-curricular.md`](docs/alineacion-curricular.md). En resumen:
- **Matemáticas:** todas las etapas trabajan saberes del tercer ciclo, como simetrías y giros, ángulos, áreas, volumen, escalas, porcentajes, fracciones y el uso del compás. El saber III.1.4 cita expresamente la realidad aumentada.
- **Conocimiento del Medio:** el currículo canario sitúa la Prehistoria y la Edad Antigua en el **segundo ciclo** (saberes III.2.3-2.5). En el tercer ciclo están la Edad Media, la Moderna y la Contemporánea, y la sociedad indígena canaria (III.2.1; criterio 7.2).
  - En 5.º y 6.º, la pintadera y el capítulo de la Edad Media encajan de lleno.
  - Las demás etapas de la Prehistoria y de Roma sirven para activar conocimientos previos y dar contexto a la geometría. También pueden usarse en 3.º y 4.º.
- Los códigos proceden del Anexo 2 que publica la Consejería; conviene cotejarlos con el texto del BOC.

### Documentación del protocolo ARQ-3D-01 (adopción parcial)
- [`docs/matriz-evidencias.md`](docs/matriz-evidencias.md): qué está documentado, qué es interpretación y qué es modelo didáctico.
- [`docs/registro-decisiones.md`](docs/registro-decisiones.md): decisiones de diseño por versión.
- [`docs/alineacion-curricular.md`](docs/alineacion-curricular.md): matriz curricular e instrumentos de evaluación.

## Puesta en marcha

### 1. Modelo de manos

**Incluido desde la v3.6.1** en `modelo/hand_landmarker.task`. Es la copia descargada de Google por la usuaria, comprobada con su tamaño y su huella. Si alguna vez hubiera que reponerlo, descárgalo desde:

`https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`

Guárdalo como `modelo/hand_landmarker.task` y súbelo a la carpeta `modelo/` del repositorio («Add file → Upload files» en GitHub).

**Comprobación:** el archivo correcto ocupa 7 819 105 bytes y su huella SHA-256 es `fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1`. El panel `?diagnostico` la comprueba solo; también puede hacerse a mano:
- Windows: `certutil -hashfile hand_landmarker.task SHA256`
- macOS o Linux: `shasum -a 256 hand_landmarker.task`

Antes de redistribuirlo fuera del centro, revisa sus condiciones de uso en la documentación de MediaPipe.

### 2. Modelo remoto (desactivado en esta edición)

Esta edición trae `PERMITIR_MODELO_REMOTO = false`: la página nunca descarga el modelo de Google. Si quieres permitirlo, cambia el valor a `true`.

### 2 bis. Valores posibles

En `index.html` está la línea `const PERMITIR_MODELO_REMOTO = true;`.
- Con `true`, si falta el modelo local, se descarga de Google.
- Con `false`, nada sale del centro. Si falta el modelo, la actividad pasa al modo táctil con un aviso.

### 3. Publicar en GitHub Pages

1. En github.com, crea un repositorio **público** (por ejemplo, `mision-roma`). Con la cuenta gratuita, Pages solo funciona en repositorios públicos.
2. Entra en «Add file → Upload files» y arrastra **el contenido** de esta carpeta, de modo que `index.html` quede en la raíz. Pulsa «Commit changes».
3. Entra en «Settings → Pages» y elige «Deploy from a branch», `main` y `/ (root)`. Pulsa «Save».
4. Abre `https://TU-USUARIO.github.io/mision-roma/`. Para el modo docente, añade `?docente` al final.

GitHub registra la IP de quienes visitan el sitio. Comunícalo al delegado o la delegada de protección de datos antes de usarlo con alumnado.

### 3 bis. Servir la carpeta en otro sitio

No funciona con doble clic: los navegadores bloquean los módulos y la cámara en `file://`.

- **En el propio equipo:** ejecuta `python3 -m http.server 8000` en la carpeta y abre `http://localhost:8000`.
- **En las tabletas:** publica la carpeta en un servidor con **https**. Sin https funciona en modo táctil, pero no con las manos.

### 4. Comprobar la integridad

Ejecuta `sha256sum -c MANIFIESTO.txt`. Además, la página verifica `lib/three.module.js` y `lib/vision_bundle.mjs` con SRI. Desde la v3.12, el manifiesto incluye también `lib/motor.js`, `lib/estilos.css` y `lib/xr-adapter.js`.

## Si la cámara no funciona

Pulsa **«Comprobar cámara y manos»** en la pantalla de inicio, o abre la dirección añadiendo `?diagnostico`. El panel revisa cada requisito y propone la solución. «Probar la cámara ahora» hace una prueba de 4 segundos e indica si ve manos y a qué velocidad.

| Síntoma | Causa | Solución |
|---|---|---|
| «Falta el archivo modelo/hand_landmarker.task» | No se ha subido el modelo (es la causa más frecuente). | Descárgalo con el enlace de `modelo/LEEME.txt`, guárdalo con ese nombre exacto en `modelo/` y súbelo al repositorio. |
| No pasa nada al abrir el archivo | Se ha abierto con doble clic (`file://`). | Usa la dirección de GitHub Pages o un servidor local. |
| «La dirección no es segura» | Página servida por `http://` desde otra máquina. | Usa `https://` (GitHub Pages lo hace por defecto) o `localhost`. |
| «Permiso de cámara denegado» | Se pulsó «Bloquear». | Permite la cámara desde el candado de la barra de direcciones y recarga. |
| La cámara funciona pero no veo nada del vídeo | La imagen está oculta por privacidad. | Marca «Ver mi imagen…» al empezar o pulsa «Mostrar mi imagen». |
| «No veo ninguna mano» | Distancia, luz o encuadre. | Mano a 30-60 cm de la cámara, con buena luz y la palma hacia la pantalla. |
| Va a saltos | Equipo lento. | Si la GPU falla, la página cambia sola a CPU. Si sigue lento, usa el modo táctil. |

El indicador **«Cámara: …»**, bajo el panel superior, muestra en todo momento si la cámara está activa, cuántas manos ve y si se está agarrando algo.

## Privacidad

- La imagen se procesa en el dispositivo y no se graba ni se envía.
- Por defecto solo se ven unas manos dibujadas, no la imagen del alumnado.
- La cámara se apaga al salir, al ocultar la página y si falla el arranque.
- El progreso guardado solo contiene qué etapas están hechas, sin datos personales.
- En el modo de realidad mixta (v3.12), la página no recibe imágenes de la cámara: solo la posición del mando o de la mano que calcula el propio visor.

Su uso con menores debe valorarse con el delegado o la delegada de protección de datos del centro.

## Verificación realizada (Chromium sin interfaz)

- Recorrido completo de las cinco etapas con controles y con arrastres reales de puntero.
- Ninguna violación de accesibilidad con axe-core (WCAG 2.2 AA) en las cinco etapas ni en sus paneles. El foco se gestiona en los diálogos.
- HTML válido.
- Encuadre comprobado en móvil vertical, móvil horizontal y tableta.
- Sin peticiones externas salvo el modelo, cuando falta y está permitido.
- La cámara se apaga cuando el detector no arranca.
- v3.12: motor en `lib/motor.js`. Comprobado que ninguna de las 6 724 cadenas de texto de la v3.11.4 se pierde y que el HTML fuera del código es idéntico; recorrido de las 25 etapas en Chromium sin interfaz con los mismos títulos, métricas, mensajes, controles, contextos y «Saber más» que la v3.11.4, sin errores y sin peticiones externas. Modo de realidad mixta probado con un visor emulado (Meta Quest 3, IWER): entrar, cambiar de etapa, arrastrar el pilar de «Nivelar el canal» con el mando y salir devolviendo la escena a la pantalla. Pendiente: gafas reales.
- v3.10: ver «Novedades de la v3.10». Comprobados el recorrido completo de la Prehistoria con los controles alternativos, la carga del detector de manos en la bienvenida (con cámara simulada), las descargas (HTML y CSV, con el texto del alumnado escapado), «Empezar de cero», la accesibilidad (axe) y la regresión de los cinco capítulos. La pinza sobre botones y la mano real de la bienvenida quedan pendientes de probar con una mano de verdad.
- v3.9.1: la bienvenida pasa a ser la pantalla de inicio. Comprobada la navegación: raíz, línea del tiempo, recarga, «atrás», vuelta desde los capítulos, Misión Roma directa y modo docente.
- v3.9: bienvenida y pasaporte del aprendiz. Probados en escritorio y en móvil vertical: soplo con puntero y con teclado, miniatura guardada, lectura del progreso, sello estampado e ideas previas. Sin violaciones de accesibilidad (axe, WCAG 2.2 AA), HTML válido, sin desbordamiento horizontal y sin errores.
- v3.8: ayudas de juego comunes. Probadas pistas, aviso tras dos errores, celebración, anillos, ayuda tras tres pinzas fallidas, sonido desactivable y nuevo control del faro. Regresión de los cinco capítulos sin errores, axe sin violaciones y HTML válido.
- v3.7: capítulos de la Edad Moderna y de la Edad Contemporánea. Recorridos completos de sus diez etapas, accesibilidad sin violaciones (portada, etapas, «Saber más» y panel final), HTML válido y sin peticiones externas. Regresión de los tres capítulos anteriores sin errores.
- v3.6.1: con el modelo de manos incluido, el diagnóstico confirma su huella. El detector arranca con una cámara simulada (GPU) sin peticiones externas; la detección de una mano real queda pendiente de probar en el aula.
- v3.6: pared de la cueva integrada en la roca; pintadera con excisión y forma rómbica; comprobación de la huella del modelo en el diagnóstico; fecha del poblamiento de Canarias precisada (siglos II-III d. C., en debate). Regresión completa sin errores.
- Decorados, bifaz y cerámica cardial (v3.5): recorridos de los tres capítulos sin errores, accesibilidad sin violaciones y capturas revisadas.
- Calidad gráfica alta (v3.4): recorridos de los tres capítulos repetidos sin errores, capturas de las quince etapas revisadas y modo ligero comprobado.

**Pendiente:**
- Prueba de la pinza real con alumnado y en las tabletas del aula.
- Revisión de Safari para iPad.
- Comprobar en las tabletas del aula si salta el modo ligero automático; si va lenta, usar `?calidad=ligera`.
- Cotejar la matriz curricular con el texto oficial del BOC y concretar la situación de aprendizaje.
- Revisión humana de los contenidos.
