'use client';

import { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: string;
  clickEffect: string;
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
  uniform vec2 mouse; // 0-1 normalized, (-1,-1) when inactive
  uniform vec3 click; // xy = position (0-1), z = time of click
  uniform int clickType; // 0=none, 1=ripple, 2=burst, 3=shockwave
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

    // Mouse — bright attractor that distorts noise
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

    // Click effect
    if (click.z > 0.0 && clickType > 0) {
      float clickAge = time - click.z;
      if (clickAge < 1.5) {
        vec2 cp = click.xy * 2.0 - 1.0;
        cp.x *= resolution.x / resolution.y;
        float cd = length(p - cp);
        float fade = 1.0 - clickAge / 1.5;

        if (clickType == 1) {
          float ring = abs(cd - clickAge * 0.8) - 0.02;
          brightness += smoothstep(0.03, 0.0, ring) * fade * 0.4;
        } else if (clickType == 2) {
          float angle = atan(p.y - cp.y, p.x - cp.x);
          float rays = abs(sin(angle * 8.0));
          float expand = smoothstep(clickAge * 0.6, clickAge * 0.6 + 0.1, cd) *
                         smoothstep(clickAge * 0.8, clickAge * 0.6, cd);
          brightness += rays * expand * fade * 0.5;
        } else if (clickType == 3) {
          float wave = smoothstep(clickAge * 0.7 + 0.05, clickAge * 0.7, cd) *
                       smoothstep(clickAge * 0.7 - 0.15, clickAge * 0.7, cd);
          brightness += wave * fade * 0.6;
        }
      }
    }

    vec3 color = vec3(brightness);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Mode 2: Waveform — mouse bends the wave
const waveformShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    float wave = 0.0;
    wave += sin(uv.x * 6.28 * 2.0 + time) * bass * 0.3;
    wave += sin(uv.x * 6.28 * 4.0 + time * 1.5) * mid * 0.2;
    wave += sin(uv.x * 6.28 * 8.0 + time * 2.0) * high * 0.1;

    // Mouse pulls the wave toward cursor
    if (mouse.x >= 0.0) {
      float dx = uv.x - mouse.x;
      float proximity = exp(-dx * dx * 20.0); // gaussian falloff
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

    // Click effect
    if (click.z > 0.0 && clickType > 0) {
      float clickAge = time - click.z;
      if (clickAge < 1.5) {
        vec2 p = uv * 2.0 - 1.0;
        p.x *= resolution.x / resolution.y;
        vec2 cp = click.xy * 2.0 - 1.0;
        cp.x *= resolution.x / resolution.y;
        float cd = length(p - cp);
        float fade = 1.0 - clickAge / 1.5;

        if (clickType == 1) {
          float ring = abs(cd - clickAge * 0.8) - 0.02;
          brightness += smoothstep(0.03, 0.0, ring) * fade * 0.4;
        } else if (clickType == 2) {
          float angle = atan(p.y - cp.y, p.x - cp.x);
          float rays = abs(sin(angle * 8.0));
          float expand = smoothstep(clickAge * 0.6, clickAge * 0.6 + 0.1, cd) *
                         smoothstep(clickAge * 0.8, clickAge * 0.6, cd);
          brightness += rays * expand * fade * 0.5;
        } else if (clickType == 3) {
          float wave = smoothstep(clickAge * 0.7 + 0.05, clickAge * 0.7, cd) *
                       smoothstep(clickAge * 0.7 - 0.15, clickAge * 0.7, cd);
          brightness += wave * fade * 0.6;
        }
      }
    }

    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

// Mode 3: Particles — count and velocity scale with volume
const particlesShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    // Energy controls how many particles are visible (up to 25)
    float maxParticles = 8.0 + energy * 17.0;
    // Energy controls speed
    float speed = 0.12 + energy * 0.12;

    float brightness = 0.0;
    for (int i = 0; i < 25; i++) {
      float fi = float(i);
      // Skip particles beyond the energy-driven count
      if (fi >= maxParticles) break;

      // Each particle has a unique orbit
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

      // Size pulses with bass, smaller particles further from center
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

    // Click effect
    if (click.z > 0.0 && clickType > 0) {
      float clickAge = time - click.z;
      if (clickAge < 1.5) {
        vec2 cp = click.xy * 2.0 - 1.0;
        cp.x *= resolution.x / resolution.y;
        float cd = length(p - cp);
        float fade = 1.0 - clickAge / 1.5;

        if (clickType == 1) {
          float ring = abs(cd - clickAge * 0.8) - 0.02;
          brightness += smoothstep(0.03, 0.0, ring) * fade * 0.4;
        } else if (clickType == 2) {
          float angle = atan(p.y - cp.y, p.x - cp.x);
          float rays = abs(sin(angle * 8.0));
          float expand = smoothstep(clickAge * 0.6, clickAge * 0.6 + 0.1, cd) *
                         smoothstep(clickAge * 0.8, clickAge * 0.6, cd);
          brightness += rays * expand * fade * 0.5;
        } else if (clickType == 3) {
          float wave = smoothstep(clickAge * 0.7 + 0.05, clickAge * 0.7, cd) *
                       smoothstep(clickAge * 0.7 - 0.15, clickAge * 0.7, cd);
          brightness += wave * fade * 0.6;
        }
      }
    }

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

const clickTypeMap: Record<string, number> = { none: 0, ripple: 1, burst: 2, shockwave: 3 };

export default function Visualizer({ analyser, isPlaying, mode, clickEffect }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const mouseRef = useRef({ x: -1, y: -1 });
  const clickRef = useRef({ x: -1, y: -1, time: 0 });
  const clickEffectRef = useRef(clickEffect);
  clickEffectRef.current = clickEffect;

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
      gl.uniform2f(gl.getUniformLocation(program, 'mouse'), mouseRef.current.x, mouseRef.current.y);
      gl.uniform3f(gl.getUniformLocation(program, 'click'),
        clickRef.current.x, clickRef.current.y, clickRef.current.time);
      gl.uniform1i(gl.getUniformLocation(program, 'clickType'), clickTypeMap[clickEffectRef.current] || 1);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser, isPlaying]);

  // Mouse tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height, // flip Y for GL
      };
    };
    const onLeave = () => {
      mouseRef.current = { x: -1, y: -1 };
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      clickRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height,
        time: (Date.now() - startTimeRef.current) / 1000,
      };
    };

    window.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  return <canvas ref={canvasRef} id="visualizer-canvas" style={{ width: '100%', height: '100%' }} />;
}
