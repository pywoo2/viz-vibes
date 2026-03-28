'use client';

import { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

// Vertex shader — full screen quad
const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Fragment shader — audio-reactive noise field
const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float high;
  uniform float energy;

  // Simplex noise function
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

    // Multi-layered noise driven by audio
    float n = 0.0;
    n += snoise(p * 1.5 + t * 0.5 + bass * 0.3) * (0.3 + bass * 0.4);
    n += snoise(p * 3.0 - t * 0.3 + mid * 0.2) * (0.2 + mid * 0.3);
    n += snoise(p * 6.0 + t * 0.8) * (0.1 + high * 0.3);

    // Center glow driven by overall energy
    float dist = length(p);
    float glow = energy * 0.5 / (dist + 0.5);

    // Combine
    float brightness = smoothstep(-0.2, 0.8, n) * (0.1 + energy * 0.6);
    brightness += glow * 0.15;

    // Monochrome output — slight warm tint
    vec3 color = vec3(brightness * 0.95, brightness * 0.95, brightness);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Visualizer({ analyser, isPlaying }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexShader);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragmentShader);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    programRef.current = program;

    // Full-screen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

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
    const program = programRef.current;
    if (!gl || !program) return;

    const frequencyData = new Uint8Array(analyser?.frequencyBinCount || 128);

    const render = () => {
      animRef.current = requestAnimationFrame(render);

      // Get audio data
      let bass = 0, mid = 0, high = 0, energy = 0;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(frequencyData);
        const bins = frequencyData.length;
        // Bass: first 1/6 of bins
        for (let i = 0; i < bins / 6; i++) bass += frequencyData[i];
        bass = bass / (bins / 6) / 255;
        // Mid: middle 1/3
        for (let i = Math.floor(bins / 6); i < bins / 2; i++) mid += frequencyData[i];
        mid = mid / (bins / 3) / 255;
        // High: upper half
        for (let i = Math.floor(bins / 2); i < bins; i++) high += frequencyData[i];
        high = high / (bins / 2) / 255;
        // Overall energy
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
