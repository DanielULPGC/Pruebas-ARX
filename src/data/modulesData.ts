export interface ProjectFile {
  id: string;
  filename: string;
  folder: 'lib' | 'root' | 'standalone';
  targetPath: string;
  description: string;
  sizeBytes: number;
  badge: string;
  language: 'css' | 'javascript' | 'html';
  content: string;
  isCore: boolean;
}

export const ESTILOS_CSS = `/* estilos.css · Las manos que construyeron la historia v3.12 */
:root {
  --ocre: #c2843a;
  --noche: #1c1917;
  --panel: rgba(28, 25, 23, 0.9);
  --texto: #faf7f2;
  --ok: #4ade80;
  --aviso: #facc15;
  --error: #f87171;
  --agua: #38bdf8;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: var(--noche);
  color: var(--texto);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-user-select: none;
  user-select: none;
}

#escena {
  position: fixed;
  inset: 0;
  background: linear-gradient(#cfe3ec 0%, #e9dfcc 62%, #b89c78 100%);
}

#video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  opacity: 0;
  transition: opacity .3s;
}

#video.visible {
  opacity: 1;
}

#lienzo3d {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
}

#lienzoManos, #lienzoEfectos {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

#lienzoEfectos {
  z-index: 25;
}

#lienzoManos {
  z-index: 30;
}

.mano-encima {
  outline: 4px solid var(--ok) !important;
  outline-offset: 3px;
  box-shadow: 0 0 0 8px rgba(74, 222, 128, .25) !important;
}

/* Interfaz superpuesta (HUD) */
#inicio {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(28, 25, 23, 0.85);
  backdrop-filter: blur(8px);
  z-index: 50;
  padding: 24px;
  text-align: center;
}

#inicio .tarjeta {
  max-width: 540px;
  background: var(--panel);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

#inicio h1 {
  color: var(--ocre);
  margin-top: 0;
  font-size: 1.8rem;
}

#inicio .botones {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

#inicio button {
  font-family: inherit;
  font-weight: 700;
  font-size: 1rem;
  padding: 14px 20px;
  border-radius: 10px;
  border: none;
  background: var(--ocre);
  color: var(--noche);
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

#inicio button:hover {
  background: #e3a85c;
  transform: translateY(-1px);
}

#estado {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--panel);
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 40;
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: none;
}
.status-ok { color: var(--ok); border-color: rgba(74, 222, 128, 0.4) !important; }
.status-aviso { color: var(--aviso); border-color: rgba(250, 204, 21, 0.4) !important; }
`;

