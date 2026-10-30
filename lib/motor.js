// lib/motor.js · Las manos que construyeron la historia · v3.12
// Motor común de los cinco capítulos: utilidades y DOM, motor gráfico Three.js, decorados, materiales,
// ayudas de juego, sonido, encuadre, proyección y etiquetas. Extraído sin cambios de la v3.11.4, salvo:
//  · la coordenada de pantalla de enPlano, pixelesPorMetro y las etiquetas se calcula en el marco del
//    contenedor de la etapa (idéntica en pantalla; correcta dentro de la maqueta de realidad mixta);
//  · encuadrar() no actúa mientras hay una sesión de realidad mixta;
//  · hechas, modo, guardarRegistro y pDown, que declara cada capítulo, se leen a través de «capitulo»;
//  · fijarMotor(), enlazarCapitulo() y los ganchos del modo de realidad mixta, al final del archivo.
// Los capítulos importan desde aquí lo que antes tenían repetido en su propio <script>.
import * as THREE from "three";

// =====================================================================
// 0. UTILIDADES Y DOM
// =====================================================================
const $ = (id) => document.getElementById(id);
const escena = $("escena"), video = $("video"), lienzo3d = $("lienzo3d"), lienzoManos = $("lienzoManos");
const ctxM = lienzoManos.getContext("2d");
const estadoTxt = $("estado"), metricasDiv = $("metricas"), notaDiv = $("nota"), alternativos = $("alternativos");
const fmt = (n, d = 2) => n.toFixed(d).replace(".", ",");
const fmtSigno = (n, d = 1) => (n > 0.0499 ? "+" : n < -0.0499 ? "−" : "") + fmt(Math.abs(n), d);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MOV_REDUCIDO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const DOCENTE = new URLSearchParams(location.search).has("docente");

let categoriaPrevia = "";
let actual = -1, etapa = null, captura = false;
function estado(texto, clase = "status-warn", categoria = texto) {
  cambiosJuego++; ultimaActividad = performance.now();
  if (categoria === categoriaPrevia) return;
  categoriaPrevia = categoria;
  estadoTxt.textContent = texto;
  estadoTxt.className = clase;
  retroalimentar(clase, categoria);
}
function metricas(lineas) {
  while (metricasDiv.children.length < lineas.length) metricasDiv.appendChild(document.createElement("div"));
  while (metricasDiv.children.length > lineas.length) metricasDiv.lastChild.remove();
  lineas.forEach((t, i) => { if (metricasDiv.children[i].textContent !== t) { metricasDiv.children[i].textContent = t; cambiosJuego++; } });
}

// ---------------------------------------------------------------------
// Retroalimentación de juego (v3.8): sonido opcional, pistas graduadas, anillos de agarre,
// aviso de pinza fallida y celebración al completar. Sin archivos externos: el sonido se sintetiza.
// ---------------------------------------------------------------------
const CLAVE_SONIDO = "lasManos.sonido";
let sonidoActivo = true;
try { sonidoActivo = localStorage.getItem(CLAVE_SONIDO) !== "no"; } catch (e) {}
let audioCtx = null;
const ultimoSonido = {};
let cambiosJuego = 0;        // cambios visibles (mensajes y métricas): indican si una pinza ha tenido efecto
let registro = null;         // tiempo, intentos fallidos y pistas por etapa (se crea en la sección 8)
let erroresEtapa = 0, ultimoError = 0, ultimaActividad = performance.now(), fallosSeguidos = 0, anillosPantalla = [];
const nivelPista = [], efectos = [];
const lienzoEf = $("lienzoEfectos"), ctxE = lienzoEf.getContext("2d");
function prepararAudio() {
  try {
    if (!audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; audioCtx = new AC(); }
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) { return null; }
  return audioCtx;
}
// El navegador solo deja sonar después de un gesto: se prepara el audio con el primer toque o tecla
["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, () => { if (sonidoActivo) prepararAudio(); }, { capture: true, passive: true }));
function sonar(tipo) {
  if (!sonidoActivo) return;
  const ahora = performance.now();
  if (ahora - (ultimoSonido[tipo] || 0) < (tipo === "error" ? 1200 : 140)) return;
  ultimoSonido[tipo] = ahora;
  const ac = prepararAudio(); if (!ac || ac.state !== "running") return;
  try {
    const t0 = ac.currentTime + 0.01;
    const nota = (f, ini, dur, forma = "sine", vol = 0.07, f2 = f) => {
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = forma; o.frequency.setValueAtTime(f, t0 + ini);
      if (f2 !== f) o.frequency.exponentialRampToValueAtTime(f2, t0 + ini + dur);
      gn.gain.setValueAtTime(0.0001, t0 + ini); gn.gain.exponentialRampToValueAtTime(vol, t0 + ini + 0.015); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + ini + dur);
      o.connect(gn).connect(ac.destination); o.start(t0 + ini); o.stop(t0 + ini + dur + 0.03);
    };
    if (tipo === "agarre") nota(520, 0, 0.06, "triangle", 0.045);
    else if (tipo === "ok") { nota(660, 0, 0.12); nota(880, 0.09, 0.18); }
    else if (tipo === "error") nota(240, 0, 0.24, "triangle", 0.06, 170);
    else if (tipo === "fin") [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nota(f, i * 0.1, i === 3 ? 0.5 : 0.16, "triangle", 0.065));
  } catch (e) {}
}
function retroalimentar(clase, categoria) {
  const mal = /-mal/.test(categoria) || clase === "status-error";
  // Durante un arrastre los avisos cambian sin parar: solo cuentan como error las respuestas y las acciones sueltas
  if (mal && !captura) {
    sonar("error");
    if (registro && actual >= 0 && !capitulo.hechas()[actual]) { registro[actual].errores++; capitulo.guardarRegistro(); }
    const ahora = performance.now();
    if (ahora - ultimoError > 2500) { ultimoError = ahora; if (++erroresEtapa >= 2) $("btn-pista").classList.add("llamativa"); }
  } else if (clase === "status-ok" && !categoria.startsWith("completa-") && !mal) sonar("ok");
}
function verPista(texto) { const c = $("pista"); c.hidden = false; c.textContent = texto; }
function mostrarPista() {
  if (!etapa) return;
  // Las pistas pueden ser una lista fija o una función que devuelve las de la fase actual del reto
  const ps = typeof etapa.pistas === "function" ? etapa.pistas() : etapa.pistas;
  const lista = ps && ps.length ? ps : [etapa.nota];
  const n = nivelPista[actual] || 0, k = n % lista.length;
  nivelPista[actual] = n + 1;
  if (registro && !capitulo.hechas()[actual]) { registro[actual].pistas++; capitulo.guardarRegistro(); }
  verPista("Pista " + (k + 1) + " de " + lista.length + ": " + lista[k]);
  $("btn-pista").classList.remove("llamativa");
  $("btn-pista").textContent = lista.length > 1 ? "Otra pista" : "Pista";
  erroresEtapa = 0; ultimaActividad = performance.now();
}
function reiniciarAyudas() {
  $("pista").hidden = true; $("btn-pista").classList.remove("llamativa"); $("btn-pista").textContent = "Pista";
  $("btn-siguiente").classList.remove("llamativa");
  erroresEtapa = 0; fallosSeguidos = 0; ultimaActividad = performance.now();
}
// Una pinza (o un toque) que no ha tenido ningún efecto deja una onda naranja; tres seguidas, una ayuda
function intentarAgarre(x, y) {
  const antes = cambiosJuego, ok = capitulo.pDown(x, y);
  if (ok) { onda(x, y, "ok"); sonar("agarre"); fallosSeguidos = 0; }
  else if (cambiosJuego === antes) {
    onda(x, y, "fallo");
    if (++fallosSeguidos >= 3) {
      fallosSeguidos = 0;
      verPista(anillosPantalla.length ? "Los anillos azules marcan lo que puedes mover. " + (capitulo.modo() === "manos" ? "Acerca allí la pinza: cuando el círculo de tus dedos se ponga verde, júntalos." : "Toca justo dentro de un anillo y arrastra.")
        : (capitulo.modo() === "manos" ? "Junta el pulgar y el índice justo encima de lo que quieras mover o tocar." : "Toca justo encima de lo que quieras mover o tocar."));
    }
  } else fallosSeguidos = 0;
  return ok;
}
function onda(x, y, tipo) { efectos.push({ tipo, x, y, t: 0, dur: tipo === "ok" ? 0.35 : 0.5 }); }
function celebrar(i) {
  efectos.push({ tipo: "rotulo", texto: "¡Etapa " + (i + 1) + " completada!", t: 0, dur: 1.8 });
  if (MOV_REDUCIDO) return;
  const W = escena.clientWidth, COL = ["#c2843a", "#4ade80", "#38bdf8", "#facc15", "#f87171", "#faf7f2"];
  for (let k = 0; k < 90; k++) efectos.push({ tipo: "confeti", x: W * (0.2 + Math.random() * 0.6), y: escena.clientHeight * 0.32, vx: (Math.random() - 0.5) * 520, vy: -220 - Math.random() * 380, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, c: COL[k % COL.length], t: 0, dur: 1.6 + Math.random() * 0.5 });
}
function calcularAnillos() {
  anillosPantalla = [];
  if (!etapa || !etapa.agarres || !capitulo.modo() || captura || capitulo.hechas()[actual]) return;
  if (document.querySelector(".panel:not([hidden])")) return;
  let lista = [];
  try { lista = etapa.agarres() || []; } catch (e) { lista = []; }
  for (const p of lista) { v3.set(p[0], p[1], p[2] || 0); etapa.grupo.localToWorld(v3); anillosPantalla.push(aPantalla(v3.x, v3.y, v3.z)); }
}
let efectosPintados = false;
function pintarEfectos(dt) {
  const W = escena.clientWidth, H = escena.clientHeight;
  calcularAnillos();
  if (!efectos.length && !anillosPantalla.length) { if (efectosPintados) { ctxE.clearRect(0, 0, W, H); efectosPintados = false; } return; }
  efectosPintados = true; ctxE.clearRect(0, 0, W, H);
  const t = performance.now() / 1000;
  ctxE.lineCap = "round";
  for (const a of anillosPantalla) {
    const r = MOV_REDUCIDO ? 22 : 20 + 3 * Math.sin(t * 4);
    ctxE.beginPath(); ctxE.arc(a.x, a.y, r, 0, Math.PI * 2);
    ctxE.fillStyle = "rgba(56,189,248,.12)"; ctxE.fill();
    ctxE.setLineDash([7, 6]); ctxE.lineDashOffset = MOV_REDUCIDO ? 0 : -t * 18; ctxE.lineWidth = 3; ctxE.strokeStyle = "rgba(56,189,248,.95)"; ctxE.stroke();
    ctxE.setLineDash([]);
  }
  for (let i = efectos.length - 1; i >= 0; i--) {
    const e = efectos[i]; e.t += dt; const f = Math.min(1, e.t / e.dur);
    if (e.tipo === "ok" || e.tipo === "fallo") {
      const r = MOV_REDUCIDO ? 26 : 14 + f * 30;
      ctxE.globalAlpha = 1 - f; ctxE.lineWidth = 4; ctxE.strokeStyle = e.tipo === "ok" ? "#4ade80" : "#fb923c";
      if (e.tipo === "fallo") ctxE.setLineDash([5, 6]);
      ctxE.beginPath(); ctxE.arc(e.x, e.y, r, 0, Math.PI * 2); ctxE.stroke(); ctxE.setLineDash([]);
    } else if (e.tipo === "confeti") {
      e.vy += 900 * dt; e.x += e.vx * dt; e.y += e.vy * dt; e.r += e.vr * dt;
      ctxE.globalAlpha = 1 - Math.max(0, (f - 0.7) / 0.3);
      ctxE.save(); ctxE.translate(e.x, e.y); ctxE.rotate(e.r); ctxE.fillStyle = e.c; ctxE.fillRect(-5, -3, 10, 6); ctxE.restore();
    } else if (e.tipo === "rotulo") {
      ctxE.globalAlpha = f < 0.15 ? f / 0.15 : f > 0.75 ? (1 - f) / 0.25 : 1;
      const fs = Math.round(Math.min(W / 14, 46));
      ctxE.font = "800 " + fs + "px system-ui, sans-serif"; ctxE.textAlign = "center"; ctxE.textBaseline = "middle";
      ctxE.lineWidth = 6; ctxE.strokeStyle = "rgba(28,25,23,.85)"; ctxE.strokeText(e.texto, W / 2, H * 0.42);
      ctxE.fillStyle = "#4ade80"; ctxE.fillText(e.texto, W / 2, H * 0.42);
    }
    ctxE.globalAlpha = 1;
    if (e.t >= e.dur) efectos.splice(i, 1);
  }
}
// Si pasan 45 s sin ningún cambio en una etapa sin terminar, el botón «Pista» llama la atención
function revisarInactividad() {
  if (!etapa || !capitulo.modo() || capitulo.hechas()[actual]) return;
  const ahora = performance.now();
  if (document.querySelector("[role=dialog]:not([hidden])")) { ultimaActividad = ahora; return; }
  if (ahora - ultimaActividad > 45000) $("btn-pista").classList.add("llamativa");
}

