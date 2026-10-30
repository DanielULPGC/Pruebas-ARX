// Adaptador XR Blocks / WebXR para «Las manos que construyeron la historia» (Pruebas-ARX)
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
