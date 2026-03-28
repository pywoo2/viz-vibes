'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: string;
}

// Shared vertex shader for all modes
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Shared uniform header for all fragment shaders
const uniformHeader = `
  precision highp float;
  varying vec2 vUv;
  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float high;
  uniform float energy;
  uniform vec2 resolution;
  uniform vec2 mouse; // 0-1 normalized, (-1,-1) when inactive
`;

// Mode 1: Noise Field
const noiseFieldShader = uniformHeader + `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float t = time * 0.3;

    float n = 0.0;
    n += snoise(p * 1.5 + t * 0.5 + bass * 0.3) * (0.3 + bass * 0.4);
    n += snoise(p * 3.0 - t * 0.3 + mid * 0.2) * (0.2 + mid * 0.3);
    n += snoise(p * 6.0 + t * 0.8) * (0.1 + high * 0.3);

    float dist = length(p);
    float glow = energy * 0.5 / (dist + 0.5);

    // Mouse -- bright attractor that distorts noise
    float mouseGlow = 0.0;
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      mouseGlow = 0.02 / (md * md + 0.03);
      n += snoise(p * 2.0 + mp * 0.5 + t) * 0.06 / (md + 0.5);
    }

    float brightness = smoothstep(-0.3, 0.6, n) * (0.15 + energy * 0.85);
    brightness += glow * 0.3 + mouseGlow;
    brightness = pow(brightness, 0.8);

    vec3 color = vec3(brightness);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Mode 2: Waveform
const waveformShader = uniformHeader + `
  void main() {
    vec2 uv = vUv;
    float wave = 0.0;
    wave += sin(uv.x * 6.28 * 2.0 + time) * bass * 0.3;
    wave += sin(uv.x * 6.28 * 4.0 + time * 1.5) * mid * 0.2;
    wave += sin(uv.x * 6.28 * 8.0 + time * 2.0) * high * 0.1;

    // Mouse pulls the wave toward cursor
    if (mouse.x >= 0.0) {
      float dx = uv.x - mouse.x;
      float proximity = exp(-dx * dx * 20.0);
      wave += (mouse.y - 0.5) * proximity * 0.25;
    }

    float dist = abs(uv.y - 0.5 - wave * 0.3);
    float line = smoothstep(0.02, 0.0, dist);
    float glow = smoothstep(0.1, 0.0, dist) * 0.3;

    // Mouse glow at cursor
    float mouseGlow = 0.0;
    if (mouse.x >= 0.0) {
      float md = length(uv - mouse);
      mouseGlow = 0.008 / (md * md + 0.008);
    }

    float brightness = line + glow + mouseGlow;

    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 3: Particles
const particlesShader = uniformHeader + `
  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float maxParticles = 8.0 + energy * 17.0;
    float speed = 0.12 + energy * 0.12;

    float brightness = 0.0;
    for (int i = 0; i < 25; i++) {
      float fi = float(i);
      if (fi >= maxParticles) break;

      float angle1 = fi * 2.399 + time * speed * (0.5 + fract(fi * 0.37) * 0.5);
      float angle2 = fi * 1.673 + time * speed * (0.3 + fract(fi * 0.61) * 0.7);
      float radius = 0.3 + fract(fi * 0.71) * 0.6 + bass * 0.2;

      vec2 pos = vec2(
        sin(angle1) * radius,
        cos(angle2) * radius
      );

      // Mouse attracts particles toward cursor
      if (mouse.x >= 0.0) {
        vec2 mp = mouse * 2.0 - 1.0;
        mp.x *= resolution.x / resolution.y;
        vec2 toMouse = mp - pos;
        float md = length(toMouse);
        pos += toMouse * 0.1 / (md + 0.8);
      }

      float size = (0.006 + bass * 0.015) * (1.0 - fract(fi * 0.71) * 0.5);
      float d = length(p - pos);
      float glow = size / (d * d + 0.001);
      brightness += glow * (0.1 + energy * 0.4);
    }

    // Mouse cursor glow
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      brightness += 0.004 / (md * md + 0.008);
    }

    brightness = clamp(brightness, 0.0, 1.0);
    brightness = pow(brightness, 0.85);

    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 4: Rings
const ringsShader = uniformHeader + `
  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float dist = length(p);
    float t = time * 0.5;

    float rings = 0.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float radius = mod(t * 0.3 + fi * 0.2, 1.5);
      float ring = abs(dist - radius);
      float thickness = 0.008 + energy * 0.015;
      rings += smoothstep(thickness, 0.0, ring) * (1.0 - radius / 1.5) * (0.3 + energy * 0.7);
    }

    float glow = (0.02 + bass * 0.04) / (dist + 0.1);

    float mouseGlow = 0.0;
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      mouseGlow = 0.02 / (md * md + 0.03);
    }

    float brightness = rings + glow + mouseGlow;

    brightness = clamp(brightness, 0.0, 1.0);
    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 5: Grid
