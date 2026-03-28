'use client';

import { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: string;
}

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const uniformHeader = `
  precision highp float;
  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float high;
  uniform float energy;
  uniform vec2 resolution;
  uniform vec2 mouse;
`;

// 2D simplex noise
const noise2DFunctions = `
  vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289_3(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289_2(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                             dot(x12.zw,x12.zw)), 0.0);
    m = m * m;
    m = m * m;
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
`;

// Mode 1: Noise Field
const noiseFieldShader = uniformHeader + noise2DFunctions + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    float t = time * 0.3;

    float noise = 0.0;
    noise += snoise(uv * 3.0 + t * 0.5 + bass * 0.3) * (0.3 + bass * 0.4);
    noise += snoise(uv * 6.0 - t * 0.3 + mid * 0.2) * (0.2 + mid * 0.3);
    noise += snoise(uv * 12.0 + t * 0.8) * (0.1 + high * 0.3);

    float brightness = smoothstep(-0.3, 0.6, noise) * (0.15 + energy * 0.85);
    brightness = pow(brightness, 0.8);

    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 2: Waveform
const waveformShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    float wave = sin(uv.x * 6.0 + time) * bass * 0.3
               + sin(uv.x * 12.0 + time * 1.5) * mid * 0.2
               + sin(uv.x * 24.0 + time * 2.0) * high * 0.1;

    float dist = abs(uv.y - 0.5 - wave * 0.5);
    float line = smoothstep(0.01, 0.0, dist);
    float glow = smoothstep(0.15, 0.0, dist) * 0.3;

    float brightness = (line + glow) * (0.3 + energy * 0.7);
    brightness = clamp(brightness, 0.0, 1.0);

    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 3: Particles
const particlesShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    float aspect = resolution.x / resolution.y;

    float maxParticles = 8.0 + energy * 17.0;
    float speed = 0.12 + energy * 0.12;

    float brightness = 0.0;
    for (int i = 0; i < 25; i++) {
      float fi = float(i);
      if (fi >= maxParticles) break;

      float px = fract(sin(fi * 43.758) * 0.5 + 0.5 + time * speed * (0.3 + fract(fi * 0.17) * 0.4));
      float py = fract(cos(fi * 27.619) * 0.5 + 0.5 + time * speed * (0.2 + fract(fi * 0.31) * 0.3));

      vec2 delta = vec2((uv.x - px) * aspect, uv.y - py);
      float d = length(delta);
      float size = 0.01 + bass * 0.02;
      brightness += size / (d * d + 0.001) * energy * 0.3;
    }

    brightness = clamp(brightness, 0.0, 1.0);
    brightness = pow(brightness, 0.85);

    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 4: Rings
const ringsShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 center = vec2(0.5);
    float dist = length(uv - center);

    float rings = 0.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float ringR = 0.1 + fi * 0.08 + sin(time * 0.3 + fi * 1.2) * 0.05;
      float d = abs(dist - ringR);
      float thickness = 0.005 + energy * 0.008;
      rings += smoothstep(thickness, 0.0, d) * (0.3 + energy * 0.7);
    }

    float glow = (0.02 + bass * 0.04) / (dist + 0.1);

    float brightness = rings + glow;
    brightness = clamp(brightness, 0.0, 1.0);

    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 5: Grid
const gridShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    float gridX = fract(uv.x * 10.0 + time * 0.1);
    float gridY = fract(uv.y * 10.0);

    float lineX = smoothstep(0.03, 0.0, abs(gridX - 0.5) - 0.47);
    float lineY = smoothstep(0.03, 0.0, abs(gridY - 0.5) - 0.47);

    float grid = max(lineX, lineY) * (0.1 + energy * 0.4);
    grid += lineY * bass * 0.3 + lineX * mid * 0.2;

    float brightness = clamp(grid, 0.0, 1.0);

    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 6: Plasma
const plasmaShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    float t = time * 0.3;

    float v = sin(uv.x * 6.0 + t + bass * 2.0)
            + sin(uv.y * 6.0 + t * 0.7 + mid)
            + sin((uv.x + uv.y) * 4.0 + t * 0.5)
            + sin(length(uv - 0.5) * 8.0 - t + high);
    v *= 0.25;

    float brightness = smoothstep(-0.5, 0.5, v) * (0.1 + energy * 0.5);
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

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, fragSource: string): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

export default function Visualizer({ analyser, isPlaying, mode }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const mouseRef = useRef({ x: -1, y: -1 });
  const modeRef = useRef(mode);

  // Keep modeRef in sync
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Initialize WebGL (once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    glRef.current = gl;

    // Full-screen quad (two triangles)
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    // Initial program
    const program = createProgram(gl, getShaderForMode(mode));
    if (program) {
      programRef.current = program;
      gl.useProgram(program);
      const posAttr = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posAttr);
      gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
    }

    // Resize handler
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const parent = canvas.parentElement;
    let observer: ResizeObserver | null = null;
    if (parent) {
      observer = new ResizeObserver(resize);
      observer.observe(parent);
    }

    return () => {
      if (observer) observer.disconnect();
      cancelAnimationFrame(animRef.current);
      if (buffer) gl.deleteBuffer(buffer);
      if (programRef.current) gl.deleteProgram(programRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompile shader when mode changes
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const newProgram = createProgram(gl, getShaderForMode(mode));
    if (newProgram) {
      if (programRef.current) gl.deleteProgram(programRef.current);
      programRef.current = newProgram;
      gl.useProgram(newProgram);
      const posAttr = gl.getAttribLocation(newProgram, 'position');
      gl.enableVertexAttribArray(posAttr);
      gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
    }
  }, [mode]);

  // Render loop
  useEffect(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas) return;

    const frequencyData = new Uint8Array(analyser?.frequencyBinCount || 128);

    const render = () => {
      animRef.current = requestAnimationFrame(render);

      const program = programRef.current;
      if (!program) return;

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

      gl.useProgram(program);

      // Set uniforms
      const loc = (name: string) => gl.getUniformLocation(program, name);
      gl.uniform1f(loc('time'), time);
      gl.uniform1f(loc('bass'), bass);
      gl.uniform1f(loc('mid'), mid);
      gl.uniform1f(loc('high'), high);
      gl.uniform1f(loc('energy'), energy);
      gl.uniform2f(loc('resolution'), canvas.width, canvas.height);
      gl.uniform2f(loc('mouse'), mouseRef.current.x, mouseRef.current.y);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, isPlaying]);

  // Mouse tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height,
      };
    };
    const onLeave = () => {
      mouseRef.current = { x: -1, y: -1 };
    };

    window.addEventListener('mousemove', onMove);
    parent.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      parent.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        id="visualizer-canvas"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