export const XR_ADAPTER_JS = `// Drop-in XR Blocks / WebXR Adapter para cualquier capítulo de «Las manos que construyeron la historia»
import * as THREE from "three";

export function conectarXRBlocks({ renderer, scene, camera, DEC, estado, empezarTactil, aPantalla, getEtapa }) {
  const ANCHO_MAQUETA_M = 0.55;
  const rigMaqueta = new THREE.Group();
  scene.add(rigMaqueta);

  const cursor3D = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false })
  );
  cursor3D.renderOrder = 20;
  cursor3D.visible = false;
  scene.add(cursor3D);

  const planoLocalZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const planoMundo = new THREE.Plane();
  const rayo3D = new THREE.Ray();
  const puntoCorte = new THREE.Vector3();
  const matrizTemp = new THREE.Matrix4();
  let sesionXR = null, controladorActivo = null, punteroXRActivo = false;

  function ajustarEscalaMaqueta(enXR) {
    const et = getEtapa();
    if (!et) return;
    const g = et.grupo;
    if (enXR) {
      if (g.parent !== rigMaqueta) rigMaqueta.add(g);
      const escala = ANCHO_MAQUETA_M / (et.marco.ancho || 6);
      rigMaqueta.scale.setScalar(escala);
      rigMaqueta.position.set(0, -0.28 - et.marco.cy * escala, -0.65);
    } else {
      if (g.parent !== scene) scene.add(g);
      rigMaqueta.scale.setScalar(1);
      rigMaqueta.position.set(0, 0, 0);
      cursor3D.visible = false;
    }
    rigMaqueta.updateMatrixWorld(true);
  }

  function rayoAPantalla(ctrl) {
    const et = getEtapa();
    if (!et) return null;
    matrizTemp.identity().extractRotation(ctrl.matrixWorld);
    const origen = new THREE.Vector3().setFromMatrixPosition(ctrl.matrixWorld);
    const dir = new THREE.Vector3(0, 0, -1).applyMatrix4(matrizTemp);
    rayo3D.set(origen, dir.normalize());
    planoMundo.copy(planoLocalZ0).applyMatrix4(et.grupo.matrixWorld);
    if (!rayo3D.intersectPlane(planoMundo, puntoCorte)) return null;
    cursor3D.position.copy(puntoCorte);
    cursor3D.visible = true;
    return aPantalla(puntoCorte.x, puntoCorte.y, puntoCorte.z);
  }

  async function iniciar() {
    if (!navigator.xr) {
      empezarTactil("Este navegador no tiene WebXR activo. Activado el modo táctil.");
      return;
    }
    const soportaAR = await navigator.xr.isSessionSupported("immersive-ar").catch(() => false);
    const modo = soportaAR ? "immersive-ar" : "immersive-vr";
    const ok = soportaAR || await navigator.xr.isSessionSupported("immersive-vr").catch(() => false);
    if (!ok) {
      empezarTactil("No se detectan gafas XR ni cámara AR compatible.");
      return;
    }
    empezarTactil();
    renderer.xr.enabled = true;
    sesionXR = await navigator.xr.requestSession(modo, {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "dom-overlay"],
      domOverlay: { root: document.body }
    });
    renderer.xr.setReferenceSpaceType("local");
    await renderer.xr.setSession(sesionXR);
    DEC.ocultar(soportaAR);
    ajustarEscalaMaqueta(true);
    estado("Maqueta 3D situada frente a ti. Apunta y haz pinza.", "status-ok", "xr-ok");

    [renderer.xr.getController(0), renderer.xr.getController(1)].forEach((c) => {
      scene.add(c);
      c.addEventListener("selectstart", () => {
        controladorActivo = c;
        const pt = rayoAPantalla(c), et = getEtapa();
        if (pt && et) { cursor3D.material.color.setHex(0x4ade80); punteroXRActivo = !!et.down(pt.x, pt.y); }
      });
      c.addEventListener("selectend", () => {
        const pt = rayoAPantalla(c), et = getEtapa();
        cursor3D.material.color.setHex(0x38bdf8);
        if (punteroXRActivo && et) et.up(pt ? pt.x : 0, pt ? pt.y : 0);
        punteroXRActivo = false;
        if (controladorActivo === c) controladorActivo = null;
      });
    });

    sesionXR.addEventListener("end", () => {
      sesionXR = null; renderer.xr.enabled = false;
      DEC.ocultar(false); ajustarEscalaMaqueta(false);
    });
  }

  const contenedor = document.querySelector("#inicio .botones");
  const btnTactil = document.getElementById("btn-tactil");
  if (contenedor && btnTactil && !document.getElementById("btn-xrblocks")) {
    const b = document.createElement("button");
    b.type = "button"; b.id = "btn-xrblocks";
    b.textContent = "Modo Realidad Mixta · Maqueta 3D (XR Blocks)";
    b.addEventListener("click", () => iniciar().catch((e) => empezarTactil("Error XR: " + e.message)));
    contenedor.insertBefore(b, btnTactil.nextSibling);
  }

  return {
    tick() {
      if (sesionXR && controladorActivo) {
        const pt = rayoAPantalla(controladorActivo), et = getEtapa();
        if (pt && et) { if (punteroXRActivo) et.move(pt.x, pt.y); else if (et.hover) et.hover(pt.x, pt.y); }
      }
    },
    alCambiarEtapa() { if (sesionXR) ajustarEscalaMaqueta(true); }
  };
}
`;

export const XR_FISICA_JS = `import * as THREE from "three";

export class CaidaFisica3D {
  constructor(malla, yDestino, alEncajar) {
    this.malla = malla;
    this.yDestino = yDestino;
    this.vy = 0;
    this.alEncajar = alEncajar;
    this.terminado = false;
  }
  step(dt) {
    if (this.terminado) return;
    this.vy -= 9.8 * dt;
    this.malla.position.y += this.vy * dt;
    if (this.malla.position.y <= this.yDestino) {
      this.malla.position.y = this.yDestino;
      if (Math.abs(this.vy) > 0.6) {
        this.vy = -this.vy * 0.25;
      } else {
        this.terminado = true;
        if (this.alEncajar) this.alEncajar();
      }
    }
  }
}
`;

export const XR_BLOCKS_JS = `// Módulo puente local para XR Blocks (evita errores 404 sin conexión).
// Sustituir por build/xrblocks.js del repositorio oficial https://github.com/google/xrblocks cuando se desee.
export const isFallbackStub = true;
export const version = "3.12.0";

export class XRBlockManager {
  constructor(options = {}) {
    this.options = options;
    this.blocks = [];
  }
  register(block) {
    this.blocks.push(block);
    return block;
  }
}
`;