// =====================================================================
// 1. THREE.JS: MOTOR GRÁFICO (calidad alta con degradación automática)
// =====================================================================
const CALIDAD_LIGERA = new URLSearchParams(location.search).get("calidad") === "ligera";
const renderer = new THREE.WebGLRenderer({ canvas: lienzo3d, alpha: true, antialias: true, powerPreference: "high-performance" });
let ratioMax = CALIDAD_LIGERA ? 1.25 : 2;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, ratioMax));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = !CALIDAD_LIGERA;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
// Iluminación: cielo y suelo, sol con sombras suaves y una luz de relleno
const hemi = new THREE.HemisphereLight(0xe8f0f6, 0x7a6448, 0.55);
const luz = new THREE.DirectionalLight(0xfff0dc, 2.4);
luz.position.set(3, 6, 5);
luz.castShadow = true;
luz.shadow.mapSize.set(CALIDAD_LIGERA ? 1024 : 2048, CALIDAD_LIGERA ? 1024 : 2048);
luz.shadow.bias = -0.0004; luz.shadow.normalBias = 0.025; luz.shadow.radius = 4;
const relleno = new THREE.DirectionalLight(0xd6e4ff, 0.6);
relleno.position.set(-5, 3, 3);
scene.add(hemi, luz, luz.target, relleno);
// Entorno para reflejos (metales y vidriados): cielo degradado generado en el propio navegador, sin archivos externos
(() => {
  const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 48, 24), col = [], c = new THREE.Color();
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / 10;
    c.set(t > 0 ? 0xdbe8f2 : 0x8a7457).lerp(new THREE.Color(t > 0 ? 0x9cc3e0 : 0x4a3b2a), Math.abs(t));
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  es.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  panel.position.set(4, 6, 4); panel.lookAt(0, 0, 0); es.add(panel);
  scene.environment = pm.fromScene(es, 0.04).texture;
  pm.dispose();
})();

