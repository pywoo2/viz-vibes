'use client';

import { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: string;
}

// Vertex shader — full screen quad (shared across all modes)
const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Shared uniform header for all fragment shaders
const uniformHeader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float high;
  uniform float energy;
`;

// Mode 1: Noise Field (original)
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
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float t = time * 0.3;

    float n = 0.0;
    n += snoise(p * 1.5 + t * 0.5 + bass * 0.3) * (0.3 + bass * 0.4);
    n += snoise(p * 3.0 - t * 0.3 + mid * 0.2) * (0.2 + mid * 0.3);
    n += snoise(p * 6.0 + t * 0.8) * (0.1 + high * 0.3);

    float dist = length(p);
    float glow = energy * 0.5 / (dist + 0.5);

    float brightness = smoothstep(-0.3, 0.6, n) * (0.15 + energy * 0.85);
    brightness += glow * 0.3;
    brightness = pow(brightness, 0.8);

    vec3 color = vec3(brightness);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Mode 2: Waveform
const waveformShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    float wave = 0.0;
    wave += sin(uv.x * 6.28 * 2.0 + time) * bass * 0.3;
    wave += sin(uv.x * 6.28 * 4.0 + time * 1.5) * mid * 0.2;
    wave += sin(uv.x * 6.28 * 8.0 + time * 2.0) * high * 0.1;

    float dist = abs(uv.y - 0.5 - wave * 0.3);
    float line = smoothstep(0.02, 0.0, dist);
    float glow = smoothstep(0.1, 0.0, dist) * 0.3;

    float brightness = line + glow;
    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 3: Particles
const particlesShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float brightness = 0.0;
    for (int i = 0; i < 30; i++) {
      float fi = float(i);
      vec2 pos = vec2(
        sin(fi * 1.7 + time * 0.2 + mid) * 0.8,
        cos(fi * 2.3 + time * 0.15 + bass * 0.5) * 0.8
      );
      float size = 0.01 + bass * 0.02;
      float d = length(p - pos);
      brightness += size / (d + 0.01) * energy * 0.3;
    }

    brightness = clamp(brightness, 0.0, 1.0);
    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

export const VISUALIZER_MODES = [
  { id: 'noise', label: 'Noise Field', shader: noiseFieldShader },
  { id: 'waveform', label: 'Waveform', shader: waveformShader },
  { id: 'particles', label: 'Particles', shader: particlesShader },
];

function getShaderForMode(mode: string): string {
  const found = VISUALIZER_MODES.find((m) => m.id === mode);
  return found ? found.shader : noiseFieldShader;
}

function compileProgram(gl: WebGLRenderingContext, fragSource: string): WebGLProgram | null {
  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vs, vertexShader);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error('Vertex shader error:', gl.getShaderInfoLog(vs));
    gl.deleteShader(vs);
    return null;
  }

  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fs, fragSource);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error('Fragment shader error:', gl.getShaderInfoLog(fs));
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }

  // Clean up shaders (they're linked into the program now)
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  return program;
}

export default function Visualizer({ analyser, isPlaying, mode }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  // Initialize WebGL context (once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;

    // Create vertex buffer (shared across all programs)
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    bufferRef.current = buffer;

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Compile shader program when mode changes
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    // Delete old program
    if (programRef.current) {
      gl.deleteProgram(programRef.current);
      programRef.current = null;
    }

    const fragSource = getShaderForMode(mode);
    const program = compileProgram(gl, fragSource);
    if (!program) return;

    gl.useProgram(program);
    programRef.current = program;

    // Re-bind vertex buffer attributes
    if (bufferRef.current) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
      const pos = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    }
  }, [mode]);

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      glRef.current?.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Render loop
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    const frequencyData = new Uint8Array(analyser?.frequencyBinCount || 128);

    const render = () => {
      animRef.current = requestAnimationFrame(render);

      const program = programRef.current;
      if (!program) return;

      // Get audio data
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
        energy = (bass * 0.5 + mid * 0.3 + high * 0.2);
      }

      const time = (Date.now() - startTimeRef.current) / 1000;

      gl.uniform2f(gl.getUniformLocation(program, 'resolution'), gl.canvas.width, gl.canvas.height);
      gl.uniform1f(gl.getUniformLocation(program, 'time'), time);
      gl.uniform1f(gl.getUniformLocation(program, 'bass'), bass);
      gl.uniform1f(gl.getUniformLocation(program, 'mid'), mid);
      gl.uniform1f(gl.getUniformLocation(program, 'high'), high);
      gl.uniform1f(gl.getUniformLocation(program, 'energy'), energy);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, isPlaying]);

  return <canvas ref={canvasRef} id="visualizer-canvas" style={{ width: '100%', height: '100%' }} />;
}
