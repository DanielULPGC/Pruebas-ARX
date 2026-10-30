import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { sound } from '../utils/audio';
import { 
  Compass, 
  RotateCcw, 
  Eye, 
  Glasses, 
  Hand, 
  Volume2, 
  VolumeX, 
  Layers, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Maximize2 
} from 'lucide-react';

export type HistoricalEra = 'prehistoria' | 'edad-media' | 'edad-moderna' | 'edad-contemporanea';

interface EraConfig {
  id: HistoricalEra;
  title: string;
  epoch: string;
  monument: string;
  description: string;
  accentColor: string;
}

export const ERAS: EraConfig[] = [
  {
    id: 'prehistoria',
    title: 'Prehistoria',
    epoch: '3500 a.C. · Megalitismo',
    monument: 'Dolmen y Dintel Ciclópeo',
    description: 'Erección de ortostatos de arenisca y suspensión de la gran losa de cobertura mediante planos inclinados y física gravitatoria.',
    accentColor: '#c2843a',
  },
  {
    id: 'edad-media',
    title: 'Edad Media',
    epoch: 'Siglo XIII · Arquitectura Gótica',
    monument: 'Arco Ojival y Piedra Clave',
    description: 'El arco apuntado canaliza las tensiones laterales hacia los pilares. La clave desciende y bloquea las dovelas por compresión pura.',
    accentColor: '#e0a96d',
  },
  {
    id: 'edad-moderna',
    title: 'Edad Moderna',
    epoch: 'Renacimiento · 1436 d.C.',
    monument: 'Cúpula Octogonal y Linterna',
    description: 'Innovación de Brunelleschi con tambor octogonal, nervios portantes autoportantes y remate con la linterna superior.',
    accentColor: '#38bdf8',
  },
  {
    id: 'edad-contemporanea',
    title: 'Edad Contemporánea',
    epoch: 'Siglos XX-XXI · Era del Acero',
    monument: 'Estructura Reticular y Vidrio',
    description: 'Entramado de vigas de acero soldadas y remachadas soportando módulos superiores con cerramientos de vidrio estructural.',
    accentColor: '#4ade80',
  },
];

// Physical drop class according to user's xr-fisica.js specification
class ActiveCaidaFisica3D {
  malla: THREE.Object3D;
  yDestino: number;
  vy: number;
  alEncajar: () => void;
  terminado: boolean;

  constructor(malla: THREE.Object3D, yDestino: number, alEncajar: () => void) {
    this.malla = malla;
    this.yDestino = yDestino;
    this.vy = 0;
    this.alEncajar = alEncajar;
    this.terminado = false;
  }

  step(dt: number) {
    if (this.terminado) return;
    this.vy -= 9.8 * dt;
    this.malla.position.y += this.vy * dt;
    if (this.malla.position.y <= this.yDestino) {
      this.malla.position.y = this.yDestino;
      if (Math.abs(this.vy) > 0.6) {
        this.vy = -this.vy * 0.25;
        sound.playStoneImpact();
      } else {
        this.terminado = true;
        this.alEncajar();
      }
    }
  }
}