// ---------- Texturas procedurales (sin imágenes externas; deterministas y repetibles sin costuras) ----------
const TX = (() => {
  const cache = {};
  function prng(s) { return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
  function capa(periodo, sem) {
    const azar = prng(sem), g = new Float32Array(periodo * periodo);
    for (let i = 0; i < g.length; i++) g[i] = azar();
    return (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const P = periodo, a = g[((yi % P + P) % P) * P + ((xi % P + P) % P)], b = g[((yi % P + P) % P) * P + (((xi + 1) % P + P) % P)];
      const cc = g[(((yi + 1) % P + P) % P) * P + ((xi % P + P) % P)], d = g[(((yi + 1) % P + P) % P) * P + (((xi + 1) % P + P) % P)];
      return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v;
    };
  }
  function fbm(sem, base, oct) {
    const capas = Array.from({ length: oct }, (_, o) => ({ f: capa(base << o, sem + o * 101), p: base << o, w: 0.5 ** o }));
    const tot = capas.reduce((s, k) => s + k.w, 0);
    return (u, v) => { let s = 0; for (const k of capas) s += k.f(u * k.p, v * k.p) * k.w; return s / tot; };
  }
  // Genera color y relieve a la vez: fn(u, v) → [r, g, b, altura 0..1]
  function lienzo(nombre, T, fn) {
    const cc = document.createElement("canvas"); cc.width = cc.height = T;
    const cb = document.createElement("canvas"); cb.width = cb.height = T;
    const ic = cc.getContext("2d").createImageData(T, T), ib = cb.getContext("2d").createImageData(T, T);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const [r, g, b, h] = fn(x / T, y / T), i = (y * T + x) * 4;
      ic.data[i] = r; ic.data[i + 1] = g; ic.data[i + 2] = b; ic.data[i + 3] = 255;
      const hh = Math.max(0, Math.min(255, h * 255)); ib.data[i] = ib.data[i + 1] = ib.data[i + 2] = hh; ib.data[i + 3] = 255;
    }
    cc.getContext("2d").putImageData(ic, 0, 0); cb.getContext("2d").putImageData(ib, 0, 0);
    const map = new THREE.CanvasTexture(cc), bump = new THREE.CanvasTexture(cb);
    map.colorSpace = THREE.SRGBColorSpace;
    for (const t of [map, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO; }
    return { map, bump, canvas: cc };
  }
  const mezcla = (a, b, t) => a + (b - a) * t;
  const recetas = {
    // Granito (acueducto de Segovia) y piedra de sillería en general
    granito: () => { const n = fbm(11, 8, 5), m = fbm(29, 32, 3), az = prng(5); return (u, v) => { const k = n(u, v), s = m(u, v), p = az(); const g = 150 + (k - 0.5) * 70 + (s - 0.5) * 40 + (p > 0.985 ? -70 : p < 0.02 ? 45 : 0); return [g + 6, g + 2, g - 6, 0.35 + k * 0.4 + (s - 0.5) * 0.3]; }; },
    caliza: () => { const n = fbm(41, 4, 6), m = fbm(7, 24, 3); return (u, v) => { const k = n(u, v), s = m(u, v); return [205 + (k - 0.5) * 40, 196 + (k - 0.5) * 38, 172 + (k - 0.5) * 30 - s * 10, 0.4 + k * 0.45 + s * 0.15]; }; },
    tierra: () => { const n = fbm(3, 6, 6), m = fbm(17, 40, 2), az = prng(9); return (u, v) => { const k = n(u, v), s = m(u, v), p = az(); const g = (k - 0.5) * 60; let c = [128 + g, 102 + g * 0.9, 72 + g * 0.7]; if (p > 0.993) c = [175, 165, 150]; return [c[0] - s * 18, c[1] - s * 16, c[2] - s * 12, k * 0.7 + s * 0.3 + (p > 0.993 ? 0.3 : 0)]; }; },
    madera: () => { const n = fbm(23, 4, 4), f = fbm(61, 16, 2); return (u, v) => { const w = Math.sin((v * 22 + n(u, v) * 7) * Math.PI * 2) * 0.5 + 0.5, k = f(u, v); return [mezcla(120, 160, w) - k * 25, mezcla(78, 104, w) - k * 18, mezcla(42, 58, w) - k * 12, w * 0.6 + k * 0.4]; }; },
    barro: () => { const n = fbm(13, 6, 5), az = prng(21); return (u, v) => { const k = n(u, v), p = az(); return [168 + (k - 0.5) * 50, 110 + (k - 0.5) * 36, 72 + (k - 0.5) * 26, 0.5 + (k - 0.5) * 0.6 - (p > 0.99 ? 0.35 : 0)]; }; },
    silex: () => { const n = fbm(31, 3, 6), m = fbm(77, 10, 3); return (u, v) => { const k = n(u, v), s = m(u, v), b = Math.abs(Math.sin((k * 9 + s * 2) * Math.PI)); return [118 + b * 38 + (s - 0.5) * 30, 112 + b * 34 + (s - 0.5) * 26, 100 + b * 28 + (s - 0.5) * 20, b * 0.6 + s * 0.4]; }; },
    laton: () => { const n = fbm(5, 64, 2), m = fbm(91, 4, 4); return (u, v) => { const k = n(u * 0.05, v), s = m(u, v); return [196 + (k - 0.5) * 40 - s * 30, 152 + (k - 0.5) * 30 - s * 26, 70 + (k - 0.5) * 18 - s * 14, k * 0.5 + s * 0.2]; }; },
    estuco: () => { const n = fbm(19, 8, 5); return (u, v) => { const k = n(u, v); return [238 + (k - 0.5) * 18, 230 + (k - 0.5) * 18, 214 + (k - 0.5) * 16, 0.5 + (k - 0.5) * 0.5]; }; },
    vidriado: () => { const n = fbm(47, 6, 4); return (u, v) => { const k = n(u, v); return [225 + (k - 0.5) * 50, 225 + (k - 0.5) * 50, 225 + (k - 0.5) * 50, 0.5 + (k - 0.5) * 0.2]; }; },
    pergamino: () => { const n = fbm(37, 4, 6), m = fbm(53, 20, 3); return (u, v) => { const k = n(u, v), s = m(u, v), e = Math.hypot(u - 0.5, v - 0.5); return [236 - k * 34 - e * 40, 216 - k * 34 - e * 46, 172 - k * 34 - e * 52 - s * 10, 0.5 + (k - 0.5) * 0.3]; }; }
  };
  function textura(nombre, T = 512) {
    if (!cache[nombre]) cache[nombre] = lienzo(nombre, T, recetas[nombre]());
    return cache[nombre];
  }
  // Material PBR texturizado: color multiplica la textura (permite tintar una misma piedra)
  function mat(nombre, o = {}) {
    const t = textura(nombre), rep = o.rep || 1;
    const map = t.map.clone(), bump = t.bump.clone();
    for (const x of [map, bump]) { x.repeat.set(rep, rep); x.needsUpdate = true; }
    const Cls = o.fisico ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
    const m = new Cls({ map, bumpMap: bump, bumpScale: o.relieve ?? 2, color: o.color ?? 0xffffff, roughness: o.rugosidad ?? 0.85, metalness: o.metal ?? 0, ...(o.extra || {}) });
    return m;
  }
  // Fondo procedural para lienzos 2D (paredes, mapas, sellos): dibuja la textura sobre un contexto existente
  function pintarFondo(ctx, nombre, W, H, alfa = 1) {
    const t = textura(nombre); ctx.save(); ctx.globalAlpha = alfa;
    for (let y = 0; y < H; y += t.canvas.height) for (let x = 0; x < W; x += t.canvas.width) ctx.drawImage(t.canvas, x, y);
    ctx.restore();
  }
  return { mat, textura, pintarFondo };
})();
// Ajuste común de las texturas dibujadas en lienzos (mayor nitidez en ángulos rasantes)
function nitida(t) { t.anisotropy = ANISO; t.colorSpace = THREE.SRGBColorSpace; return t; }

const M = {
  piedra: TX.mat("granito", { color: 0xe4ddd2, rugosidad: 0.82, relieve: 2.5 }),
  seleccion: TX.mat("granito", { color: 0xf6cf3c, rugosidad: 0.6, relieve: 2 }),
  correcto: TX.mat("granito", { color: 0x7fe0a0, rugosidad: 0.6, relieve: 2 }),
  canal: new THREE.MeshPhysicalMaterial({ color: 0x1f7fbf, roughness: 0.18, metalness: 0, clearcoat: 0.6 }),
  suelo: TX.mat("tierra", { color: 0xffffff, rugosidad: 1, relieve: 3, rep: 2, extra: { transparent: true, opacity: 0.94 } }),
  tierra: TX.mat("tierra", { color: 0xf2e2c8, rugosidad: 1, relieve: 3, rep: 2 }),
  madera: TX.mat("madera", { color: 0xffffff, rugosidad: 0.7, relieve: 1.5 }),
  aguaM: new THREE.MeshPhysicalMaterial({ color: 0x7dd3fc, roughness: 0.05, transparent: true, opacity: 0.8, clearcoat: 1 }),
  fantasma: new THREE.LineBasicMaterial({ color: 0x1c1917, transparent: true, opacity: 0.5 }),
  cota: new THREE.LineBasicMaterial({ color: 0xc2843a }),
  lineaAgua: new THREE.LineBasicMaterial({ color: 0x0284c7 }),
  oscuro: new THREE.LineBasicMaterial({ color: 0x1c1917 })
};
// Cajas con aristas biseladas (la luz dibuja los cantos, como en la piedra labrada)
function geoCaja(w, h, d) {
  const b = Math.min(0.03, 0.12 * Math.min(w, h, d)), x = w / 2 - b, y = h / 2 - b, rc = Math.min(b, x * 0.9, y * 0.9);
  const s = new THREE.Shape();
  s.moveTo(-x + rc, -y); s.lineTo(x - rc, -y); s.absarc(x - rc, -y + rc, rc, -Math.PI / 2, 0); s.lineTo(x, y - rc); s.absarc(x - rc, y - rc, rc, 0, Math.PI / 2);
  s.lineTo(-x + rc, y); s.absarc(-x + rc, y - rc, rc, Math.PI / 2, Math.PI); s.lineTo(-x, -y + rc); s.absarc(-x + rc, -y + rc, rc, Math.PI, Math.PI * 1.5);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0005, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 3 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return g;
}
const caja = (w, h, d, mat) => new THREE.Mesh(geoCaja(w, h, d), mat);
// Trazos: tubos con grosor real en lugar de líneas de 1 píxel
const matTrazo = new WeakMap();
function aMalla(mat) {
  if (!mat.isLineBasicMaterial) return mat;
  if (!matTrazo.has(mat)) matTrazo.set(mat, new THREE.MeshBasicMaterial({ color: mat.color, transparent: mat.transparent, opacity: mat.opacity, depthTest: mat.depthTest, depthWrite: !mat.transparent, toneMapped: false }));
  return matTrazo.get(mat);
}
function linea(puntos, mat, grosor = 0.014) {
  const v = puntos.map((p) => new THREE.Vector3(p[0], p[1], p[2] || 0));
  const camino = new THREE.CurvePath();
  for (let i = 1; i < v.length; i++) if (v[i].distanceToSquared(v[i - 1]) > 1e-10) camino.add(new THREE.LineCurve3(v[i - 1], v[i]));
  if (!camino.curves.length) return new THREE.Line(new THREE.BufferGeometry().setFromPoints(v), mat);
  return new THREE.Mesh(new THREE.TubeGeometry(camino, Math.max(2, camino.curves.length * 3), grosor, 6, false), aMalla(mat));
}
function lineaFina(puntos, mat) { return new THREE.Line(new THREE.BufferGeometry().setFromPoints(puntos.map((p) => new THREE.Vector3(p[0], p[1], p[2] || 0))), mat); }
function liberar(obj) { obj.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
function suelo(ancho, x = 0) { const s = caja(ancho, 0.1, 2, M.suelo); s.position.set(x, -0.05, 0); return s; }
// Sombras: todo lo sólido proyecta y recibe; los trazos, etiquetas y vidrios no
function prepararSombras(raiz) {
  raiz.traverse((o) => {
    if (!o.isMesh || o.userData.sinSombra !== undefined) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    const solido = m && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) && !(m.transparent && m.opacity < 0.6) && m.depthTest !== false;
    o.castShadow = o.receiveShadow = !!solido; o.userData.sinSombra = !solido;
  });
}
// ---------- Decorados: cada etapa tiene su contexto histórico y geográfico ----------
// Telón pintado en el propio navegador (sin imágenes externas) + suelo que se pierde en la distancia con niebla,
// y una iluminación propia de cada lugar. Se oculta cuando se muestra la imagen real de la cámara.
const DEC = (() => {
  const W = CALIDAD_LIGERA ? 1024 : 2048, H = W / 2, k = H / 1024, ZB = 24;
  const prng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  function ruido1(sem) { const az = prng(sem), P = 512, gg = Float32Array.from({ length: P }, az); return (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return gg[((i % P) + P) % P] * (1 - u) + gg[(((i + 1) % P) + P) % P] * u; }; }
  function fbm1(sem, oct = 5) { const L = Array.from({ length: oct }, (_, o) => ruido1(sem + o * 31)); return (x) => { let s = 0, w = 1, t = 0; for (let o = 0; o < oct; o++) { s += L[o](x * 2 ** o) * w; t += w; w *= 0.5; } return s / t; }; }
  const rgba = (hex, a) => { const c = new THREE.Color(hex); return "rgba(" + Math.round(c.r * 255) + "," + Math.round(c.g * 255) + "," + Math.round(c.b * 255) + "," + a + ")"; };
  const mezcla = (a, b, t) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  function cielo(c, paradas) { const gr = c.createLinearGradient(0, 0, 0, H); paradas.forEach(([p, col]) => gr.addColorStop(p, col)); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
  function halo(c, x, y, r, col, a = 1) { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); c.fillStyle = gr; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
  function banda(c, y0, y1, col, a0, a1) { const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, rgba(col, a0)); gr.addColorStop(1, rgba(col, a1)); c.fillStyle = gr; c.fillRect(0, y0, W, y1 - y0); }
  // Perfil de montañas: devuelve la altura de la cresta para poder apoyar cosas encima
  function sierra(c, { base, amp, col, sem, esc = 3, oct = 5, luz = null, picudo = 1 }) {
    const n = fbm1(sem, oct), cresta = (x) => base - amp * n((x / W) * esc) ** picudo;
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 2) c.lineTo(x, cresta(x));
    c.lineTo(W, H); c.closePath(); c.fill();
    if (luz) {                                    // ladera iluminada: degradado desde la cresta
      c.save(); c.clip(); const gr = c.createLinearGradient(0, base - amp, 0, base + amp * 0.3); gr.addColorStop(0, rgba(luz, 0.55)); gr.addColorStop(1, rgba(luz, 0)); c.fillStyle = gr; c.fillRect(0, 0, W, H); c.restore();
    }
    return cresta;
  }
  function nubes(c, sem, n, y0, y1, col = 0xffffff, a = 0.92, tam = 1) {
    const az = prng(sem);
    for (let i = 0; i < n; i++) {
      const s0 = (40 + az() * 70) * k * tam, ancho = s0 * (2.2 + az() * 2.4), cx = az() * W, base = y0 + az() * (y1 - y0);
      const ow = Math.ceil(ancho * 1.5), oh = Math.ceil(s0 * 2), oc = document.createElement("canvas"); oc.width = ow; oc.height = oh;
      const o = oc.getContext("2d"), bx = ow / 2, by = oh * 0.82;
      for (let j = 0; j < 18; j++) {
        const dx = (az() - 0.5) * ancho, f = 1 - Math.abs(dx) / ancho, r = s0 * (0.3 + az() * 0.4) * (0.45 + f), px = bx + dx, py = by - r * (0.35 + az() * 0.45) - s0 * 0.3 * f;
        const gr = o.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.62, rgba(col, a * 0.92)); gr.addColorStop(1, rgba(col, 0));
        o.fillStyle = gr; o.beginPath(); o.arc(px, py, r, 0, Math.PI * 2); o.fill();
      }
      o.globalCompositeOperation = "destination-out"; const corte = o.createLinearGradient(0, by - s0 * 0.08, 0, by + s0 * 0.12); corte.addColorStop(0, "rgba(0,0,0,0)"); corte.addColorStop(1, "rgba(0,0,0,1)"); o.fillStyle = corte; o.fillRect(0, by - s0 * 0.08, ow, oh);
      o.globalCompositeOperation = "source-atop"; const sombra = o.createLinearGradient(0, by - s0 * 1.1, 0, by); sombra.addColorStop(0, "rgba(255,255,255,0)"); sombra.addColorStop(1, "rgba(150,165,190,.55)"); o.fillStyle = sombra; o.fillRect(0, 0, ow, oh);
      const sol = o.createLinearGradient(0, 0, 0, by - s0 * 0.6); sol.addColorStop(0, "rgba(255,250,235,.35)"); sol.addColorStop(1, "rgba(255,250,235,0)"); o.fillStyle = sol; o.fillRect(0, 0, ow, oh);
      c.drawImage(oc, cx - bx, base - by);
    }
  }
  function bruma(c, y0, col, a = 1) { banda(c, y0, H, col, 0, a); }
  // --- Motivos ---
  function acacia(c, x, y, s, col) {
    c.strokeStyle = col; c.lineCap = "round"; c.lineWidth = s * 0.05;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - s * 0.03, y - s * 0.35, x, y - s * 0.5); c.stroke();
    c.lineWidth = s * 0.03;
    for (const d of [-1, 1]) { c.beginPath(); c.moveTo(x, y - s * 0.45); c.quadraticCurveTo(x + d * s * 0.2, y - s * 0.55, x + d * s * 0.35, y - s * 0.66); c.stroke(); }
    c.fillStyle = col;
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.ellipse(x + i * s * 0.11, y - s * 0.7 - Math.abs(i) * -s * 0.015, s * 0.2, s * 0.07, 0, 0, Math.PI * 2); c.fill(); }
  }
  function choza(c, x, y, s, pared, techo, sombra) {
    c.fillStyle = pared; c.beginPath(); c.moveTo(x - s * 0.5, y); c.lineTo(x - s * 0.48, y - s * 0.42); c.lineTo(x + s * 0.48, y - s * 0.42); c.lineTo(x + s * 0.5, y); c.closePath(); c.fill();
    c.fillStyle = sombra; c.fillRect(x + s * 0.12, y - s * 0.42, s * 0.37, s * 0.42);
    c.fillStyle = "#2b1d12"; c.beginPath(); c.moveTo(x - s * 0.1, y); c.lineTo(x - s * 0.1, y - s * 0.22); c.quadraticCurveTo(x, y - s * 0.3, x + s * 0.1, y - s * 0.22); c.lineTo(x + s * 0.1, y); c.fill();
    c.fillStyle = techo; c.beginPath(); c.moveTo(x - s * 0.66, y - s * 0.36); c.lineTo(x, y - s * 1.08); c.lineTo(x + s * 0.66, y - s * 0.36); c.quadraticCurveTo(x, y - s * 0.28, x - s * 0.66, y - s * 0.36); c.fill();
    c.strokeStyle = "rgba(60,40,20,.35)"; c.lineWidth = Math.max(1, s * 0.012);
    for (let i = -5; i <= 5; i++) { c.beginPath(); c.moveTo(x, y - s * 1.06); c.lineTo(x + i * s * 0.12, y - s * 0.34); c.stroke(); }
    c.fillStyle = "rgba(40,25,10,.25)"; c.beginPath(); c.moveTo(x, y - s * 1.08); c.lineTo(x + s * 0.66, y - s * 0.36); c.quadraticCurveTo(x + s * 0.3, y - s * 0.3, x + s * 0.12, y - s * 0.32); c.fill();
  }
  function humo(c, x, y, s, sem) { const az = prng(sem); for (let i = 0; i < 14; i++) halo(c, x + Math.sin(i * 0.5) * s * 0.25 + i * s * 0.06, y - i * s * 0.16, s * (0.08 + i * 0.022), 0xe8e4dc, 0.22 - i * 0.012 + az() * 0.02); }
  function palmera(c, x, y, s, col) {
    c.strokeStyle = col; c.lineCap = "round"; c.lineWidth = s * 0.045;
    const tx = x + s * 0.12, ty = y - s;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 0.02, y - s * 0.6, tx, ty); c.stroke();
    c.lineWidth = s * 0.02;
    for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.9 + (i % 2) * 0.1, L = s * (0.38 + (i % 3) * 0.05);
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - s * 0.05, tx + Math.cos(a) * L, ty + Math.sin(a) * L + s * 0.12); c.stroke(); }
  }
  function conifera(c, x, y, s, col) { c.fillStyle = col; for (let i = 0; i < 3; i++) { const yy = y - s * 0.25 - i * s * 0.22, ww = s * (0.3 - i * 0.07); c.beginPath(); c.moveTo(x - ww, yy); c.lineTo(x, yy - s * 0.42); c.lineTo(x + ww, yy); c.fill(); } c.fillRect(x - s * 0.025, y - s * 0.27, s * 0.05, s * 0.27); }
  function cardon(c, x, y, s, col) { c.fillStyle = col; const brazo = (bx, h) => { c.fillRect(bx - s * 0.035, y - h, s * 0.07, h); c.beginPath(); c.arc(bx, y - h, s * 0.035, 0, Math.PI * 2); c.fill(); }; for (let i = -3; i <= 3; i++) brazo(x + i * s * 0.08, s * (0.55 - Math.abs(i) * 0.08)); }
  // Casas y torres (dos tonos: cara al sol y cara en sombra)
  function casa(c, x, y, w, h, claro, oscuro, tejado) {
    c.fillStyle = claro; c.fillRect(x, y - h, w * 0.65, h); c.fillStyle = oscuro; c.fillRect(x + w * 0.65, y - h, w * 0.35, h);
    if (tejado) { c.fillStyle = tejado; c.beginPath(); c.moveTo(x - w * 0.05, y - h); c.lineTo(x + w * 0.5, y - h - w * 0.28); c.lineTo(x + w * 1.05, y - h); c.fill(); }
  }
  function torre(c, x, y, w, h, claro, oscuro, almenas = true) {
    casa(c, x, y, w, h, claro, oscuro, null);
    if (almenas) { c.fillStyle = claro; for (let i = 0; i < 4; i++) c.fillRect(x + i * w / 3.5, y - h - w * 0.14, w / 7, w * 0.14); }
    c.fillStyle = "rgba(30,25,20,.55)"; c.fillRect(x + w * 0.3, y - h * 0.7, w * 0.1, h * 0.12);
  }
  function iglesia(c, x, y, s, claro, oscuro) {
    casa(c, x, y, s * 1.6, s * 0.55, claro, oscuro, mezcla(oscuro, 0x5a4636, 0.3));
    torre(c, x + s * 1.25, y, s * 0.32, s * 1.2, claro, oscuro, false);
    c.fillStyle = oscuro; c.beginPath(); c.moveTo(x + s * 1.22, y - s * 1.2); c.lineTo(x + s * 1.41, y - s * 1.75); c.lineTo(x + s * 1.6, y - s * 1.2); c.fill();
  }
  function ciudad(c, x0, x1, yb, s, sem, claro, oscuro, tejado) {
    const az = prng(sem);
    for (let x = x0; x < x1; ) { const w = s * (0.5 + az() * 0.6), h = s * (0.35 + az() * 0.5); casa(c, x, yb - az() * s * 0.25, w, h, claro, oscuro, az() > 0.35 ? tejado : null); x += w * (0.7 + az() * 0.3); }
  }
  function muralla(c, x0, x1, y, h, claro, oscuro) {
    c.fillStyle = oscuro; c.fillRect(x0, y - h, x1 - x0, h); c.fillStyle = claro; c.fillRect(x0, y - h, x1 - x0, h * 0.45);
    for (let x = x0; x < x1; x += h * 0.5) c.fillRect(x, y - h - h * 0.22, h * 0.25, h * 0.22);
    for (let x = x0 + h; x < x1; x += h * 4) torre(c, x, y, h * 0.9, h * 1.6, claro, oscuro);
  }
  function arcoApuntado(c, x, y, w, h) { c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h + w * 0.86); c.arc(x + w / 2, y - h + w * 0.86, w, Math.PI, Math.PI * 1.333); c.arc(x - w / 2, y - h + w * 0.86, w, Math.PI * 1.667, 0); c.lineTo(x + w / 2, y); c.closePath(); }
  function velero(c, x, y, s, casco, vela) {
    c.fillStyle = casco; c.beginPath(); c.moveTo(x - s * 0.5, y - s * 0.12); c.lineTo(x + s * 0.55, y - s * 0.14); c.lineTo(x + s * 0.38, y); c.lineTo(x - s * 0.36, y); c.closePath(); c.fill();
    c.fillRect(x - s * 0.01, y - s * 0.95, s * 0.025, s * 0.83);
    c.fillStyle = vela; c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.82); c.quadraticCurveTo(x, y - s * 0.62, x + s * 0.32, y - s * 0.84); c.lineTo(x + s * 0.3, y - s * 0.3); c.quadraticCurveTo(x, y - s * 0.22, x - s * 0.28, y - s * 0.3); c.closePath(); c.fill();
    c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(x - s * 0.36, y + s * 0.01, s * 0.74, s * 0.05);
  }
  function texturaRoca(c, x0, y0, w, h, oscuro, a = 0.5) { c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip(); c.globalCompositeOperation = "multiply"; TX.pintarFondo(c, "caliza", W, H, a); c.restore(); }

  // --- Escenas ---
  const P = {
    // Paleolítico: valle del Rift (lago Turkana, Kenia), sabana con acacias por la mañana
    sabana(c) {
      cielo(c, [[0, "#7ea7cc"], [0.45, "#bcd2df"], [0.72, "#ecdcbc"], [1, "#e6d2a8"]]);
      halo(c, W * 0.22, H * 0.62, 420 * k, 0xfff1c9, 0.85); halo(c, W * 0.22, H * 0.62, 60 * k, 0xfffbea, 1);
      nubes(c, 4, 9, H * 0.12, H * 0.42, 0xffffff, 0.55);
      sierra(c, { base: H * 0.74, amp: 120 * k, col: "#a9a7b8", sem: 3, esc: 1.6, oct: 4, picudo: 0.6 });
      sierra(c, { base: H * 0.78, amp: 70 * k, col: "#b9ad9f", sem: 9, esc: 2.4, luz: 0xf5e2bf });
      c.fillStyle = "#c9d6d8"; c.fillRect(0, H * 0.79, W, H * 0.025); banda(c, H * 0.79, H * 0.815, 0xffffff, 0.35, 0);
      const llano = sierra(c, { base: H * 0.86, amp: 34 * k, col: "#cdb07a", sem: 21, esc: 4, luz: 0xf2d8a0 });
      const az = prng(7);
      for (let i = 0; i < 26; i++) { const x = az() * W, s = (40 + az() * 50) * k; acacia(c, x, llano(x) + 18 * k, s, mezcla(0x6f6a46, 0xb9a77a, 0.45)); }
      sierra(c, { base: H * 0.95, amp: 26 * k, col: "#d4ba86", sem: 33, esc: 6 });
      for (let i = 0; i < 8; i++) { const x = az() * W, s = (90 + az() * 60) * k; acacia(c, x, H * 0.965, s, mezcla(0x4d4a30, 0xcdb487, 0.25)); }
      bruma(c, H * 0.82, 0xd9c7a0, 1);
    },
    // Interior de una cueva: roca, estalactitas, la boca iluminada al fondo y luz cálida de antorcha
    cueva(c) {
      c.fillStyle = "#3a2c22"; c.fillRect(0, 0, W, H);
      // Boca de la cueva al fondo: contorno irregular, cielo y vegetación del exterior, y luz que entra y se difunde por la roca
      { const bx = W * 0.7, by = H * 0.74, bw = 150 * k, bh = 170 * k, nb = fbm1(57, 4);
        c.save(); c.beginPath();
        for (let i = 0; i <= 90; i++) { const a = (i / 90) * Math.PI * 2, f = 0.78 + 0.4 * nb(i / 9), yy = Math.sin(a) > 0 ? Math.min(1, Math.sin(a)) * 0.35 : Math.sin(a); c.lineTo(bx + Math.cos(a) * bw * f, by + yy * bh * f); }
        c.closePath(); c.save(); c.shadowColor = "rgba(0,0,0,.7)"; c.shadowBlur = 40 * k; c.strokeStyle = "#241a12"; c.lineWidth = 14 * k; c.stroke(); c.restore(); c.clip();
        const ex = c.createLinearGradient(0, by - bh * 1.2, 0, by + bh * 0.4); ex.addColorStop(0, "#8fb8d8"); ex.addColorStop(0.5, "#e6ecea"); ex.addColorStop(0.6, "#7f9460"); ex.addColorStop(1, "#4f6238");
        c.fillStyle = ex; c.fillRect(bx - bw * 2, by - bh * 2, bw * 4, bh * 3);
        c.restore();
        halo(c, bx, by - 20 * k, 330 * k, 0xf1e2c0, 0.45); halo(c, bx, by + 60 * k, 420 * k, 0xc9b28c, 0.3); }
      const borde = fbm1(41, 5);
      c.fillStyle = "#4a3828"; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H);
      for (let x = W; x >= 0; x -= 4) { const t = x / W, arco = Math.max(0, 1 - ((t - 0.55) / 0.48) ** 2), yb = H * (0.98 - 0.72 * arco) + (borde(t * 9) - 0.5) * 160 * k; c.lineTo(x, Math.min(H, yb)); }
      c.closePath(); c.fill();
      texturaRoca(c, 0, 0, W, H, 0x000000, 0.75);
      const az = prng(5);
      for (let i = 0; i < 40; i++) { const x = az() * W, L = (30 + az() * 140) * k, w = (8 + az() * 18) * k, yb = H * 0.08 + az() * H * 0.18; c.fillStyle = mezcla(0x3a2c22, 0x8a735c, az() * 0.5); c.beginPath(); c.moveTo(x - w, yb - 30 * k); c.lineTo(x, yb + L); c.lineTo(x + w, yb - 30 * k); c.fill(); }
      halo(c, W * 0.32, H * 0.72, 520 * k, 0xff9a3c, 0.32);
      banda(c, 0, H * 0.25, 0x120c08, 0.85, 0);
      bruma(c, H * 0.86, 0x3a2c22, 1);
    },
    // Neolítico: aldea de cabañas, campos de cereal y rebaños en un valle mediterráneo
    aldea(c) {
      cielo(c, [[0, "#86b3d6"], [0.55, "#cfe0e6"], [1, "#efe4c8"]]);
      nubes(c, 12, 10, H * 0.1, H * 0.45, 0xffffff, 0.7);
      sierra(c, { base: H * 0.7, amp: 150 * k, col: "#9fb0b8", sem: 13, esc: 2, oct: 5, picudo: 0.8 });
      const loma = sierra(c, { base: H * 0.78, amp: 90 * k, col: "#8e9a63", sem: 17, esc: 2.6, luz: 0xdfe0a0 });
      const az = prng(19);
      for (let i = 0; i < 9; i++) { const x0 = az() * W, w = (120 + az() * 220) * k, y = loma(x0) + 30 * k + az() * 40 * k; c.fillStyle = az() > 0.5 ? "rgba(214,190,110,.75)" : "rgba(170,160,80,.6)"; c.beginPath(); c.ellipse(x0, y, w, 14 * k, 0, 0, Math.PI * 2); c.fill(); }
      for (let i = 0; i < 30; i++) { const x = az() * W, s = (16 + az() * 22) * k; conifera(c, x, loma(x) + 8 * k, s * 1.4, "rgba(70,90,50,.85)"); }
      sierra(c, { base: H * 0.9, amp: 30 * k, col: "#c2b07c", sem: 23, esc: 4, luz: 0xf0dca0 });
      const casas = [[0.12, 1], [0.2, 0.8], [0.3, 1.1], [0.62, 0.9], [0.72, 1.2], [0.83, 0.85], [0.9, 1]];
      casas.forEach(([fx, f], i) => { const x = W * fx, s = 70 * k * f, y = H * 0.905 + (i % 2) * 10 * k; choza(c, x, y, s, "#b89a72", "#cdb27c", "rgba(90,60,30,.3)"); if (i === 2 || i === 4) humo(c, x + 4 * k, y - s * 1.1, s, i); });
      c.fillStyle = "#efe9de"; for (let i = 0; i < 14; i++) { const x = W * (0.4 + az() * 0.15), y = H * (0.9 + az() * 0.03); c.beginPath(); c.ellipse(x, y, 7 * k, 4 * k, 0, 0, Math.PI * 2); c.fill(); }
      bruma(c, H * 0.86, 0xd8cfae, 1);
    },
    // Gran Canaria: cumbres volcánicas, mar de nubes y el Teide en el horizonte, sobre el mar
    canarias(c) {
      cielo(c, [[0, "#5f9ccc"], [0.5, "#a9cbe0"], [0.8, "#e0e6e2"], [1, "#d6cdbd"]]);
      c.fillStyle = "#3f7aa0"; c.fillRect(0, H * 0.72, W, H * 0.28); banda(c, H * 0.72, H * 0.8, 0xbcd3df, 0.7, 0);
      c.fillStyle = "#8d97ad"; c.beginPath(); c.moveTo(W * 0.02, H * 0.72); c.lineTo(W * 0.15, H * 0.63); c.lineTo(W * 0.205, H * 0.565); c.lineTo(W * 0.215, H * 0.548); c.lineTo(W * 0.228, H * 0.566); c.lineTo(W * 0.28, H * 0.62); c.lineTo(W * 0.42, H * 0.72); c.fill();
      for (let i = 0; i < 3; i++) nubes(c, 31 + i, 14, H * 0.69, H * 0.71, 0xffffff, 0.9, 0.55);
      const cumbre = sierra(c, { base: H * 0.76, amp: 230 * k, col: "#9a6e54", sem: 37, esc: 1.7, oct: 6, luz: 0xe9b98d, picudo: 1.3 });
      const xr = W * 0.66, yr = cumbre(xr); c.fillStyle = "#7c5642"; c.beginPath(); c.moveTo(xr - 18 * k, yr + 10 * k); c.lineTo(xr - 13 * k, yr - 70 * k); c.quadraticCurveTo(xr, yr - 92 * k, xr + 12 * k, yr - 66 * k); c.lineTo(xr + 18 * k, yr + 10 * k); c.fill();
      const az = prng(43);
      for (let i = 0; i < 46; i++) { const x = W * (0.45 + az() * 0.55), s = (16 + az() * 18) * k; conifera(c, x, cumbre(x) + (30 + az() * 60) * k, s * 1.5, "rgba(60,82,48,.9)"); }
      const ladera = sierra(c, { base: H * 0.93, amp: 60 * k, col: "#a77a5a", sem: 53, esc: 3, luz: 0xf0c49a });
      for (let i = 0; i < 9; i++) { const x = az() * W; cardon(c, x, ladera(x) + 22 * k, (50 + az() * 30) * k, "rgba(90,110,60,.9)"); }
      for (let i = 0; i < 4; i++) { const x = W * (0.05 + az() * 0.4); palmera(c, x, H * 0.97, (110 + az() * 40) * k, "#4f5a34"); }
      bruma(c, H * 0.9, 0xd6cdbd, 1);
    },
    // Hispania romana (Segovia): la sierra de Guadarrama nevada, campos y pinares
    valle(c) {
      cielo(c, [[0, "#6f9fca"], [0.55, "#bdd4e2"], [1, "#e7e0cc"]]);
      nubes(c, 61, 12, H * 0.08, H * 0.42, 0xffffff, 0.7);
      const sie = sierra(c, { base: H * 0.68, amp: 200 * k, col: "#8b9bb3", sem: 67, esc: 2, oct: 6, picudo: 1.4, luz: 0xdfe8f2 });
      c.save(); c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 2) c.lineTo(x, sie(x)); c.lineTo(W, H); c.clip();
      banda(c, H * 0.68 - 200 * k, H * 0.62, 0xffffff, 0.9, 0); c.restore();
      const az = prng(71);
      const loma = sierra(c, { base: H * 0.8, amp: 70 * k, col: "#8e8f5e", sem: 73, esc: 3, luz: 0xd9d398 });
      for (let i = 0; i < 70; i++) { const x = az() * W, s = (14 + az() * 14) * k; conifera(c, x, loma(x) + (10 + az() * 30) * k, s * 1.6, "rgba(48,70,46,.9)"); }
      for (let i = 0; i < 10; i++) { const x0 = az() * W, w = (100 + az() * 200) * k; c.fillStyle = ["rgba(210,186,120,.8)", "rgba(160,160,90,.7)", "rgba(190,150,100,.7)"][i % 3]; c.beginPath(); c.ellipse(x0, H * (0.87 + az() * 0.04), w, 10 * k, 0, 0, Math.PI * 2); c.fill(); }
      bruma(c, H * 0.84, 0xd7d2c0, 1);
    },
    // Barranco canario con bancales, palmeras y casas encaladas (heredades de agua)
    barranco(c) {
      cielo(c, [[0, "#5e98c8"], [0.6, "#b9d2e0"], [1, "#e6dccb"]]);
      nubes(c, 81, 7, H * 0.12, H * 0.38);
      sierra(c, { base: H * 0.6, amp: 120 * k, col: "#a08a80", sem: 83, esc: 2, luz: 0xe9c9a8, picudo: 1.2 });
      const az = prng(87), y0 = H * 0.42, y1 = H * 0.97;
      const borde = (y, lado) => { const f = (y - y0) / (y1 - y0); return lado < 0 ? W * 0.44 * f ** 0.8 : W - W * 0.44 * f ** 0.8; };
      for (const lado of [-1, 1]) {
        c.fillStyle = lado < 0 ? "#9a6a4c" : "#86583e"; c.beginPath(); c.moveTo(lado < 0 ? 0 : W, y0);
        for (let y = y0; y <= y1; y += 4) c.lineTo(borde(y, lado), y); c.lineTo(lado < 0 ? 0 : W, H); c.closePath(); c.fill();
        // bancales: escalones de cultivo con muro de piedra seca
        for (let y = y0 + 22 * k, i = 0; y < y1; y += (18 + i * 1.6) * k, i++) {
          const x = borde(y, lado), h = (12 + i) * k, ancho = lado < 0 ? x : W - x, xa = lado < 0 ? 0 : x;
          c.fillStyle = ["#8f9a52", "#b4a05c", "#7f9148", "#a9945a"][i % 4]; c.globalAlpha = 0.85; c.fillRect(xa, y - h, ancho, h * 0.7); c.globalAlpha = 1;
          c.fillStyle = "rgba(235,214,180,.7)"; c.fillRect(xa, y - h * 0.3, ancho, 2.5 * k);
        }
        for (let i = 0; i < 4; i++) { const y = y0 + (0.2 + az() * 0.6) * (y1 - y0), x = lado < 0 ? borde(y, lado) * (0.3 + az() * 0.6) : W - (W - borde(y, lado)) * (0.3 + az() * 0.6); c.fillStyle = "rgba(60,40,25,.28)"; c.beginPath(); c.ellipse(x + 26 * k, y + 1 * k, 34 * k, 5 * k, 0, 0, Math.PI * 2); c.fill();
          casa(c, x, y, 64 * k, 32 * k, "#f4f0e8", "#cfc8bb", null); c.fillStyle = "#b9a58a"; c.fillRect(x - 2 * k, y - 25 * k, 50 * k, 3 * k); c.fillStyle = "#4a3a2c"; c.fillRect(x + 9 * k, y - 13 * k, 7 * k, 13 * k); c.fillRect(x + 22 * k, y - 18 * k, 5 * k, 5 * k); }
      }
      c.fillStyle = "#7a8a4a"; c.beginPath(); c.moveTo(borde(y1 - 60 * k, -1), y1 - 60 * k); c.lineTo(borde(y1 - 60 * k, 1), y1 - 60 * k); c.lineTo(W * 0.62, H); c.lineTo(W * 0.38, H); c.fill();
      for (let i = 0; i < 16; i++) { const x = W * (0.38 + az() * 0.24); palmera(c, x, H * (0.9 + az() * 0.07), (60 + az() * 50) * k, "#45542e"); }
      for (let i = 0; i < 6; i++) { const lado = i % 2 ? 1 : -1, y = y0 + (0.3 + az() * 0.5) * (y1 - y0); cardon(c, lado < 0 ? borde(y, -1) * 0.9 : W - (W - borde(y, 1)) * 0.9, y, (34 + az() * 16) * k, "rgba(80,100,55,.95)"); }
      c.strokeStyle = "rgba(120,170,200,.9)"; c.lineWidth = 4 * k; c.beginPath(); c.moveTo(0, H * 0.7); c.quadraticCurveTo(W * 0.25, H * 0.74, W * 0.42, H * 0.86); c.stroke();
      bruma(c, H * 0.9, 0xd9ccb4, 1);
    },
    // Toledo medieval: ciudad amurallada sobre un cerro rodeado por el río, a mediodía
    ciudad(c) {
      cielo(c, [[0, "#5d93c4"], [0.55, "#b7cfdf"], [1, "#e8decb"]]);
      nubes(c, 91, 8, H * 0.08, H * 0.35, 0xffffff, 0.6);
      sierra(c, { base: H * 0.76, amp: 70 * k, col: "#a5a7a6", sem: 93, esc: 2 });
      const cerro = (x) => H * 0.72 - 120 * k * Math.exp(-((((x / W) - 0.55) / 0.22) ** 2));
      c.fillStyle = "#b39a73"; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 4) c.lineTo(x, cerro(x) + 60 * k); c.lineTo(W, H); c.fill();
      muralla(c, W * 0.34, W * 0.78, H * 0.69, 34 * k, "#e1d1b0", "#b09872");
      ciudad(c, W * 0.36, W * 0.76, H * 0.63, 30 * k, 97, "#eadcc0", "#bca783", "#a35c3c");
      iglesia(c, W * 0.47, H * 0.6, 60 * k, "#efe2c6", "#bfa985");
      torre(c, W * 0.66, H * 0.62, 70 * k, 110 * k, "#e6d6b6", "#b49c78"); torre(c, W * 0.645, H * 0.62, 18 * k, 130 * k, "#e6d6b6", "#b49c78"); torre(c, W * 0.722, H * 0.62, 18 * k, 130 * k, "#e6d6b6", "#b49c78");
      c.strokeStyle = "#6f9cb3"; c.lineWidth = 26 * k; c.lineCap = "round"; c.beginPath(); c.moveTo(-20, H * 0.84); c.bezierCurveTo(W * 0.3, H * 0.92, W * 0.45, H * 0.78, W * 0.62, H * 0.82); c.bezierCurveTo(W * 0.8, H * 0.86, W * 0.9, H * 0.8, W + 20, H * 0.83); c.stroke();
      c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 5 * k; c.stroke();
      const az = prng(99); for (let i = 0; i < 30; i++) { const x = az() * W; conifera(c, x, H * (0.88 + az() * 0.06), (20 + az() * 16) * k, "rgba(80,96,58,.85)"); }
      bruma(c, H * 0.86, 0xd9cfb6, 1);
    },
    // Obra de una catedral gótica: fachada a medio levantar, andamios y grúa de rueda
    obra(c) {
      cielo(c, [[0, "#6d9cc6"], [0.55, "#c2d5e0"], [1, "#e8e0d0"]]);
      nubes(c, 101, 10, H * 0.08, H * 0.4, 0xffffff, 0.7);
      sierra(c, { base: H * 0.8, amp: 60 * k, col: "#a8ac9c", sem: 103, esc: 2.5 });
      ciudad(c, 0, W, H * 0.84, 34 * k, 105, "#e3d6bc", "#b8a586", "#a05f40");
      const x0 = W * 0.36, y0 = H * 0.84, an = W * 0.28;
      c.fillStyle = "#e5d8bd"; c.fillRect(x0, y0 - 300 * k, an, 300 * k); c.fillStyle = "#bfae8c"; c.fillRect(x0 + an * 0.7, y0 - 300 * k, an * 0.3, 300 * k);
      c.fillStyle = "#e5d8bd"; c.fillRect(x0 - 40 * k, y0 - 420 * k, 90 * k, 420 * k); c.fillRect(x0 + an - 50 * k, y0 - 360 * k, 90 * k, 360 * k);
      c.fillStyle = "#5b4a3c"; for (let i = 0; i < 4; i++) { arcoApuntado(c, x0 + an * (0.18 + i * 0.22), y0 - 40 * k, 50 * k, 190 * k); c.fill(); }
      c.save(); c.translate(x0 + an * 0.5, y0 - 230 * k); c.fillStyle = "#5b4a3c"; c.beginPath(); c.arc(0, 0, 50 * k, 0, Math.PI * 2); c.fill(); c.restore();
      c.strokeStyle = "#7a5a38"; c.lineWidth = 5 * k;
      for (let x = x0 - 60 * k; x < x0 + an + 60 * k; x += 70 * k) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 - 460 * k); c.stroke(); }
      for (let y = y0 - 60 * k; y > y0 - 460 * k; y -= 80 * k) { c.beginPath(); c.moveTo(x0 - 70 * k, y); c.lineTo(x0 + an + 70 * k, y); c.stroke(); }
      c.lineWidth = 9 * k; c.beginPath(); c.moveTo(x0 + an + 140 * k, y0); c.lineTo(x0 + an + 140 * k, y0 - 480 * k); c.lineTo(x0 + an + 20 * k, y0 - 520 * k); c.stroke();
      c.beginPath(); c.arc(x0 + an + 140 * k, y0 - 60 * k, 55 * k, 0, Math.PI * 2); c.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(x0 + an + 140 * k, y0 - 60 * k); c.lineTo(x0 + an + 140 * k + Math.cos(a) * 55 * k, y0 - 60 * k + Math.sin(a) * 55 * k); c.stroke(); }
      c.lineWidth = 2 * k; c.beginPath(); c.moveTo(x0 + an + 25 * k, y0 - 515 * k); c.lineTo(x0 + an + 25 * k, y0 - 330 * k); c.stroke(); c.fillStyle = "#d9cbb0"; c.fillRect(x0 + an + 5 * k, y0 - 330 * k, 40 * k, 26 * k);
      const az = prng(107); for (let i = 0; i < 12; i++) { c.fillStyle = mezcla(0xe0d2b4, 0xb7a483, az()); c.fillRect(W * (0.1 + az() * 0.8), H * (0.86 + az() * 0.06), (30 + az() * 30) * k, 18 * k); }
      bruma(c, H * 0.86, 0xd8d0bf, 1);
    },
    // Nave de una iglesia gótica: pilares en fila, arcos apuntados y vidrieras que tiñen la luz
    nave(c) {
      c.fillStyle = "#4a4240"; c.fillRect(0, 0, W, H);
      const fx = W / 2, fy = H * 0.6;
      for (let i = 0; i < 7; i++) {
        const f = 1 - i / 8, w = 260 * k * f, h = 900 * k * f, d = 520 * k * f, col = mezcla(0x8a7c6e, 0x4a4240, i / 7);
        for (const lado of [-1, 1]) { c.fillStyle = col; c.fillRect(fx + lado * d - w * 0.12, fy + h * 0.45 - h, w * 0.24, h); }
        c.strokeStyle = col; c.lineWidth = 16 * k * f; arcoApuntado(c, fx, fy + h * 0.45 - h * 0.62, d * 2 - w * 0.24, h * 0.55); c.stroke();
        if (i < 6) for (const lado of [-1, 1]) { const vx = fx + lado * d * 0.62, vy = fy - h * 0.2; const gr = c.createLinearGradient(0, vy - h * 0.3, 0, vy); gr.addColorStop(0, "#5b7fc4"); gr.addColorStop(0.5, "#c7525a"); gr.addColorStop(1, "#e3b04c"); c.fillStyle = gr; c.globalAlpha = 0.75 * f; arcoApuntado(c, vx, vy, 34 * k * f, h * 0.3); c.fill(); c.globalAlpha = 1; }
      }
      c.fillStyle = "#d8c8a8"; arcoApuntado(c, fx, fy + 30 * k, 70 * k, 220 * k); c.fill(); halo(c, fx, fy - 60 * k, 260 * k, 0xffe7b8, 0.55);
      c.save(); c.globalCompositeOperation = "lighter"; for (const [x, col] of [[0.3, 0x7d9ad8], [0.62, 0xd86a6a], [0.75, 0xe3c070]]) { const gr = c.createLinearGradient(W * x, 0, W * x - 260 * k, H); gr.addColorStop(0, rgba(col, 0.16)); gr.addColorStop(1, rgba(col, 0)); c.fillStyle = gr; c.beginPath(); c.moveTo(W * x - 30 * k, H * 0.15); c.lineTo(W * x + 30 * k, H * 0.15); c.lineTo(W * x - 200 * k, H); c.lineTo(W * x - 380 * k, H); c.fill(); } c.restore();
      texturaRoca(c, 0, 0, W, H, 0, 0.35);
      bruma(c, H * 0.88, 0x4a4240, 1);
    },
    // Palacio nazarí (Alhambra): patio con alberca, galería de columnas, yeserías y zócalo de alicatado
    alhambra(c) {
      cielo(c, [[0, "#5b93c6"], [0.5, "#b4cde0"], [1, "#e6d9c0"]]);
      c.fillStyle = "#e3cfa6"; c.fillRect(W * 0.38, H * 0.18, W * 0.24, H * 0.5); c.fillStyle = "#c6ad82"; c.fillRect(W * 0.55, H * 0.18, W * 0.07, H * 0.5);
      for (let i = 0; i < 3; i++) { c.fillStyle = "#4b3b2c"; c.fillRect(W * (0.42 + i * 0.06), H * 0.26, 20 * k, 50 * k); }
      c.fillStyle = "#ead9b8"; c.fillRect(0, H * 0.46, W, H * 0.32);
      for (let x = 0; x < W; x += 34 * k) for (let y = H * 0.48; y < H * 0.56; y += 24 * k) { c.strokeStyle = "rgba(150,120,80,.35)"; c.lineWidth = 2 * k; c.beginPath(); c.moveTo(x, y + 12 * k); c.lineTo(x + 17 * k, y); c.lineTo(x + 34 * k, y + 12 * k); c.lineTo(x + 17 * k, y + 24 * k); c.closePath(); c.stroke(); }
      const n = 9, paso = W / n;
      for (let i = 0; i < n; i++) { const x = paso * (i + 0.5); c.fillStyle = "#3f3328"; c.beginPath(); c.moveTo(x - paso * 0.4, H * 0.78); c.lineTo(x - paso * 0.4, H * 0.62); c.arc(x, H * 0.62, paso * 0.4, Math.PI, 0); c.lineTo(x + paso * 0.4, H * 0.78); c.fill(); c.fillStyle = "#f1e4c8"; c.fillRect(x + paso * 0.44, H * 0.58, 10 * k, H * 0.2); }
      const col = ["#2f6b4f", "#1f3f7a", "#a8742a", "#f2ead8", "#6b2a2a"];
      for (let x = 0; x < W; x += 28 * k) for (let j = 0; j < 3; j++) { c.fillStyle = col[(Math.floor(x / (28 * k)) + j * 2) % col.length]; c.beginPath(); const y = H * 0.79 + j * 18 * k; c.moveTo(x, y + 9 * k); c.lineTo(x + 14 * k, y); c.lineTo(x + 28 * k, y + 9 * k); c.lineTo(x + 14 * k, y + 18 * k); c.fill(); }
      c.fillStyle = "#4f6f4a"; c.fillRect(0, H * 0.85, W, H * 0.04);
      c.fillStyle = "#7da3b8"; c.fillRect(0, H * 0.89, W, H * 0.11); banda(c, H * 0.89, H * 0.97, 0xe3cfa6, 0.35, 0);
      bruma(c, H * 0.9, 0xe6d9c0, 1);
    },
    // Puerto de Mallorca: barcos, la ciudad con su catedral junto al mar y la sierra de Tramuntana
    puerto(c) {
      cielo(c, [[0, "#5d95c6"], [0.6, "#c0d6e2"], [1, "#e2e2d8"]]);
      nubes(c, 111, 9, H * 0.08, H * 0.4, 0xffffff, 0.7);
      sierra(c, { base: H * 0.7, amp: 170 * k, col: "#8f9fb0", sem: 113, esc: 2, picudo: 1.2, luz: 0xdde6ee });
      sierra(c, { base: H * 0.75, amp: 60 * k, col: "#9a9a72", sem: 117, esc: 3 });
      ciudad(c, W * 0.15, W * 0.85, H * 0.77, 32 * k, 119, "#ecdfc4", "#c0ab88", "#a6633f");
      c.fillStyle = "#eadcc0"; c.fillRect(W * 0.52, H * 0.66, 220 * k, 80 * k); c.fillStyle = "#c0ab88"; c.fillRect(W * 0.52 + 160 * k, H * 0.66, 60 * k, 80 * k);
      for (let i = 0; i < 6; i++) { c.fillStyle = "#eadcc0"; c.fillRect(W * 0.52 + i * 40 * k, H * 0.62, 12 * k, 40 * k); }
      torre(c, W * 0.52 + 230 * k, H * 0.77, 40 * k, 150 * k, "#eadcc0", "#c0ab88", false);
      c.fillStyle = "#3d7397"; c.fillRect(0, H * 0.78, W, H * 0.22); banda(c, H * 0.78, H * 0.84, 0xd4e2ea, 0.6, 0);
      const az = prng(121);
      for (let i = 0; i < 7; i++) velero(c, W * (0.08 + i * 0.13 + az() * 0.04), H * (0.84 + az() * 0.06), (60 + az() * 50) * k, "#5a3c26", "#f1e8d6");
      bruma(c, H * 0.9, 0xcfd6d6, 1);
    },
    // La Gomera (1492): bahía de San Sebastián, acantilados, la Torre del Conde y carabelas fondeadas
    gomera(c) {
      cielo(c, [[0, "#5f97c8"], [0.55, "#bcd3e0"], [1, "#e4e2d6"]]);
      nubes(c, 131, 8, H * 0.08, H * 0.36, 0xffffff, 0.7);
      sierra(c, { base: H * 0.66, amp: 180 * k, col: "#7f8a74", sem: 133, esc: 1.8, oct: 6, luz: 0xd8dcb8, picudo: 1.1 });
      const risco = sierra(c, { base: H * 0.76, amp: 110 * k, col: "#8c6f58", sem: 137, esc: 2.4, luz: 0xe0b994 });
      c.fillStyle = "#3f7aa0"; c.fillRect(0, H * 0.79, W, H * 0.21); banda(c, H * 0.79, H * 0.85, 0xd2e2ea, 0.6, 0);
      ciudad(c, W * 0.36, W * 0.62, H * 0.785, 24 * k, 139, "#f0ebe0", "#c8bfae", "#9a5a3a");
      torre(c, W * 0.47, H * 0.785, 46 * k, 96 * k, "#d9c8a8", "#a8946f", true);
      const az = prng(141);
      for (let i = 0; i < 3; i++) velero(c, W * (0.18 + i * 0.25 + az() * 0.05), H * (0.86 + az() * 0.04), (90 + az() * 30) * k, "#5a3c26", "#efe6d2");
      for (let i = 0; i < 6; i++) { const x = az() * W; palmera(c, x, risco(x) + 30 * k, (60 + az() * 30) * k, "#4f5a34"); }
      bruma(c, H * 0.9, 0xd8dcd8, 1);
    },
    // Florencia en el Renacimiento: tejados, la gran cúpula y colinas de cipreses
    florencia(c) {
      cielo(c, [[0, "#6c9cc8"], [0.55, "#c9d8e0"], [1, "#ece2cc"]]);
      nubes(c, 151, 7, H * 0.08, H * 0.34, 0xffffff, 0.6);
      const col = sierra(c, { base: H * 0.74, amp: 90 * k, col: "#8d9467", sem: 153, esc: 2.2, luz: 0xd8d6a2 });
      const az = prng(157);
      for (let i = 0; i < 40; i++) { const x = az() * W, s = (24 + az() * 18) * k; c.fillStyle = "rgba(52,70,42,.9)"; c.beginPath(); c.ellipse(x, col(x) + 10 * k - s * 0.6, s * 0.14, s * 0.6, 0, 0, Math.PI * 2); c.fill(); }
      ciudad(c, 0, W, H * 0.84, 30 * k, 159, "#e6d3b0", "#b99e78", "#b0603c");
      const dx = W * 0.5, dy = H * 0.7, R = 120 * k;
      c.fillStyle = "#e9dcc2"; c.fillRect(dx - R * 1.05, dy, R * 2.1, 70 * k);
      const gr = c.createLinearGradient(dx - R, 0, dx + R, 0); gr.addColorStop(0, "#c46a44"); gr.addColorStop(0.5, "#d98a5c"); gr.addColorStop(1, "#9c4e30");
      c.fillStyle = gr; c.beginPath(); c.moveTo(dx - R, dy); c.quadraticCurveTo(dx - R * 0.95, dy - R * 1.25, dx, dy - R * 1.35); c.quadraticCurveTo(dx + R * 0.95, dy - R * 1.25, dx + R, dy); c.closePath(); c.fill();
      c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 3 * k; for (const f of [-0.55, 0, 0.55]) { c.beginPath(); c.moveTo(dx + f * R, dy); c.quadraticCurveTo(dx + f * R * 0.8, dy - R * 1.1, dx, dy - R * 1.35); c.stroke(); }
      c.fillStyle = "#f2ead8"; c.fillRect(dx - 12 * k, dy - R * 1.35 - 34 * k, 24 * k, 34 * k);
      torre(c, W * 0.62, H * 0.84, 30 * k, 200 * k, "#efe4cc", "#c2ad86", false);
      bruma(c, H * 0.86, 0xe4dac4, 1);
    },
    // Los Andes cerca de Quito (s. XVIII): volcanes nevados y el valle
    andes(c) {
      cielo(c, [[0, "#5a8fc4"], [0.55, "#b8cfe0"], [1, "#e2e2d6"]]);
      nubes(c, 161, 8, H * 0.1, H * 0.4, 0xffffff, 0.65);
      for (const [x, h, w] of [[0.22, 300, 260], [0.7, 360, 300]]) {
        const cx = W * x, cy = H * 0.72; c.fillStyle = "#7c8496"; c.beginPath(); c.moveTo(cx - w * k, cy); c.lineTo(cx - 30 * k, cy - h * k); c.lineTo(cx + 30 * k, cy - h * k); c.lineTo(cx + w * k, cy); c.fill();
        c.fillStyle = "#f4f6f8"; c.beginPath(); c.moveTo(cx - 30 * k, cy - h * k); c.lineTo(cx + 30 * k, cy - h * k); c.lineTo(cx + 95 * k, cy - h * k * 0.62); c.lineTo(cx + 40 * k, cy - h * k * 0.66); c.lineTo(cx, cy - h * k * 0.6); c.lineTo(cx - 50 * k, cy - h * k * 0.66); c.lineTo(cx - 95 * k, cy - h * k * 0.62); c.fill();
      }
      const valle = sierra(c, { base: H * 0.82, amp: 70 * k, col: "#8f9663", sem: 163, esc: 3, luz: 0xd8d3a0 });
      const az = prng(167);
      for (let i = 0; i < 10; i++) { const x0 = az() * W, w = (100 + az() * 200) * k; c.fillStyle = ["rgba(200,180,110,.7)", "rgba(150,160,90,.7)"][i % 2]; c.beginPath(); c.ellipse(x0, valle(x0) + 40 * k, w, 12 * k, 0, 0, Math.PI * 2); c.fill(); }
      bruma(c, H * 0.86, 0xd8d6c4, 1);
    },
    // Gran Canaria (s. XVI): cañaveral, acequia y montañas, con la casa del ingenio
    canaveral(c) {
      cielo(c, [[0, "#5e98c8"], [0.6, "#bad2e0"], [1, "#e6dcc8"]]);
      nubes(c, 171, 7, H * 0.1, H * 0.36);
      sierra(c, { base: H * 0.64, amp: 200 * k, col: "#8a7466", sem: 173, esc: 1.7, oct: 6, luz: 0xe2bc98, picudo: 1.2 });
      const loma = sierra(c, { base: H * 0.78, amp: 60 * k, col: "#7f8a50", sem: 175, esc: 3 });
      const az = prng(177);
      for (let y = H * 0.8; y < H; y += 9 * k) { c.strokeStyle = mezcla(0x5f8a3a, 0x9ab45a, az()); c.lineWidth = 6 * k; c.beginPath(); for (let x = 0; x <= W; x += 30 * k) c.lineTo(x, y - 14 * k * Math.abs(Math.sin(x * 0.02 + y))); c.stroke(); }
      casa(c, W * 0.66, H * 0.8, 150 * k, 70 * k, "#efe6d4", "#c8bba0", "#9a5a3a");
      c.strokeStyle = "rgba(120,170,200,.9)"; c.lineWidth = 6 * k; c.beginPath(); c.moveTo(W * 0.2, loma(W * 0.2) + 6 * k); c.lineTo(W * 0.66, H * 0.74); c.stroke();
      for (let i = 0; i < 8; i++) { const x = az() * W; palmera(c, x, loma(x) + 20 * k, (60 + az() * 40) * k, "#45542e"); }
      bruma(c, H * 0.92, 0xd9d4bc, 1);
    },
    // Taller del siglo XIX: pared de madera, estantes y una ventana
    taller(c) {
      const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#5a4632"); gr.addColorStop(1, "#7a6248"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 70 * k) { c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(x, 0, 3 * k, H); }
      c.fillStyle = "#e9e2cc"; c.fillRect(W * 0.62, H * 0.18, W * 0.2, H * 0.36); halo(c, W * 0.72, H * 0.36, 380 * k, 0xfff2d0, 0.35);
      c.strokeStyle = "#4a3624"; c.lineWidth = 10 * k; c.strokeRect(W * 0.62, H * 0.18, W * 0.2, H * 0.36); c.beginPath(); c.moveTo(W * 0.72, H * 0.18); c.lineTo(W * 0.72, H * 0.54); c.moveTo(W * 0.62, H * 0.36); c.lineTo(W * 0.82, H * 0.36); c.stroke();
      for (const y of [0.3, 0.5]) { c.fillStyle = "#3e2e1e"; c.fillRect(W * 0.08, H * y, W * 0.38, 12 * k); const az = prng(181 + y * 10); for (let i = 0; i < 9; i++) { c.fillStyle = mezcla(0x8a6a4a, 0xc9b28a, az()); c.fillRect(W * (0.1 + i * 0.038), H * y - (40 + az() * 50) * k, 26 * k, (40 + az() * 50) * k); } }
      texturaRoca(c, 0, 0, W, H, 0, 0.18);
      bruma(c, H * 0.9, 0x6a5440, 1);
    },
    // Ría del Nervión (1893): agua, laderas, chimeneas de fábricas
    ria(c) {
      cielo(c, [[0, "#7e9cb8"], [0.6, "#c4ced4"], [1, "#d9d6cc"]]);
      nubes(c, 191, 9, H * 0.08, H * 0.4, 0xeef0f2, 0.8);
      const lad = sierra(c, { base: H * 0.72, amp: 120 * k, col: "#6f8160", sem: 193, esc: 2.2, luz: 0xc8d0a8 });
      ciudad(c, 0, W * 0.4, H * 0.78, 30 * k, 195, "#e2dcd0", "#b4ab9a", "#8f4a34");
      ciudad(c, W * 0.6, W, H * 0.78, 30 * k, 197, "#e2dcd0", "#b4ab9a", "#8f4a34");
      const az = prng(199);
      for (let i = 0; i < 6; i++) { const x = W * (0.05 + az() * 0.9); c.fillStyle = "#6e5a4c"; c.fillRect(x, H * 0.78 - 140 * k, 16 * k, 140 * k); for (let j = 0; j < 5; j++) halo(c, x + 8 * k + j * 14 * k, H * 0.78 - 160 * k - j * 26 * k, (34 + j * 14) * k, 0xb8b8b4, 0.16); }
      c.fillStyle = "#5f7d8c"; c.fillRect(0, H * 0.8, W, H * 0.2); banda(c, H * 0.8, H * 0.86, 0xc8d4da, 0.5, 0);
      bruma(c, H * 0.9, 0xcfd2cc, 1);
    },
    // Maspalomas (Gran Canaria): dunas, palmeral, mar y cielo despejado
    maspalomas(c) {
      cielo(c, [[0, "#4f8fc8"], [0.6, "#a9cbe2"], [1, "#e8e2d0"]]);
      nubes(c, 201, 5, H * 0.08, H * 0.3, 0xffffff, 0.6);
      c.fillStyle = "#3a78a8"; c.fillRect(0, H * 0.7, W, H * 0.3); banda(c, H * 0.7, H * 0.76, 0xd2e2ea, 0.6, 0);
      const az = prng(203);
      for (let i = 0; i < 7; i++) { const x = W * (i / 6), w = (220 + az() * 160) * k, h = (60 + az() * 50) * k, y = H * (0.8 + az() * 0.06); const gr = c.createLinearGradient(x - w, y, x + w, y - h); gr.addColorStop(0, "#d9b47a"); gr.addColorStop(0.6, "#f0d9a4"); gr.addColorStop(1, "#c79a5e"); c.fillStyle = gr; c.beginPath(); c.moveTo(x - w, y + 20 * k); c.quadraticCurveTo(x - w * 0.2, y - h, x + w * 0.3, y - h * 0.8); c.quadraticCurveTo(x + w * 0.6, y - h * 0.5, x + w, y + 20 * k); c.fill(); }
      for (let i = 0; i < 9; i++) palmera(c, W * (0.05 + az() * 0.3), H * (0.84 + az() * 0.04), (70 + az() * 40) * k, "#45542e");
      bruma(c, H * 0.9, 0xe8dcc0, 1);
    },
    // Las Palmas de Gran Canaria hoy: el mar, el puerto y la ciudad sobre las laderas
    ciudad_moderna(c) {
      cielo(c, [[0, "#5d95c6"], [0.6, "#bcd4e2"], [1, "#e4e2d8"]]);
      nubes(c, 211, 7, H * 0.08, H * 0.36, 0xffffff, 0.7);
      const lad = sierra(c, { base: H * 0.72, amp: 140 * k, col: "#9a7d68", sem: 213, esc: 2, luz: 0xe6c4a2 });
      const az = prng(217);
      for (let i = 0; i < 70; i++) { const x = az() * W, w = (24 + az() * 40) * k, h = (30 + az() * 120) * k, y = Math.min(H * 0.8, lad(x) + 40 * k + az() * 60 * k); c.fillStyle = mezcla(0xf2efe8, 0xc8c2b6, az()); c.fillRect(x, y - h, w, h); c.fillStyle = "rgba(60,80,100,.35)"; for (let j = 8 * k; j < h - 6 * k; j += 14 * k) c.fillRect(x + 4 * k, y - h + j, w - 8 * k, 4 * k); }
      c.fillStyle = "#3d7397"; c.fillRect(0, H * 0.8, W, H * 0.2); banda(c, H * 0.8, H * 0.85, 0xd4e2ea, 0.6, 0);
      bruma(c, H * 0.9, 0xd8dcd8, 1);
    },
    // El Hierro: laderas volcánicas, el mar y los aerogeneradores en la loma
    hierro(c) {
      cielo(c, [[0, "#4f8cc6"], [0.6, "#b2cfe2"], [1, "#e2e2d8"]]);
      nubes(c, 221, 8, H * 0.1, H * 0.38, 0xffffff, 0.75);
      c.fillStyle = "#3a78a8"; c.fillRect(0, H * 0.74, W, H * 0.26); banda(c, H * 0.74, H * 0.8, 0xd2e2ea, 0.6, 0);
      const lad = sierra(c, { base: H * 0.74, amp: 260 * k, col: "#6c5446", sem: 223, esc: 1.5, oct: 6, luz: 0xc69a7c, picudo: 0.9 });
      const az = prng(227);
      for (let i = 0; i < 26; i++) { const x = az() * W; conifera(c, x, lad(x) + (30 + az() * 80) * k, (20 + az() * 14) * k, "rgba(60,82,48,.9)"); }
      for (let i = 0; i < 5; i++) { const x = W * (0.56 + i * 0.07), y = lad(x) + 6 * k, h = 110 * k; c.fillStyle = "#eef0f2"; c.fillRect(x - 3 * k, y - h, 6 * k, h); c.save(); c.translate(x, y - h); for (let b = 0; b < 3; b++) { c.rotate(Math.PI * 2 / 3); c.fillRect(-2 * k, 0, 4 * k, 52 * k); } c.restore(); }
      bruma(c, H * 0.88, 0xdadcd6, 1);
    }
  };
  const CFG = {
    sabana: { niebla: 0xd9c7a0, cielo: 0xe8eef2, suelo: 0x9a7a4a, hi: 0.6, luz: 0xfff0d8, li: 2.5, tx: "tierra", tc: 0xf0d9a8 },
    cueva: { zb: 7, alto: 1.15, niebla: 0x3a2c22, cielo: 0xb08a68, suelo: 0x4a3626, hi: 0.45, luz: 0xffc48a, li: 2.2, tx: "caliza", tc: 0x8a7258 },
    aldea: { niebla: 0xd8cfae, cielo: 0xe6eef2, suelo: 0x6f7040, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "tierra", tc: 0xc9c79a },
    canarias: { niebla: 0xd6cdbd, cielo: 0xe2ecf4, suelo: 0x7a5440, hi: 0.6, luz: 0xfff2e0, li: 2.5, tx: "tierra", tc: 0xb8907a },
    valle: { niebla: 0xd7d2c0, cielo: 0xe6eef4, suelo: 0x6f7048, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "tierra", tc: 0xc4c49a },
    barranco: { niebla: 0xd9ccb4, cielo: 0xe6eef4, suelo: 0x7a5a40, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "tierra", tc: 0xc09a7a },
    ciudad: { niebla: 0xd9cfb6, cielo: 0xe6eef4, suelo: 0x7a6a48, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "tierra", tc: 0xd8c49e },
    obra: { niebla: 0xd8d0bf, cielo: 0xe6eef4, suelo: 0x7a6a48, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "caliza", tc: 0xd8ccb4 },
    nave: { zb: 8, alto: 1.25, niebla: 0x4a4240, cielo: 0xd8d0e0, suelo: 0x4a4038, hi: 0.5, luz: 0xffe6c4, li: 2.3, tx: "caliza", tc: 0x9a8c7c },
    alhambra: { zb: 10, alto: 0.95, niebla: 0xe6d9c0, cielo: 0xeef0f2, suelo: 0x8a7458, hi: 0.62, luz: 0xfff0dc, li: 2.4, tx: "estuco", tc: 0xe2d2b6 },
    puerto: { niebla: 0xcfd6d6, cielo: 0xe6eef4, suelo: 0x6a6a5a, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "madera", tc: 0xc8b090 },
    gomera: { niebla: 0xd8dcd8, cielo: 0xe6eef4, suelo: 0x6a5a48, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "madera", tc: 0xc8b090 },
    florencia: { niebla: 0xe4dac4, cielo: 0xeef0f2, suelo: 0x8a7458, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "estuco", tc: 0xe0d0b4 },
    andes: { niebla: 0xd8d6c4, cielo: 0xe6eef4, suelo: 0x6f7048, hi: 0.6, luz: 0xfff2e0, li: 2.4, tx: "tierra", tc: 0xc4c098 },
    canaveral: { niebla: 0xd9d4bc, cielo: 0xe6eef4, suelo: 0x6a6a40, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "tierra", tc: 0xc8b890 },
    taller: { zb: 8, alto: 1.2, niebla: 0x6a5440, cielo: 0xe0d4c0, suelo: 0x5a4632, hi: 0.55, luz: 0xffe8c8, li: 2.3, tx: "madera", tc: 0xc8a882 },
    ria: { niebla: 0xcfd2cc, cielo: 0xe2e8ec, suelo: 0x6a6a5a, hi: 0.6, luz: 0xfff0dc, li: 2.3, tx: "tierra", tc: 0xb8b09a },
    maspalomas: { niebla: 0xe8dcc0, cielo: 0xe8f0f4, suelo: 0xa08a60, hi: 0.62, luz: 0xfff2e0, li: 2.5, tx: "tierra", tc: 0xf0dcae },
    ciudad_moderna: { niebla: 0xd8dcd8, cielo: 0xe6eef4, suelo: 0x6a6a5a, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "estuco", tc: 0xd8d4cc },
    hierro: { niebla: 0xdadcd6, cielo: 0xe6eef4, suelo: 0x5a4a3c, hi: 0.6, luz: 0xfff0dc, li: 2.4, tx: "tierra", tc: 0xa08870 },
    cenital: { cielo: 0xe8f0f6, suelo: 0x7a6448, hi: 0.55, luz: 0xfff0dc, li: 2.4 }
  };
  // Vista cenital (dolmen): pradera vista desde arriba, repetible sin costuras
  function pintarCenital() {
    const T = CALIDAD_LIGERA ? 512 : 1024, cv = document.createElement("canvas"); cv.width = cv.height = T; const c = cv.getContext("2d");
    const t = TX.textura("tierra"); c.drawImage(t.canvas, 0, 0, T, T);
    c.globalCompositeOperation = "multiply"; c.fillStyle = "#a9b878"; c.fillRect(0, 0, T, T); c.globalCompositeOperation = "source-over";
    const az = prng(131);
    for (let i = 0; i < 2600; i++) { const x = az() * T, y = az() * T, l = 3 + az() * 7; c.strokeStyle = mezcla(0x5f7a3a, 0xc8c07a, az()); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (az() - 0.5) * 3, y - l); c.stroke(); }
    for (let i = 0; i < 24; i++) { const x = az() * T, y = az() * T, r = 3 + az() * 9; c.fillStyle = mezcla(0x9a948a, 0xd8d2c4, az()); c.beginPath(); c.ellipse(x, y, r, r * 0.7, az() * 3, 0, Math.PI * 2); c.fill(); }
    const tex = nitida(new THREE.CanvasTexture(cv)); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
  }
  const cache = new Map();
  function textura(tipo) {
    if (cache.has(tipo)) return cache.get(tipo);
    let tex;
    if (tipo === "cenital") tex = pintarCenital();
    else {
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d");
      P[tipo](c);
      tex = nitida(new THREE.CanvasTexture(cv)); tex.wrapS = THREE.MirroredRepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
    }
    if (cache.size >= 3) { const [k0, t0] = cache.entries().next().value; t0.dispose(); cache.delete(k0); }
    cache.set(tipo, tex); return tex;
  }
  const grupo = new THREE.Group(); grupo.visible = false; scene.add(grupo);
  const telon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped: false, fog: false }));
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ roughness: 1 }));
  suelo.rotation.x = -Math.PI / 2; suelo.position.z = -40; suelo.receiveShadow = true;
  telon.userData.sinSombra = suelo.userData.sinSombra = true;
  telon.renderOrder = -1; grupo.add(telon, suelo);
  const matSuelo = {};
  const base = { hc: hemi.color.clone(), hg: hemi.groundColor.clone(), hi: hemi.intensity, lc: luz.color.clone(), li: luz.intensity };
  let tipo = null, sueloY = 0, oculto = false;
  const caja = new THREE.Box3();
  function poner(et) {
    tipo = et.fondo || null;
    if (!tipo || !CFG[tipo]) { grupo.visible = false; scene.fog = null; hemi.color.copy(base.hc); hemi.groundColor.copy(base.hg); hemi.intensity = base.hi; luz.color.copy(base.lc); luz.intensity = base.li; return; }
    const cf = CFG[tipo];
    caja.setFromObject(et.grupo); sueloY = Math.min(0, isFinite(caja.min.y) ? caja.min.y : 0) - 0.004;
    telon.material.map = textura(tipo); telon.material.needsUpdate = true;
    if (tipo === "cenital") { suelo.visible = false; scene.fog = null; }
    else {
      suelo.visible = true; suelo.position.y = sueloY;
      if (!matSuelo[tipo]) { matSuelo[tipo] = TX.mat(cf.tx, { color: cf.tc, rugosidad: 1, relieve: 2, rep: 48 }); }
      suelo.material = matSuelo[tipo];
      scene.fog = oculto ? null : new THREE.Fog(cf.niebla, 10, 40);
    }
    hemi.color.setHex(cf.cielo); hemi.groundColor.setHex(cf.suelo); hemi.intensity = cf.hi; luz.color.setHex(cf.luz); luz.intensity = cf.li;
    grupo.visible = !oculto;
    ajustar();
  }
  // Se recoloca con cada encuadre: el telón cubre siempre la vista y su base toca el suelo lejano
  function ajustar() {
    if (!tipo || !CFG[tipo]) return;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), cam = camera.position, tex = telon.material.map;
    if (tipo === "cenital") {
      const D = cam.z + 0.6, h = 2 * t * D * 2.6, w = h * Math.max(camera.aspect, 1);
      telon.scale.set(w, h, 1); telon.position.set(0, marco.cy, -0.6); tex.repeat.set(w / 3, h / 3); tex.offset.set(0, 0);
      return;
    }
    const zb = CFG[tipo].zb || ZB, D = cam.z + zb, hv = 2 * t * D, Hw = hv * (CFG[tipo].alto || 0.62), Ww = Hw * 2;
    const h = cam.y + hv * 1.3 - sueloY, w = hv * Math.max(camera.aspect, 0.6) * 2.6;
    telon.scale.set(w, h, 1); telon.position.set(0, sueloY + h / 2, -zb);
    tex.repeat.set(w / Ww, h / Hw); tex.offset.set(0.5 - w / Ww / 2, 0);
    if (scene.fog) { scene.fog.near = cam.z + 1.5; scene.fog.far = D; }
  }
  // Con la imagen de la cámara visible, el decorado se retira para ver el aula (realidad aumentada)
  function ocultar(v) { oculto = v; grupo.visible = !v && !!tipo; if (v) scene.fog = null; else if (tipo && tipo !== "cenital") { scene.fog = new THREE.Fog(CFG[tipo].niebla, 10, 40); ajustar(); } }
  return { poner, ajustar, ocultar };
})();

