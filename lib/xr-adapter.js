// lib/xr-adapter.js · Las manos que construyeron la historia · v3.12
// Modo opcional «Realidad mixta · maqueta 3D» con WebXR nativo del navegador.
//
// · La etapa activa se muestra como una maqueta de 55 cm de ancho, a unos 65 cm delante del alumno.
// · Los rayos del mando o de la mano (pinza del sistema, «select») se traducen a las coordenadas de pantalla
//   que ya usan las 25 etapas: no se reescribe la lógica didáctica de ninguna.
// · Los puntos de agarre de cada etapa se señalan con esferas 3D (en el visor no se ven los anillos 2D).
// · El botón solo aparece si el dispositivo admite una sesión inmersiva (AR o VR); en ordenadores y en
//   la mayoría de tabletas del aula no se muestra nada y la actividad funciona exactamente igual que antes.
// · Sin bibliotecas externas ni peticiones de red. No se usa la cámara de MediaPipe en este modo.

import { THREE, renderer, scene, DEC, aPantalla, estado, sonar, registrarXRAdapter } from "./motor.js";

const ANCHO_MAQUETA_M = 0.55, DISTANCIA_M = 0.65, ALTURA_M = -0.28, MAX_ESFERAS = 8;

let empezarTactil = () => {};
let modoDisponible = null;           // "immersive-ar" | "immersive-vr" | null
let sesion = null, etapaActiva = null;
let punteroActivo = false, mandoActivo = null, mandosListos = false, sombrasPrevias = true;

const rig = new THREE.Group();
rig.name = "maqueta-xr";
scene.add(rig);

const cursor = new THREE.Mesh(new THREE.SphereGeometry(0.008, 16, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false }));
cursor.renderOrder = 20; cursor.visible = false; scene.add(cursor);

const matEsfera = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, wireframe: true });
const esferas = Array.from({ length: MAX_ESFERAS }, () => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 10), matEsfera);
  m.visible = false; scene.add(m); return m;
});

const mRot = new THREE.Matrix4(), rayo3D = new THREE.Ray(), planoLocal = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const plano = new THREE.Plane(), corte = new THREE.Vector3(), vTmp = new THREE.Vector3();

// Coloca la etapa activa en la maqueta (XR) o la devuelve a la escena (pantalla)
function colocarMaqueta(enXR) {
  if (enXR && etapaActiva) {
    if (etapaActiva.grupo.parent !== rig) rig.add(etapaActiva.grupo);
    const escala = ANCHO_MAQUETA_M / (etapaActiva.marco.ancho || 6);
    rig.scale.setScalar(escala);
    rig.position.set(0, ALTURA_M - etapaActiva.marco.cy * escala, -DISTANCIA_M);
  } else {
    [...rig.children].forEach((h) => scene.add(h));   // todas las etapas vuelven a su tamaño real
    rig.scale.setScalar(1); rig.position.set(0, 0, 0);
    cursor.visible = false; esferas.forEach((e) => (e.visible = false));
  }
  rig.updateMatrixWorld(true);
}

// Rayo 3D del mando → punto sobre el plano de la etapa → coordenadas de pantalla que esperan las etapas
function rayoMando(mando) {
  if (!etapaActiva) return null;
  mRot.identity().extractRotation(mando.matrixWorld);
  rayo3D.origin.setFromMatrixPosition(mando.matrixWorld);
  rayo3D.direction.set(0, 0, -1).applyMatrix4(mRot).normalize();
  plano.copy(planoLocal).applyMatrix4(etapaActiva.grupo.matrixWorld);
  if (!rayo3D.intersectPlane(plano, corte)) { cursor.visible = false; return null; }
  cursor.position.copy(corte); cursor.visible = true;
  return aPantalla(corte.x, corte.y, corte.z);
}

function bajar(pt) {
  if (!pt || !etapaActiva) return;
  cursor.material.color.setHex(0x4ade80);
  punteroActivo = !!etapaActiva.down(pt.x, pt.y);
  if (punteroActivo) sonar("agarre");
}
function mover(pt) {
  if (!pt || !etapaActiva) return;
  if (punteroActivo) etapaActiva.move(pt.x, pt.y); else if (etapaActiva.hover) etapaActiva.hover(pt.x, pt.y);
}
function subir(pt) {
  cursor.material.color.setHex(0x38bdf8);
  if (punteroActivo && etapaActiva) etapaActiva.up(pt ? pt.x : 0, pt ? pt.y : 0);
  punteroActivo = false;
}

function actualizarEsferas(t) {
  esferas.forEach((e) => (e.visible = false));
  if (!sesion || !etapaActiva || !etapaActiva.agarres || punteroActivo) return;
  let puntos = [];
  try { puntos = etapaActiva.agarres() || []; } catch (e) { puntos = []; }
  const latido = 1 + 0.15 * Math.sin(t * 5);
  puntos.slice(0, MAX_ESFERAS).forEach((p, i) => {
    vTmp.set(p[0], p[1], p[2] || 0);
    etapaActiva.grupo.localToWorld(vTmp);   // mismo marco que los anillos 2D del motor
    esferas[i].position.copy(vTmp); esferas[i].scale.setScalar(latido); esferas[i].visible = true;
  });
}

