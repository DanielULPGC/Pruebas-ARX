// Adaptador Universal XR Blocks v3.12 + Nuevo Diseño Visual para «Las manos que construyeron la historia» (Pruebas-ARX)
import * as THREE from "three";
import { CaidaFisica3D } from "./xr-fisica.js";

// 1. Inyectar hoja de estilos del Nuevo Diseño v3.12 automáticamente
(function inyectarDiseñoV312() {
  if (!document.querySelector('link[href*="estilos.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./lib/estilos.css?v=3.12";
    document.head.appendChild(link);
  }
})();

export function conectarXRBlocks({ renderer, scene, camera, DEC, estado, empezarTactil, aPantalla, getEtapa }) {
  const ANCHO_MAQUETA_M = 0.55;
  const rigMaqueta = new THREE.Group();
  scene.add(rigMaqueta);

  // Pedestal arquitectónico 3D para Modo Maqueta
  const pedestalGroup = new THREE.Group();
  const baseMesa = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.46, 0.04, 36),
    new THREE.MeshStandardMaterial({ color: 0x24201e, roughness: 0.7, metalness: 0.2 })
  );
  baseMesa.position.y = -0.32;
  pedestalGroup.add(baseMesa);

  const anilloOro = new THREE.Mesh(
    new THREE.RingGeometry(0.39, 0.415, 48),
    new THREE.MeshBasicMaterial({ color: 0xc2843a, side: THREE.DoubleSide })
  );
  anilloOro.rotation.x = -Math.PI / 2;
  anilloOro.position.y = -0.298;
  pedestalGroup.add(anilloOro);
  pedestalGroup.visible = false;
  scene.add(pedestalGroup);

  const cursor3D = new THREE.Mesh(
    new THREE.SphereGeometry(0.016, 16, 12),
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

  let sesionXR = null;
  let controladorActivo = null;
  let punteroXRActivo = false;
  let modoMaquetaPantalla = false;
  let autoGiroMaqueta = false;
  let anguloMaqueta = 0;
  let caidaActiva = null;

  function ajustarEscalaMaqueta(activar, esVisorXR = false) {
    const et = getEtapa();
    if (!et || !et.grupo) return;
    const g = et.grupo;
    const marco = et.marco || { ancho: 6, cy: 1.5 };

    if (activar) {
      if (g.parent !== rigMaqueta) rigMaqueta.add(g);
      if (esVisorXR) {
        const escala = ANCHO_MAQUETA_M / (marco.ancho || 6);
        rigMaqueta.scale.setScalar(escala);
        rigMaqueta.position.set(0, -0.28 - (marco.cy || 0) * escala, -0.65);
        pedestalGroup.visible = true;
        pedestalGroup.position.set(0, -0.02, -0.65);
      } else {
        // Modo Maqueta 3D interactiva en pantalla
        rigMaqueta.scale.setScalar(0.78);
        rigMaqueta.position.set(0, (marco.cy || 1) * 0.18, 0);
        rigMaqueta.rotation.set(0.14, anguloMaqueta, 0);
      }
    } else {
      if (g.parent !== scene) scene.add(g);
      rigMaqueta.scale.setScalar(1);
      rigMaqueta.position.set(0, 0, 0);
      rigMaqueta.rotation.set(0, 0, 0);
      pedestalGroup.visible = false;
      cursor3D.visible = false;
    }
    rigMaqueta.updateMatrixWorld(true);
  }

  function lanzarCaidaFisicaDemo() {
    const et = getEtapa();
    if (!et || !et.grupo) return;
    const g = et.grupo;
    const yBase = g.position.y;
    g.position.y = yBase + 1.4;
    caidaActiva = new CaidaFisica3D(g, yBase, () => {
      estado("¡Maqueta 3D encajada con física gravitatoria (9,8 m/s² + rebote)!", "status-ok", "xr-fisica-ok");
    });
    estado("Simulando caída física CaidaFisica3D (9,8 m/s²)...", "status-ok", "xr-fisica-run");
  }

  function mostrarDockMaqueta(mostrar) {
    let dock = document.getElementById("xr-maqueta-dock");
    if (!mostrar) {
      if (dock) dock.hidden = true;
      return;
    }
    if (!dock) {
      dock = document.createElement("aside");
      dock.id = "xr-maqueta-dock";
      dock.innerHTML = `
        <h4>
          <span>🥽 Maqueta 3D · XR Blocks v3.12</span>
          <button type="button" id="xr-dock-cerrar" style="background:rgba(255,255,255,0.1);color:#fff;border:none;padding:3px 8px;">✕</button>
        </h4>
        <div style="color:#a8a29e;font-size:11px;line-height:1.35;">
          Inspecciona el modelo 3D a escala de mesa (0,55 m), gíralo en 360° o aplica gravedad real.
        </div>
        <div class="dock-row">
          <span style="font-weight:600;">Giro 3D:</span>
          <input type="range" id="xr-dock-giro" min="-180" max="180" value="22">
          <button type="button" id="xr-dock-auto" style="background:rgba(56,189,248,0.2);color:#38bdf8;border:1px solid #38bdf8;">360° Auto</button>
        </div>
        <div class="dock-row" style="margin-top:10px;">
          <button type="button" id="xr-dock-fisica" class="principal" style="flex:1;">⚡ Caída Física (9,8 m/s²)</button>
          <a href="simulador-xr.html" style="padding:7px 10px;border-radius:9px;background:rgba(255,255,255,0.08);color:#faf7f2;text-decoration:none;font-weight:700;font-size:11px;border:1px solid rgba(255,255,255,0.15);">Laboratorio 5 Épocas →</a>
        </div>
      `;
      document.body.appendChild(dock);

      document.getElementById("xr-dock-cerrar").addEventListener("click", () => {
        modoMaquetaPantalla = false;
        autoGiroMaqueta = false;
        ajustarEscalaMaqueta(false, false);
        dock.hidden = true;
        estado("Vista estándar 1:1 restaurada.", "status-ok", "xr-off");
      });

      document.getElementById("xr-dock-giro").addEventListener("input", (e) => {
        autoGiroMaqueta = false;
        anguloMaqueta = (parseFloat(e.target.value) * Math.PI) / 180;
        if (modoMaquetaPantalla) {
          rigMaqueta.rotation.y = anguloMaqueta;
        }
      });

      document.getElementById("xr-dock-auto").addEventListener("click", () => {
        autoGiroMaqueta = !autoGiroMaqueta;
      });

      document.getElementById("xr-dock-fisica").addEventListener("click", () => {
        lanzarCaidaFisicaDemo();
      });
    }
    dock.hidden = false;
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
    // Cerrar portadas/modales si están abiertos
    const inicioModal = document.getElementById("inicio");
    const portadaModal = document.getElementById("portada");
    if (portadaModal && !portadaModal.hidden) portadaModal.hidden = true;
    if (inicioModal && !inicioModal.hidden) empezarTactil();

    // Comprobar si hay visor WebXR real conectado
    let soportaAR = false, soportaVR = false;
    if (navigator.xr) {
      soportaAR = await navigator.xr.isSessionSupported("immersive-ar").catch(() => false);
      soportaVR = !soportaAR && await navigator.xr.isSessionSupported("immersive-vr").catch(() => false);
    }

    if (!soportaAR && !soportaVR) {
      // Activar Modo Maqueta 3D Interactiva en pantalla
      modoMaquetaPantalla = true;
      anguloMaqueta = 0.38;
      ajustarEscalaMaqueta(true, false);
      mostrarDockMaqueta(true);
      lanzarCaidaFisicaDemo();
      return;
    }

    const modo = soportaAR ? "immersive-ar" : "immersive-vr";
    renderer.xr.enabled = true;
    sesionXR = await navigator.xr.requestSession(modo, {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "dom-overlay"],
      domOverlay: { root: document.body }
    });
    renderer.xr.setReferenceSpaceType("local");
    await renderer.xr.setSession(sesionXR);
    DEC.ocultar(soportaAR);
    ajustarEscalaMaqueta(true, true);
    estado("Maqueta 3D XR Blocks situada a 0,55 m frente a ti. Apunta y haz pinza.", "status-ok", "xr-ok");

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
      sesionXR = null;
      renderer.xr.enabled = false;
      DEC.ocultar(false);
      ajustarEscalaMaqueta(false, false);
    });
  }

  // 2. Añadir barra superior v3.12 XR Blocks en todas las pantallas
  if (!document.getElementById("xr-v312-topbar")) {
    const bar = document.createElement("div");
    bar.id = "xr-v312-topbar";
    bar.innerHTML = `
      <div class="xr-brand">
        <span>🏛️ Las Manos que Construyeron la Historia</span>
        <span class="xr-badge">✨ Diseño v3.12 · XR Blocks</span>
      </div>
      <div class="xr-actions">
        <button type="button" class="xr-top-btn xr-highlight" id="xr-top-activar">🥽 Activar Maqueta 3D (XR Blocks)</button>
        <a href="simulador-xr.html" class="xr-top-btn xr-gold">🧊 Simulador 3D (5 Épocas)</a>
        <a href="index.html#linea" class="xr-top-btn">📜 Línea del Tiempo</a>
      </div>
    `;
    document.body.prepend(bar);
    document.getElementById("xr-top-activar").addEventListener("click", () => {
      iniciar().catch((e) => empezarTactil("Modo Maqueta 3D activo: " + e.message));
    });
  }

  // 3. Añadir botón destacado en el modal #inicio
  const contenedor = document.querySelector("#inicio .botones");
  const btnTactil = document.getElementById("btn-tactil");
  if (contenedor && btnTactil && !document.getElementById("btn-xrblocks")) {
    const b = document.createElement("button");
    b.type = "button";
    b.id = "btn-xrblocks";
    b.innerHTML = "🥽 Modo Realidad Mixta · Maqueta 3D (XR Blocks v3.12)";
    b.addEventListener("click", () => iniciar().catch((e) => empezarTactil("Error XR: " + e.message)));
    contenedor.insertBefore(b, btnTactil.nextSibling);
  }

  // 4. Añadir tarjeta destacada v3.12 en #portada si existe
  const portadaTarjeta = document.querySelector("#portada .tarjeta");
  if (portadaTarjeta && !document.getElementById("banner-portada-xr")) {
    const banner = document.createElement("div");
    banner.id = "banner-portada-xr";
    banner.style.cssText = "margin:12px 0;padding:14px 16px;border-radius:14px;background:linear-gradient(135deg,rgba(56,189,248,0.15),rgba(194,132,58,0.2));border:1px solid rgba(56,189,248,0.45);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;";
    banner.innerHTML = `
      <div>
        <div style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.06em;">✨ Novedad Edición v3.12 · Pruebas-ARX</div>
        <div style="font-size:14px;font-weight:700;color:#faf7f2;margin-top:2px;">Laboratorio de Maquetas 3D Interactivas y Física Gravitatoria</div>
      </div>
      <a href="simulador-xr.html" class="btn-xrblocks-cta" style="text-decoration:none;font-size:12px;padding:9px 14px;">🥽 Abrir Simulador 3D XR →</a>
    `;
    const h3Linea = portadaTarjeta.querySelector("h3");
    if (h3Linea) portadaTarjeta.insertBefore(banner, h3Linea);
    else portadaTarjeta.appendChild(banner);
  }

  // Bucle autónomo para física CaidaFisica3D y rotación de Maqueta 3D
  let tAnterior = performance.now();
  function bucleXR(ahora) {
    requestAnimationFrame(bucleXR);
    const dt = Math.min((ahora - tAnterior) / 1000, 0.1);
    tAnterior = ahora;

    if (caidaActiva && !caidaActiva.terminado) {
      caidaActiva.step(dt);
    }
    if (modoMaquetaPantalla && autoGiroMaqueta) {
      anguloMaqueta += dt * 0.65;
      rigMaqueta.rotation.y = anguloMaqueta;
    }
    if (sesionXR && controladorActivo) {
      const pt = rayoAPantalla(controladorActivo), et = getEtapa();
      if (pt && et) {
        if (punteroXRActivo) et.move(pt.x, pt.y);
        else if (et.hover) et.hover(pt.x, pt.y);
      }
    }
  }
  requestAnimationFrame(bucleXR);

  return {
    tick() {},
    alCambiarEtapa() {
      if (sesionXR) ajustarEscalaMaqueta(true, true);
      else if (modoMaquetaPantalla) ajustarEscalaMaqueta(true, false);
    }
  };
}