// Arco de medio punto: intradós de radio r (la luz es el diámetro)
function geometriaArco(r, grosor = 0.2, fondo = 0.8) {
  const f = new THREE.Shape();
  f.absarc(0, 0, r + grosor, 0, Math.PI, false);
  f.absarc(0, 0, r, Math.PI, 0, true);
  const g = new THREE.ExtrudeGeometry(f, { depth: fondo, bevelEnabled: false, curveSegments: 32 });
  g.translate(0, 0, -fondo / 2);
  return g;
}

// Partículas de agua reutilizables
function crearAgua(n, radio = 0.07) {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(radio, 8, 6), new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.2 }), n);
  m.frustumCulled = false;
  return m;
}
const VEL_AGUA = MOV_REDUCIDO ? 0.15 : 0.4;
const ficticio = new THREE.Object3D();
function situarGota(malla, i, x, y, z = 0) { ficticio.position.set(x, y, z); ficticio.updateMatrix(); malla.setMatrixAt(i, ficticio.matrix); }

// =====================================================================
// 2. ENCUADRE, PROYECCIÓN Y ETIQUETAS
// =====================================================================
let marco = { ancho: 7.6, alto: 5.0, cy: 1.8 };
function encuadrar() {
  if (renderer.xr.isPresenting) return; // v3.12: en realidad mixta la cámara la gobierna el visor
  const W = escena.clientWidth, H = escena.clientHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  const lateral = window.matchMedia("(orientation: landscape) and (max-height: 520px)").matches;
  // En horizontal, HUD y controles comparten columna: el HUD se limita al espacio libre y se desplaza
  const hudEl = $("hud");
  if (lateral) { hudEl.style.maxHeight = Math.max(110, $("controles").getBoundingClientRect().top - hudEl.offsetTop - 10) + "px"; hudEl.style.overflowY = "auto"; }
  else { hudEl.style.maxHeight = ""; hudEl.style.overflowY = ""; }
  const hud = hudEl.getBoundingClientRect(), ctr = $("controles").getBoundingClientRect();
  const z = lateral
    ? { x0: Math.max(hud.right, ctr.right) + 8, x1: W - 8, y0: 8, y1: H - 8 }
    : { x0: 8, x1: W - 8, y0: hud.bottom + 8, y1: ctr.top - 8 };
  const libreW = Math.max(z.x1 - z.x0, W * 0.3), libreH = Math.max(z.y1 - z.y0, H * 0.25);
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const d = Math.max((marco.ancho / 2) / (t * camera.aspect) * (W / libreW), (marco.alto / 2) / t * (H / libreH));
  camera.position.set(0, marco.cy + 0.5, d);
  camera.lookAt(0, marco.cy, 0);
  camera.setViewOffset(W, H, W / 2 - (z.x0 + libreW / 2), H / 2 - (z.y0 + libreH / 2), W, H);
  camera.updateProjectionMatrix();
  // Sombras: el volumen de la luz se ajusta al marco de la etapa para aprovechar toda la resolución
  const ext = Math.max(marco.ancho, marco.alto) * 0.75 + 0.5, sc = luz.shadow.camera;
  luz.target.position.set(0, marco.cy, 0); luz.position.set(ext * 0.8, marco.cy + ext * 1.5, ext * 1.3);
  sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 0.1; sc.far = ext * 6; sc.updateProjectionMatrix();
  DEC.ajustar();
  const dpr = Math.min(window.devicePixelRatio, 2);
  lienzoManos.width = W * dpr; lienzoManos.height = H * dpr;
  ctxM.setTransform(dpr, 0, 0, dpr, 0, 0);
  lienzoEf.width = W * dpr; lienzoEf.height = H * dpr;
  ctxE.setTransform(dpr, 0, 0, dpr, 0, 0); efectosPintados = true;
}
window.addEventListener("resize", encuadrar);
new ResizeObserver(encuadrar).observe($("hud"));
new ResizeObserver(encuadrar).observe($("controles"));