async function entrarEnXR() {
  // requestSession va lo primero: necesita el gesto del usuario (el clic) todavía activo
  const s = await navigator.xr.requestSession(modoDisponible, {
    optionalFeatures: ["local-floor", "hand-tracking", "dom-overlay"],
    domOverlay: { root: document.body }
  });
  empezarTactil();                    // deja la etapa abierta y los controles alternativos visibles
  sesion = s;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  await renderer.xr.setSession(s);
  sombrasPrevias = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false;
  DEC.ocultar(true);
  colocarMaqueta(true);
  estado("Maqueta 3D delante de ti. Apunta con la mano o el mando y haz pinza o pulsa el gatillo.", "status-ok", "xr-activo");

  if (!mandosListos) {
    [0, 1].forEach((n) => {
      const m = renderer.xr.getController(n);
      scene.add(m);
      m.addEventListener("selectstart", () => { mandoActivo = m; bajar(rayoMando(m)); });
      m.addEventListener("selectend", () => { subir(rayoMando(m)); if (mandoActivo === m) mandoActivo = null; });
    });
    mandosListos = true;
  }

  s.addEventListener("end", () => {
    sesion = null; punteroActivo = false; mandoActivo = null;
    renderer.xr.enabled = false;
    renderer.shadowMap.enabled = sombrasPrevias;
    DEC.ocultar(false);
    colocarMaqueta(false);
    window.dispatchEvent(new Event("resize"));   // reencuadra la cámara de pantalla
    estado("Has salido de la realidad mixta. Puedes seguir en la pantalla.", "status-warn", "xr-fin");
  });
}

// Llamar una vez desde cada capítulo, pasando su función empezarTactil
export function activarModoXR(opciones = {}) {
  if (opciones.empezarTactil) empezarTactil = opciones.empezarTactil;

  registrarXRAdapter({
    alCambiarEtapa(nueva) {
      if (etapaActiva && etapaActiva !== nueva && etapaActiva.grupo.parent === rig) scene.add(etapaActiva.grupo);
      etapaActiva = nueva;
      if (sesion) colocarMaqueta(true);
    },
    tick() {
      if (!sesion) return;
      if (mandoActivo) mover(rayoMando(mandoActivo));
      actualizarEsferas(performance.now() / 1000);
    }
  });

  // v3.12.2 · El panel «Comprobar cámara y manos» informa también de si el dispositivo admite realidad mixta
  const lista = document.getElementById("lista-diag");
  let lineaXR = { clase: "aviso", texto: "Realidad mixta: comprobando el dispositivo…", consejo: "" };
  const ponerLineaXR = () => {
    if (!lista || !lista.children.length) return;
    const ya = lista.querySelector("[data-xr]");
    if (ya) { if (lista.lastElementChild !== ya) lista.appendChild(ya); return; } // siempre al final
    const li = document.createElement("li");
    li.dataset.xr = ""; li.className = "r-" + lineaXR.clase; li.textContent = lineaXR.texto;
    if (lineaXR.consejo) { const sm = document.createElement("small"); sm.textContent = lineaXR.consejo; li.appendChild(sm); }
    lista.appendChild(li);
  };
  const fijarLineaXR = (clase, texto, consejo = "") => {
    lineaXR = { clase, texto, consejo };
    const vieja = lista && lista.querySelector("[data-xr]"); if (vieja) vieja.remove();
    ponerLineaXR();
  };
  if (lista) new MutationObserver(ponerLineaXR).observe(lista, { childList: true });
  const CONSEJO_XR = "Necesita gafas con WebXR (por ejemplo, Meta Quest con su navegador) o un móvil Android con Chrome y los servicios de realidad aumentada de Google. " +
    "Para probarla en un ordenador, el profesorado puede instalar en Chrome la extensión «Immersive Web Emulator» (Meta). Sin ella, la actividad funciona igual en la pantalla.";

  if (!window.isSecureContext) { fijarLineaXR("aviso", "Realidad mixta: no disponible en una dirección sin https.", CONSEJO_XR); return; }
  if (!navigator.xr) { fijarLineaXR("aviso", "Realidad mixta: este navegador o dispositivo no la admite.", CONSEJO_XR); return; }
  (async () => {
    const ar = await navigator.xr.isSessionSupported("immersive-ar").catch(() => false);
    const vr = ar ? false : await navigator.xr.isSessionSupported("immersive-vr").catch(() => false);
    modoDisponible = ar ? "immersive-ar" : vr ? "immersive-vr" : null;
    if (!modoDisponible) { fijarLineaXR("aviso", "Realidad mixta: este dispositivo no admite sesiones inmersivas.", CONSEJO_XR); return; }
    fijarLineaXR("ok", ar ? "Realidad mixta disponible: aparece el botón «Construir en realidad mixta» al empezar."
      : "Realidad virtual disponible: aparece el botón «Construir en realidad virtual» al empezar.");
    const contenedor = document.querySelector("#inicio .botones"), tactil = document.getElementById("btn-tactil");
    if (!contenedor || !tactil || document.getElementById("btn-xr")) return;
    const b = document.createElement("button");
    b.type = "button"; b.id = "btn-xr";
    b.textContent = ar ? "Construir en realidad mixta (maqueta 3D)" : "Construir en realidad virtual (maqueta 3D)";
    b.addEventListener("click", () => {
      entrarEnXR().catch((err) => empezarTactil("No se ha podido iniciar la realidad mixta (" + (err.message || "error") + "). Sigue en la pantalla."));
    });
    contenedor.insertBefore(b, tactil.nextSibling);
  })();
}