export const XRSimulationMaquette: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEra, setSelectedEra] = useState<HistoricalEra>('prehistoria');
  const [isAssembled, setIsAssembled] = useState<boolean>(false);
  const [isPhysicsActive, setIsPhysicsActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] = useState<'tactil' | 'xr_pointer'>('tactil');
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);
  const [webXrAvailable, setWebXrAvailable] = useState<boolean>(false);
  const [xrSessionActive, setXrSessionActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Toca o pulsa «Soltar Pieza Clave con Físicas» para probar CaidaFisica3D');

  // Internal mutable refs for 3D state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const physicsRef = useRef<ActiveCaidaFisica3D | null>(null);
  const keyPieceRef = useRef<THREE.Object3D | null>(null);
  const activeGroupRef = useRef<THREE.Group | null>(null);
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const maquetteRigRef = useRef<THREE.Group | null>(null);
  const initialKeyYRef = useRef<number>(2.4);
  const targetKeyYRef = useRef<number>(1.2);

  // Check WebXR support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator && navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setWebXrAvailable(supported);
      }).catch(() => {
        setWebXrAvailable(false);
      });
    }
  }, []);

  // Build Procedural 3D Model for the selected era
  const buildEraModel = useCallback((era: HistoricalEra, scene: THREE.Scene) => {
    if (activeGroupRef.current) {
      scene.remove(activeGroupRef.current);
      activeGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    const group = new THREE.Group();
    group.name = `era-${era}`;
    activeGroupRef.current = group;

    // Procedural stone texture canvas
    const createStoneCanvas = (baseColor: string, grainColor: string) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.fillStyle = Math.random() > 0.5 ? grainColor : 'rgba(0,0,0,0.15)';
        ctx.fillRect(x, y, 1.5, 1.5);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    if (era === 'prehistoria') {
      // 1. PREHISTORIA: Dolmen megalítico
      const stoneTex = createStoneCanvas('#82786a', '#a39785');
      const stoneMat = new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.92,
        metalness: 0.05,
      });

      // Left Pillar (Orthostat)
      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.3, 0.55), stoneMat);
      leftPillar.position.set(-0.7, 0.65, 0);
      leftPillar.rotation.y = 0.08;
      leftPillar.castShadow = true;
      leftPillar.receiveShadow = true;
      group.add(leftPillar);

      // Right Pillar (Orthostat)
      const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.3, 0.55), stoneMat);
      rightPillar.position.set(0.7, 0.65, 0);
      rightPillar.rotation.y = -0.06;
      rightPillar.castShadow = true;
      rightPillar.receiveShadow = true;
      group.add(rightPillar);

      // Rear support stone
      const backPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.25, 0.35), stoneMat);
      backPillar.position.set(0, 0.62, -0.45);
      backPillar.castShadow = true;
      backPillar.receiveShadow = true;
      group.add(backPillar);

      // Surrounding Megaliths in circular ring
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x6e665a, roughness: 0.95 });
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 1.6 + 0.3;
        const dist = 1.6;
        const smallStone = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.6 + Math.random() * 0.3, 0.25),
          ringMat
        );
        smallStone.position.set(Math.cos(angle) * dist, 0.3, Math.sin(angle) * dist);
        smallStone.rotation.y = angle;
        group.add(smallStone);
      }

      // KEY PIECE: The massive Lintel Stone (Dintel)
      const lintelMat = new THREE.MeshStandardMaterial({
        map: stoneTex,
        roughness: 0.88,
        color: 0x938877,
      });
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.4, 1.1), lintelMat);
      lintel.position.set(0, 2.3, -0.05);
      lintel.castShadow = true;
      lintel.receiveShadow = true;
      group.add(lintel);

      keyPieceRef.current = lintel;
      initialKeyYRef.current = 2.3;
      targetKeyYRef.current = 1.48; // Sits flush on top of pillars (0.65 + 0.65 + 0.2 - 0.02)
    } else if (era === 'edad-media') {
      // 2. EDAD MEDIA: Arco ojival gótico de sillería
      const ashlarTex = createStoneCanvas('#9c9183', '#c2b6a7');
      const ashlarMat = new THREE.MeshStandardMaterial({
        map: ashlarTex,
        roughness: 0.78,
        metalness: 0.1,
      });
      const darkAshlar = new THREE.MeshStandardMaterial({
        map: ashlarTex,
        color: 0x73695c,
        roughness: 0.85,
      });

      // Left Column + Capital
      const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.4, 16), ashlarMat);
      colL.position.set(-0.75, 0.7, 0);
      colL.castShadow = true;
      group.add(colL);
      const capL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.48), darkAshlar);
      capL.position.set(-0.75, 1.45, 0);
      group.add(capL);

      // Right Column + Capital
      const colR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.4, 16), ashlarMat);
      colR.position.set(0.75, 0.7, 0);
      colR.castShadow = true;
      group.add(colR);
      const capR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.15, 0.48), darkAshlar);
      capR.position.set(0.75, 1.45, 0);
      group.add(capR);

      // Left arch voussoirs (dovelas)
      const archL = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.14, 12, 16, Math.PI * 0.38), ashlarMat);
      archL.rotation.z = Math.PI * 0.12;
      archL.position.set(-0.75, 1.45, 0);
      group.add(archL);

      // Right arch voussoirs
      const archR = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.14, 12, 16, Math.PI * 0.38), ashlarMat);
      archR.rotation.z = Math.PI * 0.5;
      archR.position.set(0.75, 1.45, 0);
      group.add(archR);

      // Secondary decorative finials
      const finialL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), darkAshlar);
      finialL.position.set(-0.95, 1.8, 0);
      group.add(finialL);
      const finialR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), darkAshlar);
      finialR.position.set(0.95, 1.8, 0);
      group.add(finialR);

      // KEY PIECE: Keystone (Piedra Clave)
      const keystoneMat = new THREE.MeshStandardMaterial({
        color: 0xd4a373,
        roughness: 0.7,
        metalness: 0.15,
      });
      const keystone = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.14, 0.35, 4), keystoneMat);
      keystone.rotation.y = Math.PI * 0.25;
      keystone.position.set(0, 2.6, 0);
      keystone.castShadow = true;
      group.add(keystone);

      keyPieceRef.current = keystone;
      initialKeyYRef.current = 2.6;
      targetKeyYRef.current = 2.05;
    } else if (era === 'edad-moderna') {
      // 3. EDAD MODERNA: Cúpula renacentista octogonal (Brunelleschi)
      const marbleTex = createStoneCanvas('#e8e4dc', '#ffffff');
      const drumMat = new THREE.MeshStandardMaterial({
        map: marbleTex,
        roughness: 0.65,
        color: 0xeeebe5,
      });
      const terracottaMat = new THREE.MeshStandardMaterial({
        color: 0xb55a30,
        roughness: 0.72,
        metalness: 0.08,
      });
      const ribMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.45,
        metalness: 0.2,
      });

      // Octagonal Drum (Tambor)
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.7, 8), drumMat);
      drum.position.set(0, 0.35, 0);
      drum.castShadow = true;
      group.add(drum);

      // Drum oculi (circular windows)
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const oculus = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12),
          new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.3 })
        );
        oculus.rotation.x = Math.PI / 2;
        oculus.rotation.z = -ang;
        oculus.position.set(Math.sin(ang) * 1.01, 0.35, Math.cos(ang) * 1.01);
        group.add(oculus);
      }

      // Dome Segments (Velas de ladrillo)
      const domeBase = new THREE.Mesh(
        new THREE.SphereGeometry(0.96, 8, 16, 0, Math.PI * 2, 0, Math.PI * 0.44),
        terracottaMat
      );
      domeBase.position.set(0, 0.7, 0);
      domeBase.castShadow = true;
      group.add(domeBase);

      // 8 Exterior White Ribs (Nervaduras de mármol blanco)
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.12), ribMat);
        rib.position.set(Math.sin(ang) * 0.75, 1.15, Math.cos(ang) * 0.75);
        rib.rotation.y = -ang;
        rib.rotation.x = 0.42;
        group.add(rib);
      }

      // KEY PIECE: Upper Marble Lantern (Linterna de mármol)
      const lanternGroup = new THREE.Group();
      const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.4, 8), ribMat);
      const lanternCone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.35, 8), ribMat);
      lanternCone.position.y = 0.35;
      const goldenBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 12),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.15 })
      );
      goldenBall.position.y = 0.58;
      lanternGroup.add(lanternBody, lanternCone, goldenBall);
      lanternGroup.position.set(0, 2.7, 0);
      group.add(lanternGroup);

      keyPieceRef.current = lanternGroup;
      initialKeyYRef.current = 2.7;
      targetKeyYRef.current = 1.62;
    } else {
      // 4. EDAD CONTEMPORÁNEA: Entramado de rascacielos de acero y cristal
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x3b4252,
        roughness: 0.35,
        metalness: 0.85,
      });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88c0d0,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.85,
        transparent: true,
        opacity: 0.7,
      });

      // 4 Main Steel Columns
      const colCoords = [
        [-0.6, -0.6],
        [0.6, -0.6],
        [-0.6, 0.6],
        [0.6, 0.6],
      ];
      colCoords.forEach(([x, z]) => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.12), steelMat);
        beam.position.set(x, 0.75, z);
        beam.castShadow = true;
        group.add(beam);
      });

      // Cross bracings (Cerchas en X)
      for (let level = 0; level < 2; level++) {
        const yLvl = 0.4 + level * 0.7;
        const ring = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.3), steelMat);
        ring.position.set(0, yLvl, 0);
        group.add(ring);
      }

      // Lower glass floor volume
      const lowerCore = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 1.0), glassMat);
      lowerCore.position.set(0, 0.75, 0);
      group.add(lowerCore);

      // KEY PIECE: Upper Spire & Crown Penthouse Module
      const crownGroup = new THREE.Group();
      const topDeck = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.12, 1.24), steelMat);
      const crownGlass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.9), glassMat);
      crownGlass.position.y = 0.35;
      const mastSpire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.08, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0xd8dee9, metalness: 0.95, roughness: 0.2 })
      );
      mastSpire.position.y = 0.95;
      crownGroup.add(topDeck, crownGlass, mastSpire);
      crownGroup.position.set(0, 2.8, 0);
      group.add(crownGroup);

      keyPieceRef.current = crownGroup;
      initialKeyYRef.current = 2.8;
      targetKeyYRef.current = 1.55;
    }

    // Set rig positioning
    group.position.set(0, 0, 0);
    scene.add(group);
    setIsAssembled(false);
    setIsPhysicsActive(false);
    physicsRef.current = null;
    setStatusMessage(`Era cargada: ${ERAS.find((e) => e.id === era)?.monument}. Pieza clave lista en suspensión.`);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect software WebGL as recommended in Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x1c1917, 0.04);

    const camera = new THREE.PerspectiveCamera(46, container.clientWidth / container.clientHeight, 0.1, 80);
    camera.position.set(0, 2.0, 3.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 1.2;
    controls.maxDistance = 8.0;
    controls.target.set(0, 0.9, 0);
    controlsRef.current = controls;

    // Studio Environment (RoomEnvironment PMREM)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point lighting rig
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    keyLight.position.set(3.5, 5, 2.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x738a9c, 0x2d241e, 1.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x88c0d0, 0.9);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // Architectural Pedestal / Maquette Platform
    const maquetteRig = new THREE.Group();
    scene.add(maquetteRig);
    maquetteRigRef.current = maquetteRig;

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.3, 0.14, 48),
      new THREE.MeshStandardMaterial({
        color: 0x221f1d,
        roughness: 0.7,
        metalness: 0.2,
      })
    );
    pedestal.position.y = -0.07;
    pedestal.receiveShadow = true;
    maquetteRig.add(pedestal);

    // Subtle grid markings on the pedestal
    const gridCircle = new THREE.PolarGridHelper(2.1, 4, 8, 32, 0xc2843a, 0x44403c);
    gridCircle.position.y = 0.002;
    maquetteRig.add(gridCircle);

    // Soft Contact Shadow Plane underneath
    const shadowGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.15;
    maquetteRig.add(shadowPlane);

    // XR Virtual Ray Cursor Sphere (from xr-adapter.js specification)
    const cursor3D = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false })
    );
    cursor3D.renderOrder = 20;
    cursor3D.visible = false;
    scene.add(cursor3D);
    cursorRef.current = cursor3D;

    // Build the default initial era
    buildEraModel('prehistoria', scene);

    // Animation Loop with Clock
    const clock = new THREE.Clock();
    let animId = 0;

    const tick = () => {
      const dt = clock.getDelta();

      // Step gravity physics if active
      if (physicsRef.current) {
        physicsRef.current.step(dt);
      }

      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [buildEraModel]);

  // Handle Era Change
  const changeEra = (era: HistoricalEra) => {
    sound.playClick();
    setSelectedEra(era);
    if (sceneRef.current) {
      buildEraModel(era, sceneRef.current);
    }
  };

  // Trigger Physical Drop (CaidaFisica3D)
  const triggerDrop = () => {
    const keyPiece = keyPieceRef.current;
    if (!keyPiece || isAssembled) return;

    sound.playClick();
    setIsPhysicsActive(true);
    setStatusMessage('La pieza desciende bajo aceleración de gravedad (9.8m/s²)...');

    physicsRef.current = new ActiveCaidaFisica3D(
      keyPiece,
      targetKeyYRef.current,
      () => {
        setIsAssembled(true);
        setIsPhysicsActive(false);
        sound.playSnap();
        sound.playCompletion();
        setStatusMessage('¡Encaje milimétrico completado! El monumento ha alcanzado el equilibrio estático.');
      }
    );
  };

  // Reset Piece to suspension height
  const resetPiece = () => {
    sound.playClick();
    const keyPiece = keyPieceRef.current;
    if (!keyPiece) return;

    keyPiece.position.y = initialKeyYRef.current;
    setIsAssembled(false);
    setIsPhysicsActive(false);
    physicsRef.current = null;
    setStatusMessage('Pieza reseteada en suspensión. Lista para volver a probar.');
  };

  // Reset Camera View
  const resetCamera = () => {
    sound.playClick();
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 2.0, 3.8);
      controlsRef.current.target.set(0, 0.9, 0);
      controlsRef.current.update();
    }
  };

  // Toggle WebXR or Simulated Laser Mode
  const toggleXrMode = async () => {
    sound.playClick();
    if (webXrAvailable && rendererRef.current && navigator.xr) {
      try {
        const session = await navigator.xr.requestSession('immersive-ar', {
          optionalFeatures: ['local-floor', 'hand-tracking', 'dom-overlay'],
          domOverlay: { root: document.body },
        });
        rendererRef.current.xr.enabled = true;
        await rendererRef.current.xr.setSession(session);
        setXrSessionActive(true);
        setStatusMessage('Sesión WebXR activa en tus gafas/dispositivo. Apunta y haz pinza.');
        session.addEventListener('end', () => {
          setXrSessionActive(false);
          if (rendererRef.current) rendererRef.current.xr.enabled = false;
        });
        return;
      } catch (e) {
        console.warn('WebXR requestSession failed:', e);
      }
    }

    // Toggle virtual laser pointer simulation
    if (interactionMode === 'tactil') {
      setInteractionMode('xr_pointer');
      if (cursorRef.current) cursorRef.current.visible = true;
      setStatusMessage('Simulador XR Blocks activo: Puntero láser 3D visible sobre la maqueta (escala 0.55m).');
    } else {
      setInteractionMode('tactil');
      if (cursorRef.current) cursorRef.current.visible = false;
      setStatusMessage('Modo Táctil / Ratón activado.');
    }
  };

  // Mouse move in container for pointer ray simulation
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (interactionMode !== 'xr_pointer' || !containerRef.current || !cursorRef.current || !cameraRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast onto virtual plane
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const target = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, target)) {
      cursorRef.current.position.set(target.x, target.y, target.z);
    }
  };

  const currentEraObj = ERAS.find((e) => e.id === selectedEra)!;

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-white/10 bg-[#141210] shadow-2xl select-none">
      {/* Top Banner / Era Indicator */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-3 bg-[#1c1917]/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 shadow-lg pointer-events-auto">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentEraObj.accentColor }}
          />
          <div>
            <div className="text-xs uppercase tracking-wider text-[#a8a29e] font-semibold">
              {currentEraObj.epoch}
            </div>
            <div className="text-sm font-bold text-[#faf7f2] font-historical">
              {currentEraObj.title} · {currentEraObj.monument}
            </div>
          </div>
        </div>

        {/* Status Message Pill */}
        <div className="bg-[#1c1917]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs font-medium text-[#faf7f2] flex items-center gap-2 pointer-events-auto max-w-md">
          {isAssembled ? (
            <CheckCircle2 className="w-4 h-4 text-[#4ade80] shrink-0" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-[#c2843a] shrink-0" />
          )}
          <span className="truncate">{statusMessage}</span>
        </div>

        {/* Quick Utility Icons */}
        <div className="flex items-center gap-1.5 bg-[#1c1917]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 pointer-events-auto">
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              sound.setMuted(nextMuted);
            }}
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            className="p-2 rounded-lg text-[#a8a29e] hover:text-[#faf7f2] hover:bg-white/5 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#c2843a]" />}
          </button>
          <button
            onClick={resetCamera}
            title="Centrar vista 3D"
            className="p-2 rounded-lg text-[#a8a29e] hover:text-[#faf7f2] hover:bg-white/5 transition"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Interactive Watermark / Hint */}
      <div className="absolute top-20 right-4 z-10 hidden sm:flex items-center gap-2 text-xs text-[#a8a29e]/70 bg-black/40 px-3 py-1.5 rounded-lg pointer-events-none">
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Arrastra para rotar · Rueda para zoom</span>
      </div>

      {/* Unified Ergonomic Bottom Control Dock (Compliant with Three.js skill directive) */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-4xl transition-transform duration-300 ${
          isHudCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Toggle Button */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setIsHudCollapsed(!isHudCollapsed)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-t-lg bg-[#292524] border-t border-x border-white/10 text-[#a8a29e] hover:text-[#faf7f2] shadow-md transition"
          >
            {isHudCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-[#c2843a]" />
                <span>Mostrar Controles XR</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#c2843a]" />
                <span>Ocultar Controles (Modo Cine)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Dock Container */}
        <div className="bg-[#1c1917]/95 border border-white/15 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col gap-3">
          {/* Historical Era Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ERAS.map((era) => {
              const active = selectedEra === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => changeEra(era.id)}
                  className={`flex flex-col text-left px-3 py-2 rounded-xl transition border text-xs ${
                    active
                      ? 'bg-[#c2843a]/20 border-[#c2843a] text-[#faf7f2] font-semibold shadow-sm'
                      : 'bg-white/5 border-transparent text-[#a8a29e] hover:bg-white/10 hover:text-[#faf7f2]'
                  }`}
                >
                  <span className="font-bold font-historical">{era.title}</span>
                  <span className="text-[10px] opacity-75 truncate">{era.monument}</span>
                </button>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
            {/* Primary Construction Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={triggerDrop}
                disabled={isAssembled || isPhysicsActive}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition ${
                  isAssembled
                    ? 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/40 cursor-default'
                    : isPhysicsActive
                    ? 'bg-[#e3a85c] text-[#1c1917] cursor-wait'
                    : 'bg-[#c2843a] hover:bg-[#e3a85c] text-[#1c1917] active:scale-95 shadow-lg'
                }`}
              >
                <Layers className="w-4 h-4" />
                {isAssembled
                  ? '¡Monumento Ensamblado!'
                  : isPhysicsActive
                  ? 'Cayendo con Física...'
                  : 'Soltar Pieza Clave (CaidaFisica3D)'}
              </button>

              <button
                onClick={resetPiece}
                title="Reiniciar posición de la pieza clave"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#a8a29e] hover:text-[#faf7f2] border border-white/10 transition text-xs font-medium flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
            </div>

            {/* XR & Pointer Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleXrMode}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                  interactionMode === 'xr_pointer' || xrSessionActive
                    ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]'
                    : 'bg-white/5 border-white/10 text-[#a8a29e] hover:text-[#faf7f2] hover:bg-white/10'
                }`}
              >
                <Glasses className="w-3.5 h-3.5" />
                <span>
                  {webXrAvailable
                    ? 'Iniciar WebXR Gafas'
                    : interactionMode === 'xr_pointer'
                    ? 'Láser XR Activo'
                    : 'Simular Láser XR'}
                </span>
              </button>

              <div className="hidden md:flex items-center gap-1 text-[11px] text-[#a8a29e] bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                <Hand className="w-3 h-3 text-[#c2843a]" />
                <span>Rig maqueta: 0.55m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