const v3 = new THREE.Vector3();
function aPantalla(x, y, z = 0) {
  v3.set(x, y, z).project(camera);
  return { x: (v3.x * 0.5 + 0.5) * escena.clientWidth, y: (-v3.y * 0.5 + 0.5) * escena.clientHeight };
}
// v3.12 · Coordenadas en el marco del contenedor de la etapa: la escena en pantalla (resultado idéntico
// al de la v3.11.4) o la maqueta escalada del modo de realidad mixta.
const vMarco = new THREE.Vector3(), planoMarco = new THREE.Plane();
function contenedorEtapa() { const c = etapa && etapa.grupo && etapa.grupo.parent; return c && c !== scene ? c : null; }
function aPantallaMarco(x, y, z = 0) {
  const c = contenedorEtapa();
  if (!c) return aPantalla(x, y, z);
  vMarco.set(x, y, z); c.localToWorld(vMarco);
  return aPantalla(vMarco.x, vMarco.y, vMarco.z);
}
function pixelesPorMetro() {
  const a = aPantallaMarco(0, 0), b = aPantallaMarco(0, 1);
  return Math.hypot(b.x - a.x, b.y - a.y) || 1;
}
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
function rayo(sx, sy) {
  ndc.set((sx / escena.clientWidth) * 2 - 1, -(sy / escena.clientHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster;
}
function toca(sx, sy, objetos) { return rayo(sx, sy).intersectObjects([].concat(objetos), true).length > 0; }
const planoZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
function enPlano(sx, sy) {
  const p = new THREE.Vector3(), c = contenedorEtapa();
  if (!c) return rayo(sx, sy).ray.intersectPlane(planoZ0, p) ? p : null;
  c.updateMatrixWorld(true);
  planoMarco.copy(planoZ0).applyMatrix4(c.matrixWorld);
  return rayo(sx, sy).ray.intersectPlane(planoMarco, p) ? c.worldToLocal(p) : null;
}

let etiquetas = [];
function etiqueta(texto, clase, posFn) {
  const el = document.createElement("span");
  el.className = "etq " + (clase || "");
  el.textContent = texto;
  $("etiquetas").appendChild(el);
  const e = { el, posFn, set texto(t) { if (el.textContent !== t) el.textContent = t; } };
  etiquetas.push(e);
  return e;
}
function limpiarEtiquetas() { etiquetas.forEach((e) => e.el.remove()); etiquetas = []; }
function actualizarEtiquetas() {
  for (const e of etiquetas) {
    const p = e.posFn();
    if (!p) { e.el.hidden = true; continue; }
    e.el.hidden = false;
    const s = aPantallaMarco(p[0], p[1], p[2] || 0);
    e.el.style.left = s.x + "px"; e.el.style.top = s.y + "px";
  }
}

// Desordena las opciones para que la respuesta correcta no esté siempre en el mismo sitio
function barajar(l) { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// Tablillas de respuesta con texto variable (preguntas encadenadas dentro de una etapa)
function tablillasP(g, n, x, y0, paso, w = 1.15, z = 0.08) {
  const t = Array.from({ length: n }, (_, i) => { const m = caja(w, 0.42, 0.06, M.madera); m.position.set(x, y0 - i * paso, z); m.visible = false; m.userData.i = i; g.add(m); return m; });
  let ops = [];
  return {
    poner(o) { ops = o; t.forEach((m, i) => (m.visible = i < o.length)); },
    ocultar() { ops = []; t.forEach((m) => (m.visible = false)); },
    tocar(px, py) { const h = rayo(px, py).intersectObjects(t.filter((m) => m.visible), false)[0]; return h ? h.object.userData.i : null; },
    etiquetas() { t.forEach((m, i) => { const e = etiqueta("", "geo", () => { if (!m.visible || !ops[i]) return null; e.texto = ops[i][0]; return [x, y0 - i * paso + 0.02, z + 0.08]; }); }); },
    get ops() { return ops; }
  };
}

// Controles alternativos (DUA)
function filaRango(etq, min, max, paso, valor, alCambiar, texto) {
  const id = "alt-" + Math.random().toString(36).slice(2, 8);
  const fila = document.createElement("div"); fila.className = "fila";
  const l = document.createElement("label"); l.htmlFor = id; l.textContent = etq;
  const r = document.createElement("input"); r.type = "range"; r.id = id; r.min = min; r.max = max; r.step = paso; r.value = valor;
  const sinc = () => r.setAttribute("aria-valuetext", texto(parseFloat(r.value)));
  r.addEventListener("input", () => { alCambiar(parseFloat(r.value)); sinc(); });
  sinc();
  fila.append(l, r); alternativos.appendChild(fila);
  return { poner(v) { r.value = v; sinc(); } };
}
function filaBotones(lista) {
  const fila = document.createElement("div"); fila.className = "fila";
  for (const [txt, fn] of lista) {
    const b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.addEventListener("click", fn); fila.appendChild(b);
  }
  alternativos.appendChild(fila);
}


// =====================================================================
// v3.12 · ESTADO COMPARTIDO CON LOS CAPÍTULOS Y GANCHOS DEL MODO DE REALIDAD MIXTA
// =====================================================================
// Un módulo no permite reasignar variables importadas: los capítulos cambian estas ocho con fijarMotor,
// que devuelve el valor asignado (así la expresión original conserva su resultado).
function fijarMotor(nombre, valor) {
  switch (nombre) {
    case "actual": actual = valor; break;
    case "etapa": etapa = valor; break;
    case "captura": captura = valor; break;
    case "categoriaPrevia": categoriaPrevia = valor; break;
    case "marco": marco = valor; break;
    case "registro": registro = valor; break;
    case "ratioMax": ratioMax = valor; break;
    case "sonidoActivo": sonidoActivo = valor; break;
    default: throw new Error("fijarMotor: variable desconocida " + nombre);
  }
  return valor;
}
// Enlace con el gestor del capítulo: hechas, modo, guardarRegistro y pDown viven en cada página.
// Hasta que el capítulo se enlaza, acceder a ellos falla igual que fallaba antes por la zona muerta temporal.
const capitulo = {
  hechas() { throw new ReferenceError("capítulo sin enlazar: hechas"); },
  modo() { throw new ReferenceError("capítulo sin enlazar: modo"); },
  guardarRegistro() { throw new ReferenceError("capítulo sin enlazar: guardarRegistro"); },
  pDown() { throw new ReferenceError("capítulo sin enlazar: pDown"); }
};
function enlazarCapitulo(o) { Object.assign(capitulo, o); }

let adaptadorXR = null;
function registrarXRAdapter(a) { adaptadorXR = a; }
function avisarEtapaXR(e) { if (adaptadorXR && adaptadorXR.alCambiarEtapa) adaptadorXR.alCambiarEtapa(e); }
function tickXR(dt) { if (adaptadorXR && adaptadorXR.tick) adaptadorXR.tick(dt); }

export {
  THREE,
  $, escena, video, lienzo3d, lienzoManos, ctxM, estadoTxt, metricasDiv, notaDiv, alternativos, fmt, fmtSigno, clamp, MOV_REDUCIDO, DOCENTE, categoriaPrevia, actual, etapa, captura, estado, metricas, CLAVE_SONIDO, sonidoActivo, audioCtx, ultimoSonido, cambiosJuego, registro, erroresEtapa, ultimoError, ultimaActividad, fallosSeguidos, anillosPantalla, nivelPista, efectos, lienzoEf, ctxE, prepararAudio, sonar, retroalimentar, verPista, mostrarPista, reiniciarAyudas, intentarAgarre, onda, celebrar, calcularAnillos, efectosPintados, pintarEfectos, revisarInactividad, CALIDAD_LIGERA, renderer, ratioMax, ANISO, scene, camera, hemi, luz, relleno, TX, nitida, M, geoCaja, caja, matTrazo, aMalla, linea, lineaFina, liberar, suelo, prepararSombras, DEC, geometriaArco, crearAgua, VEL_AGUA, ficticio, situarGota, marco, encuadrar, v3, aPantalla, pixelesPorMetro, raycaster, ndc, rayo, toca, planoZ0, enPlano, etiquetas, etiqueta, limpiarEtiquetas, actualizarEtiquetas, barajar, tablillasP, filaRango, filaBotones,
  fijarMotor, enlazarCapitulo, registrarXRAdapter, avisarEtapaXR, tickXR
};