export const DESCARGAR_ARCHIVOS_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Descarga de archivos · v3.12 (XR Blocks)</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 680px; margin: 40px auto; padding: 20px; background: #1c1917; color: #faf7f2; line-height: 1.5; }
    .tarjeta { background: #292524; border: 1px solid rgba(255,255,255,.2); border-radius: 14px; padding: 24px; }
    h1 { color: #c2843a; margin-top: 0; }
    button { font: inherit; font-weight: 700; padding: 12px 18px; border-radius: 10px; border: none; background: #c2843a; color: #1c1917; cursor: pointer; margin: 6px 6px 6px 0; }
    button:hover { background: #e3a85c; }
    code { background: rgba(255,255,255,.1); padding: 2px 6px; border-radius: 4px; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="tarjeta">
    <h1>Descargar archivos v3.12 · XR Blocks</h1>
    <p>Pulsa cada botón para descargar directamente el archivo a tu ordenador y colócalo dentro de la carpeta <code>lib/</code> de tu proyecto:</p>
    <div>
      <button onclick="descargar('estilos.css', CSS)">1. Descargar estilos.css</button>
      <button onclick="descargar('xr-adapter.js', XR_ADAPTER)">2. Descargar xr-adapter.js</button>
      <button onclick="descargar('xr-fisica.js', XR_FISICA)">3. Descargar xr-fisica.js</button>
      <button onclick="descargar('xrblocks.js', XR_STUB)">4. Descargar xrblocks.js (puente local)</button>
    </div>
    <p><small>Nota: Si quieres que se active en tus <code>.html</code> actuales sin siquiera tener que reemplazar los 5 capítulos enteros, basta con añadir las 2 líneas del adaptador al final de tu script.</small></p>
  </div>

<script>
function descargar(nombre, texto) {
  const blob = new Blob([texto.trimStart()], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(a.href);
}

const CSS = \`${ESTILOS_CSS}\`;
const XR_STUB = \`${XR_BLOCKS_JS}\`;
const XR_FISICA = \`${XR_FISICA_JS}\`;
const XR_ADAPTER = \`${XR_ADAPTER_JS}\`;
</script>
</body>
</html>
`;

export const PREHISTORIA_SAMPLE_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Las Manos que Construyeron la Historia · Cap. 1: Prehistoria</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="./lib/estilos.css">
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>
</head>
<body>
  <div id="escena"></div>
  <canvas id="lienzo3d"></canvas>
  <div id="estado">Coloca los ortostatos y el dintel del Dolmen Megalítico</div>

  <div id="inicio">
    <div class="tarjeta">
      <h1>Capítulo I · Prehistoria</h1>
      <p>Construcción Megalítica: Aprende el equilibrio de los ortostatos de piedra y la colocación del dintel megalítico.</p>
      <div class="botones">
        <button id="btn-tactil" type="button">Comenzar en Modo Táctil / Ratón</button>
      </div>
    </div>
  </div>

  <script type="module">
    import * as THREE from "three";
    import { conectarXRBlocks } from "./lib/xr-adapter.js";
    import { CaidaFisica3D } from "./lib/xr-fisica.js";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.2, 3);
    camera.lookAt(0, 0.3, 0);

    const canvas = document.getElementById("lienzo3d");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xfff1dc, 1.4);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    // Suelo de tierra prehistórica
    const suelo = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0x8a704e, roughness: 0.9 })
    );
    suelo.position.y = -0.05;
    scene.add(suelo);

    // Etapa 1: Dolmen
    const grupoDolmen = new THREE.Group();
    scene.add(grupoDolmen);

    const matPiedra = new THREE.MeshStandardMaterial({ color: 0x7c7365, roughness: 0.85 });
    
    // Piedra 1 izquierda
    const piedraIzq = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.4), matPiedra);
    piedraIzq.position.set(-0.6, 0.55, 0);
    grupoDolmen.add(piedraIzq);

    // Piedra 2 derecha
    const piedraDer = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.4), matPiedra);
    piedraDer.position.set(0.6, 0.55, 0);
    grupoDolmen.add(piedraDer);

    // Dintel superior (física)
    const dintel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.7), matPiedra);
    dintel.position.set(0, 2.2, 0);
    grupoDolmen.add(dintel);

    let fisica = null;

    function soltarDintel() {
      fisica = new CaidaFisica3D(dintel, 1.25, () => {
        document.getElementById("estado").textContent = "¡Dintel megalítico encajado con éxito!";
        document.getElementById("estado").className = "status-ok";
      });
    }

    const etapa = {
      grupo: grupoDolmen,
      marco: { ancho: 3.5, cy: 0.6 },
      down: (x, y) => { soltarDintel(); return true; },
      move: (x, y) => {},
      up: (x, y) => {}
    };

    const DEC = { ocultar: (modoAr) => { document.getElementById("inicio").style.display = "none"; } };
    const estado = (txt, cls) => { const el = document.getElementById("estado"); el.textContent = txt; el.className = cls || ""; };
    const empezarTactil = (msg) => {
      DEC.ocultar(false);
      if (msg) estado(msg);
      soltarDintel();
    };
    const aPantalla = (x, y, z) => ({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 });

    document.getElementById("btn-tactil").addEventListener("click", () => empezarTactil());

    // Conexión XR Blocks en solo 2 líneas
    const xr = conectarXRBlocks({ renderer, scene, camera, DEC, estado, empezarTactil, aPantalla, getEtapa: () => etapa });

    const clock = new THREE.Clock();
    function animate() {
      renderer.setAnimationLoop(() => {
        const dt = clock.getDelta();
        if (fisica) fisica.step(dt);
        if (xr) xr.tick();
        renderer.render(scene, camera);
      });
    }
    animate();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>