const gridShader = uniformHeader + `
  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float t = time * 0.2;

    float angle = atan(p.y, p.x);
    float dist = length(p);

    float gridR = fract(1.0 / (dist + 0.01) * 0.3 - t + bass * 0.1);
    float gridA = fract(angle / 0.3927);

    float lineR = smoothstep(0.05, 0.0, abs(gridR - 0.5) - 0.45);
    float lineA = smoothstep(0.05, 0.0, abs(gridA - 0.5) - 0.45);

    float grid = max(lineR, lineA) * (0.1 + energy * 0.4) / (dist + 0.3);

    float mouseGlow = 0.0;
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      mouseGlow = 0.015 / (md * md + 0.03);
    }

    float brightness = grid + mouseGlow;

    brightness = clamp(brightness, 0.0, 1.0);
    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 6: Plasma
const plasmaShader = uniformHeader + `
  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float t = time * 0.3;

    float v = 0.0;
    v += sin(p.x * 3.0 + t + bass * 2.0);
    v += sin(p.y * 3.0 + t * 0.7 + mid);
    v += sin((p.x + p.y) * 2.0 + t * 0.5);
    v += sin(length(p) * 4.0 - t + high);
    v = v * 0.25;

    float brightness = smoothstep(-0.5, 0.5, v) * (0.1 + energy * 0.5);

    // Mouse
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      brightness += 0.02 / (md * md + 0.03);
      v += sin(md * 8.0 - t * 2.0) * 0.15 / (md + 0.3);
    }

    brightness = clamp(brightness, 0.0, 1.0);
    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

export const VISUALIZER_MODES = [
  { id: 'noise', label: 'Noise Field', shader: noiseFieldShader },
  { id: 'waveform', label: 'Waveform', shader: waveformShader },
  { id: 'particles', label: 'Particles', shader: particlesShader },
  { id: 'rings', label: 'Rings', shader: ringsShader },
  { id: 'grid', label: 'Grid', shader: gridShader },
  { id: 'plasma', label: 'Plasma', shader: plasmaShader },
];

function getShaderForMode(mode: string): string {
  const found = VISUALIZER_MODES.find((m) => m.id === mode);
  return found ? found.shader : noiseFieldShader;
}

export default function Visualizer({ analyser, isPlaying, mode }: VisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const mouseRef = useRef({ x: -1, y: -1 });
  const uniformsRef = useRef<Record<string, THREE.IUniform>>({
    time: { value: 0 },
    bass: { value: 0 },
    mid: { value: 0 },
    high: { value: 0 },
    energy: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
    mouse: { value: new THREE.Vector2(-1, -1) },
  });

  // Initialize Three.js scene (once)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    const canvas = renderer.domElement;
    canvas.id = 'visualizer-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'auto';
    container.appendChild(canvas);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera — inside the sphere looking out
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 0.1); // slightly off center so OrbitControls works
    cameraRef.current = camera;

    // OrbitControls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // Sphere geometry — camera is inside, render BackSide
    const geometry = new THREE.SphereGeometry(50, 64, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: uniformsRef.current,
      vertexShader,
      fragmentShader: getShaderForMode('noise'),
      side: THREE.BackSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Resize
    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
      uniformsRef.current.resolution.value.set(
        rect.width * renderer.getPixelRatio(),
        rect.height * renderer.getPixelRatio()
      );
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animRef.current);
      controls.dispose();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []);

  // Update shader when mode changes
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const oldMaterial = mesh.material as THREE.ShaderMaterial;
    const newMaterial = new THREE.ShaderMaterial({
      uniforms: uniformsRef.current,
      vertexShader,
      fragmentShader: getShaderForMode(mode),
      side: THREE.BackSide,
    });
    mesh.material = newMaterial;
    oldMaterial.dispose();
  }, [mode]);

  // Render loop
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!renderer || !scene || !camera || !controls) return;

    const frequencyData = new Uint8Array(analyser?.frequencyBinCount || 128);

    const render = () => {
      animRef.current = requestAnimationFrame(render);

      // Audio analysis
      let bass = 0, mid = 0, high = 0, energy = 0;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(frequencyData);
        const bins = frequencyData.length;
        for (let i = 0; i < bins / 6; i++) bass += frequencyData[i];
        bass = bass / (bins / 6) / 255;
        for (let i = Math.floor(bins / 6); i < bins / 2; i++) mid += frequencyData[i];
        mid = mid / (bins / 3) / 255;
        for (let i = Math.floor(bins / 2); i < bins; i++) high += frequencyData[i];
        high = high / (bins / 2) / 255;
        energy = bass * 0.5 + mid * 0.3 + high * 0.2;
      }

      const time = (Date.now() - startTimeRef.current) / 1000;

      // Update uniforms
      const u = uniformsRef.current;
      u.time.value = time;
      u.bass.value = bass;
      u.mid.value = mid;
      u.high.value = high;
      u.energy.value = energy;
      u.mouse.value.set(mouseRef.current.x, mouseRef.current.y);

      controls.update();
      renderer.render(scene, camera);
    };

    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, isPlaying]);

  // Mouse tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height,
      };
    };
    const onLeave = () => {
      mouseRef.current = { x: -1, y: -1 };
    };

    window.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