`;

export const PROJECT_FILES: ProjectFile[] = [
  {
    id: 'estilos-css',
    filename: 'estilos.css',
    folder: 'lib',
    targetPath: 'lib/estilos.css',
    description: 'Estilos visuales unificados: paleta de colores histórica, lienzo 3D, soporte para cámara de manos y paneles de inicio.',
    sizeBytes: ESTILOS_CSS.length,
    badge: 'Módulo CSS',
    language: 'css',
    content: ESTILOS_CSS,
    isCore: true,
  },
  {
    id: 'xr-adapter-js',
    filename: 'xr-adapter.js',
    folder: 'lib',
    targetPath: 'lib/xr-adapter.js',
    description: 'Adaptador WebXR / XR Blocks: gestiona la maquette flotante (0.55m), raycasting de puntero láser 3D, eventos select/pinza y escala.',
    sizeBytes: XR_ADAPTER_JS.length,
    badge: 'Módulo Core XR',
    language: 'javascript',
    content: XR_ADAPTER_JS,
    isCore: true,
  },
  {
    id: 'xr-fisica-js',
    filename: 'xr-fisica.js',
    folder: 'lib',
    targetPath: 'lib/xr-fisica.js',
    description: 'Motor de caída gravitatoria suave (9.8m/s²) con amortiguación y rebote realista para el encaje milimétrico de sillares y bloques.',
    sizeBytes: XR_FISICA_JS.length,
    badge: 'Físicas 3D',
    language: 'javascript',
    content: XR_FISICA_JS,
    isCore: true,
  },
  {
    id: 'xrblocks-js',
    filename: 'xrblocks.js',
    folder: 'lib',
    targetPath: 'lib/xrblocks.js',
    description: 'Puente local y stub seguro para Google XR Blocks, garantizando funcionamiento 100% offline sin errores 404 de importación.',
    sizeBytes: XR_BLOCKS_JS.length,
    badge: 'Puente XR Blocks',
    language: 'javascript',
    content: XR_BLOCKS_JS,
    isCore: true,
  },
  {
    id: 'descargar-archivos-html',
    filename: 'descargar-archivos.html',
    folder: 'standalone',
    targetPath: 'descargar-archivos.html',
    description: 'Página HTML autónoma original con botones JavaScript Blob para descargar todos los archivos con doble clic en cualquier navegador.',
    sizeBytes: DESCARGAR_ARCHIVOS_HTML.length,
    badge: 'Descargador Autónomo',
    language: 'html',
    content: DESCARGAR_ARCHIVOS_HTML,
    isCore: false,
  },
  {
    id: 'prehistoria-sample-html',
    filename: 'prehistoria.html',
    folder: 'root',
    targetPath: 'prehistoria.html',
    description: 'Capítulo 1 completo de ejemplo: Dolmen megalítico con los ortostatos y caída física del dintel ya configurado con XR Blocks.',
    sizeBytes: PREHISTORIA_SAMPLE_HTML.length,
    badge: 'Capítulo Ejemplo',
    language: 'html',
    content: PREHISTORIA_SAMPLE_HTML,
    isCore: false,
  }
];
