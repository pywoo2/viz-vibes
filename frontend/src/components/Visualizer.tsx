'use client';

import { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: string;
  colorMode: string;
  clickEffect: string;
}

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const uniformHeader = `
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform float high;
  uniform float energy;
  uniform vec2 mouse;
  uniform int colorMode;
  uniform vec3 click; // xy = position (0-1), z = time of click
  uniform int clickType; // 0=none, 1=ripple, 2=burst, 3=shockwave

  vec3 rainbow(float t) {
    return vec3(
      0.5 + 0.5 * cos(6.28318 * (t + 0.0)),
      0.5 + 0.5 * cos(6.28318 * (t + 0.33)),
      0.5 + 0.5 * cos(6.28318 * (t + 0.67))
    );
  }
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

    // Mouse — gravitational pull that warps the noise field
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      vec2 toMouse = mp - p;
      float md = length(toMouse);
      // Warp coordinates toward mouse (gravity well)
      p += toMouse * 0.4 / (md + 0.3);
      // Recalculate noise with warped coords
      n = 0.0;
      n += snoise(p * 1.5 + t * 0.5 + bass * 0.3) * (0.3 + bass * 0.4);
      n += snoise(p * 3.0 - t * 0.3 + mid * 0.2) * (0.2 + mid * 0.3);
      n += snoise(p * 6.0 + t * 0.8) * (0.1 + high * 0.3);
    }

    float brightness = smoothstep(-0.3, 0.6, n) * (0.15 + energy * 0.85);
    brightness += glow * 0.3;
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
          float ring = abs(cd - clickAge * 0.35) - 0.01;
          brightness += smoothstep(0.02, 0.0, ring) * fade * 0.4;
        } else if (clickType == 2) {
          float cAngle = atan(p.y - cp.y, p.x - cp.x);
          float rays = pow(abs(sin(cAngle * 6.0)), 3.0);
          float radial = smoothstep(clickAge * 0.5, 0.0, cd) * fade;
          float flash = 0.15 / (cd + 0.05) * max(0.0, 1.0 - clickAge * 3.0);
          brightness += (rays * radial * 0.5 + flash);
        } else if (clickType == 3) {
          float radius = clickAge * 0.4;
          float thickness = 0.05 + clickAge * 0.03;
          float wave = smoothstep(radius + thickness, radius, cd) * smoothstep(radius - thickness, radius, cd);
          brightness += wave * fade * 0.8;
          brightness += 0.1 * fade / (abs(cd - radius) + 0.05);
        }
      }
    }

    if (colorMode == 0) {
      gl_FragColor = vec4(vec3(brightness), 1.0);
    } else if (colorMode == 2) {
      gl_FragColor = vec4(vec3(1.0 - brightness), 1.0);
    } else if (colorMode == 3) {
      gl_FragColor = vec4(brightness * 0.7, brightness * 0.05, brightness * 0.05, 1.0);
    } else {
      float hue = n * 0.3 + time * 0.05;
      gl_FragColor = vec4(rainbow(hue) * brightness, 1.0);
    }
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

    // Mouse pulls the wave toward cursor — strong gravity
    if (mouse.x >= 0.0) {
      float dx = uv.x - mouse.x;
      float proximity = exp(-dx * dx * 8.0); // wider gaussian falloff
      wave += (mouse.y - 0.5) * proximity * 1.2;
    }

    float dist = abs(uv.y - 0.5 - wave * 0.3);
    float line = smoothstep(0.02, 0.0, dist);
    float glow = smoothstep(0.1, 0.0, dist) * 0.3;

    // Mouse glow at cursor
    float mouseGlow = 0.0;
    if (mouse.x >= 0.0) {
      float md = length(uv - mouse);
      mouseGlow = 0.01 / (md * md + 0.02);
    }

    float brightness = line + glow + mouseGlow;

    // Click effect
    if (click.z > 0.0 && clickType > 0) {
      vec2 p = uv * 2.0 - 1.0;
      p.x *= resolution.x / resolution.y;
      float clickAge = time - click.z;
      if (clickAge < 1.5) {
        vec2 cp = click.xy * 2.0 - 1.0;
        cp.x *= resolution.x / resolution.y;
        float cd = length(p - cp);
        float fade = 1.0 - clickAge / 1.5;
        if (clickType == 1) {
          float ring = abs(cd - clickAge * 0.35) - 0.01;
          brightness += smoothstep(0.02, 0.0, ring) * fade * 0.4;
        } else if (clickType == 2) {
          float cAngle = atan(p.y - cp.y, p.x - cp.x);
          float rays = pow(abs(sin(cAngle * 6.0)), 3.0);
          float radial = smoothstep(clickAge * 0.5, 0.0, cd) * fade;
          float flash = 0.15 / (cd + 0.05) * max(0.0, 1.0 - clickAge * 3.0);
          brightness += (rays * radial * 0.5 + flash);
        } else if (clickType == 3) {
          float radius = clickAge * 0.4;
          float thickness = 0.05 + clickAge * 0.03;
          float wave = smoothstep(radius + thickness, radius, cd) * smoothstep(radius - thickness, radius, cd);
          brightness += wave * fade * 0.8;
          brightness += 0.1 * fade / (abs(cd - radius) + 0.05);
        }
      }
    }

    if (colorMode == 0) {
      gl_FragColor = vec4(vec3(brightness), 1.0);
    } else if (colorMode == 2) {
      gl_FragColor = vec4(vec3(1.0 - brightness), 1.0);
    } else if (colorMode == 3) {
      gl_FragColor = vec4(brightness * 0.7, brightness * 0.05, brightness * 0.05, 1.0);
    } else {
      float hue = uv.x + time * 0.02;
      gl_FragColor = vec4(rainbow(hue) * brightness, 1.0);
    }
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
    vec3 colorAccum = vec3(0.0);
    for (int i = 0; i < 25; i++) {
      float fi = float(i);
      // Skip particles beyond the energy-driven count
      if (fi >= maxParticles) break;

      // Each particle has a unique orbit
      float angle1 = fi * 2.399 + time * speed * (0.5 + fract(fi * 0.37) * 0.5);
      float angle2 = fi * 1.673 + time * speed * (0.3 + fract(fi * 0.61) * 0.7);
      float radius = 0.4 + fract(fi * 0.71) * 1.4 + bass * 0.3;

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
        pos += toMouse * 0.5 / (md + 0.3);
      }

      // Size pulses with bass, smaller particles further from center
      float size = (0.006 + bass * 0.015) * (1.0 - fract(fi * 0.71) * 0.5);
      float d = length(p - pos);
      float particleGlow = size / (d * d + 0.001);
      float contrib = particleGlow * (0.1 + energy * 0.4);
      brightness += contrib;
      colorAccum += rainbow(fi / 25.0) * contrib;
    }

    // Mouse cursor glow
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      float mg = 0.01 / (md * md + 0.02);
      brightness += mg;
      colorAccum += vec3(mg);
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
          float ring = abs(cd - clickAge * 0.35) - 0.01;
          brightness += smoothstep(0.02, 0.0, ring) * fade * 0.4;
        } else if (clickType == 2) {
          float cAngle = atan(p.y - cp.y, p.x - cp.x);
          float rays = pow(abs(sin(cAngle * 6.0)), 3.0);
          float radial = smoothstep(clickAge * 0.5, 0.0, cd) * fade;
          float flash = 0.15 / (cd + 0.05) * max(0.0, 1.0 - clickAge * 3.0);
          brightness += (rays * radial * 0.5 + flash);
        } else if (clickType == 3) {
          float radius = clickAge * 0.4;
          float thickness = 0.05 + clickAge * 0.03;
          float wave = smoothstep(radius + thickness, radius, cd) * smoothstep(radius - thickness, radius, cd);
          brightness += wave * fade * 0.8;
          brightness += 0.1 * fade / (abs(cd - radius) + 0.05);
        }
      }
    }

    if (colorMode == 0) {
      gl_FragColor = vec4(vec3(brightness), 1.0);
    } else if (colorMode == 2) {
      gl_FragColor = vec4(vec3(1.0 - brightness), 1.0);
    } else if (colorMode == 3) {
      gl_FragColor = vec4(brightness * 0.7, brightness * 0.05, brightness * 0.05, 1.0);
    } else {
      colorAccum = clamp(colorAccum, 0.0, 1.0);
      colorAccum = pow(colorAccum, vec3(0.85));
      gl_FragColor = vec4(colorAccum, 1.0);
    }
  }
`;

// Mode 4: Rings — concentric rings pulsing outward
const ringsShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float dist = length(p);
    float t = time * 0.5;

    // Multiple rings expanding outward
    float rings = 0.0;
    vec3 colorAccum = vec3(0.0);
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float radius = mod(t * 0.3 + fi * 0.2, 1.5);
      float ring = abs(dist - radius);
      float thickness = 0.008 + energy * 0.015;
      float ringVal = smoothstep(thickness, 0.0, ring) * (1.0 - radius / 1.5) * (0.3 + energy * 0.7);
      rings += ringVal;
      colorAccum += rainbow(fi / 5.0) * ringVal;
    }

    // Center glow
    float glow = (0.02 + bass * 0.04) / (dist + 0.1);

    // Mouse interaction
    float mouseGlow = 0.0;
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      mouseGlow = 0.02 / (md * md + 0.03);
    }

    float brightness = rings + glow + mouseGlow;
    brightness = clamp(brightness, 0.0, 1.0);

    // Click effect
    if (click.z > 0.0 && clickType > 0) {
      float clickAge = time - click.z;
      if (clickAge < 1.5) {
        vec2 cp = click.xy * 2.0 - 1.0;
        cp.x *= resolution.x / resolution.y;
        float cd = length(p - cp);
        float fade = 1.0 - clickAge / 1.5;
        if (clickType == 1) {
          float ring = abs(cd - clickAge * 0.35) - 0.01;
          brightness += smoothstep(0.02, 0.0, ring) * fade * 0.4;
        } else if (clickType == 2) {
          float cAngle = atan(p.y - cp.y, p.x - cp.x);
          float rays = pow(abs(sin(cAngle * 6.0)), 3.0);
          float radial = smoothstep(clickAge * 0.5, 0.0, cd) * fade;
          float flash = 0.15 / (cd + 0.05) * max(0.0, 1.0 - clickAge * 3.0);
          brightness += (rays * radial * 0.5 + flash);
        } else if (clickType == 3) {
          float radius = clickAge * 0.4;
          float thickness = 0.05 + clickAge * 0.03;
          float wave = smoothstep(radius + thickness, radius, cd) * smoothstep(radius - thickness, radius, cd);
          brightness += wave * fade * 0.8;
          brightness += 0.1 * fade / (abs(cd - radius) + 0.05);
        }
      }
    }

    if (colorMode == 0) {
      gl_FragColor = vec4(vec3(brightness), 1.0);
    } else if (colorMode == 2) {
      gl_FragColor = vec4(vec3(1.0 - brightness), 1.0);
    } else if (colorMode == 3) {
      gl_FragColor = vec4(brightness * 0.7, brightness * 0.05, brightness * 0.05, 1.0);
    } else {
      colorAccum += rainbow(0.6) * glow;
      colorAccum += vec3(mouseGlow);
      colorAccum = clamp(colorAccum, 0.0, 1.0);
      gl_FragColor = vec4(colorAccum, 1.0);
    }
  }
`;

// Mode 5: Grid — dynamic tunnel that warps with audio
const gridShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float t = time * 0.3;

    // Tunnel center shifts with audio + mouse gravity
    vec2 center = vec2(sin(t * 0.5) * bass * 0.3, cos(t * 0.7) * mid * 0.3);
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      center = mix(center, mp, 0.15);
    }
    vec2 q = p - center;

    float angle = atan(q.y, q.x);
    float dist = length(q);

    // Grid speed and density react to audio
    float speed = t + bass * 0.5;
    float segments = 12.0 + high * 8.0;

    float gridR = fract(1.0 / (dist + 0.01) * 0.4 - speed);
    float gridA = fract(angle / (6.28318 / segments));

    // Line thickness pulses with bass
    float thick = 0.03 + bass * 0.04;
    float lineR = smoothstep(thick, 0.0, abs(gridR - 0.5) - (0.5 - thick));
    float lineA = smoothstep(thick, 0.0, abs(gridA - 0.5) - (0.5 - thick));

    float grid = max(lineR, lineA) * (0.15 + energy * 0.6) / (dist + 0.2);

    // Center glow that pulses
    float glow = (0.03 + bass * 0.06) / (dist + 0.05);

    // Scan line effect
    float scan = smoothstep(0.02, 0.0, abs(fract(dist * 3.0 - t * 0.5) - 0.5) - 0.48) * energy * 0.3;

    // Mouse
    float mouseGlow = 0.0;
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      mouseGlow = 0.02 / (md * md + 0.03);
    }

    float brightness = grid + glow + scan + mouseGlow;
    brightness = clamp(brightness, 0.0, 1.0);

    // Click effect
    if (click.z > 0.0 && clickType > 0) {
      float clickAge = time - click.z;
      if (clickAge < 1.5) {
        vec2 cp = click.xy * 2.0 - 1.0;
        cp.x *= resolution.x / resolution.y;
        float cd = length(p - cp);
        float fade = 1.0 - clickAge / 1.5;
        if (clickType == 1) {
          float ring = abs(cd - clickAge * 0.35) - 0.01;
          brightness += smoothstep(0.02, 0.0, ring) * fade * 0.4;
        } else if (clickType == 2) {
          float cAngle = atan(p.y - cp.y, p.x - cp.x);
          float rays = pow(abs(sin(cAngle * 6.0)), 3.0);
          float radial = smoothstep(clickAge * 0.5, 0.0, cd) * fade;
          float flash = 0.15 / (cd + 0.05) * max(0.0, 1.0 - clickAge * 3.0);
          brightness += (rays * radial * 0.5 + flash);
        } else if (clickType == 3) {
          float radius = clickAge * 0.4;
          float thickness = 0.05 + clickAge * 0.03;
          float wave = smoothstep(radius + thickness, radius, cd) * smoothstep(radius - thickness, radius, cd);
          brightness += wave * fade * 0.8;
          brightness += 0.1 * fade / (abs(cd - radius) + 0.05);
        }
      }
    }

    if (colorMode == 0) {
      gl_FragColor = vec4(vec3(brightness), 1.0);
    } else if (colorMode == 2) {
      gl_FragColor = vec4(vec3(1.0 - brightness), 1.0);
    } else if (colorMode == 3) {
      gl_FragColor = vec4(brightness * 0.7, brightness * 0.05, brightness * 0.05, 1.0);
    } else {
      float hue = angle / 6.28318 + dist * 0.3 + time * 0.05;
      gl_FragColor = vec4(rainbow(hue) * brightness, 1.0);
    }
  }
`;

// Mode 6: Plasma — layered, flowing, heavily audio-reactive
const plasmaShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float t = time * 0.4;

    // Mouse gravity — warp coordinates
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      vec2 toMouse = mp - p;
      float md = length(toMouse);
      p += toMouse * 0.35 / (md + 0.3);
    }

    // Multiple plasma layers that shift with audio
    float v = 0.0;
    v += sin(p.x * (2.0 + bass * 3.0) + t * 1.2) * 0.5;
    v += sin(p.y * (3.0 + mid * 2.0) + t * 0.8) * 0.5;
    v += sin((p.x * sin(t * 0.3) + p.y * cos(t * 0.2)) * (2.5 + high * 2.0)) * 0.5;
    v += sin(length(p + vec2(sin(t * 0.5), cos(t * 0.4))) * (3.0 + energy * 3.0) - t * 1.5) * 0.5;
    v += sin(distance(p, vec2(sin(t * 0.3) * 0.5, cos(t * 0.6) * 0.5)) * (4.0 + bass * 4.0)) * 0.3;
    v *= 0.3;

    // Sharp contour lines that pulse
    float contour = abs(fract(v * 3.0 + energy * 0.5) - 0.5);
    float lines = smoothstep(0.05 + energy * 0.05, 0.0, contour) * 0.4;

    float brightness = smoothstep(-0.4, 0.5, v) * (0.15 + energy * 0.7) + lines;

    // Center energy burst
    float dist = length(p);
    brightness += (0.01 + energy * 0.04) / (dist + 0.15);

    // Mouse creates a plasma distortion
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      brightness += 0.01 / (md * md + 0.03);
      float mouseWave = sin(md * 10.0 - t * 3.0) * 0.2 / (md + 0.3);
      brightness += mouseWave * energy;
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
          float ring = abs(cd - clickAge * 0.35) - 0.01;
          brightness += smoothstep(0.02, 0.0, ring) * fade * 0.4;
        } else if (clickType == 2) {
          float cAngle = atan(p.y - cp.y, p.x - cp.x);
          float rays = pow(abs(sin(cAngle * 6.0)), 3.0);
          float radial = smoothstep(clickAge * 0.5, 0.0, cd) * fade;
          float flash = 0.15 / (cd + 0.05) * max(0.0, 1.0 - clickAge * 3.0);
          brightness += (rays * radial * 0.5 + flash);
        } else if (clickType == 3) {
          float radius = clickAge * 0.4;
          float thickness = 0.05 + clickAge * 0.03;
          float wave = smoothstep(radius + thickness, radius, cd) * smoothstep(radius - thickness, radius, cd);
          brightness += wave * fade * 0.8;
          brightness += 0.1 * fade / (abs(cd - radius) + 0.05);
        }
      }
    }

    if (colorMode == 0) {
      gl_FragColor = vec4(vec3(brightness), 1.0);
    } else if (colorMode == 2) {
      gl_FragColor = vec4(vec3(1.0 - brightness), 1.0);
    } else if (colorMode == 3) {
      gl_FragColor = vec4(brightness * 0.7, brightness * 0.05, brightness * 0.05, 1.0);
    } else {
      float hue = v * 0.5 + 0.5 + time * 0.03;
      gl_FragColor = vec4(rainbow(hue) * brightness, 1.0);
    }
  }
`;

// Mode 7: Floral — dark moody dahlias, deep reds on black
const floralShader = uniformHeader + `
  // Petal shape function — creates layered dahlia-like forms
  float petal(vec2 p, float angle, float count, float sharpness, float size) {
    float a = atan(p.y, p.x) + angle;
    float r = length(p);
    float pShape = pow(abs(cos(a * count * 0.5)), sharpness) * size;
    return smoothstep(pShape + 0.01, pShape - 0.01, r);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float t = time * 0.15;
    float dist = length(p);
    float angle = atan(p.y, p.x);

    // Dark deep red palette
    vec3 deepRed = vec3(0.45, 0.02, 0.04);
    vec3 crimson = vec3(0.65, 0.05, 0.08);
    vec3 rose = vec3(0.55, 0.08, 0.12);
    vec3 darkCore = vec3(0.15, 0.01, 0.02);

    vec3 color = vec3(0.0);

    // Layer 1: Large outer dahlia — many petals, slow rotation
    float outer = petal(p, t * 0.3 + bass * 0.2, 12.0, 1.5, 0.7 + bass * 0.3);
    color += deepRed * outer * 0.5;

    // Layer 2: Mid dahlia — tighter petals, opposite rotation
    float mid2 = petal(p, -t * 0.4 + mid * 0.3, 16.0, 2.0, 0.5 + mid * 0.2);
    color += crimson * mid2 * 0.6;

    // Layer 3: Inner petals — many thin petals
    float inner = petal(p, t * 0.6 + high * 0.2, 24.0, 3.0, 0.3 + energy * 0.15);
    color += rose * inner * 0.7;

    // Layer 4: Tight center bud
    float bud = petal(p, -t * 0.8, 32.0, 4.0, 0.15 + bass * 0.08);
    color += crimson * bud * 0.8;

    // Center dark core
    float core = smoothstep(0.08, 0.0, dist);
    color = mix(color, darkCore, core * 0.8);

    // Center glow — warm ember
    float glow = (0.01 + energy * 0.03) / (dist + 0.08);
    color += deepRed * glow * 0.5;

    // Scattered smaller flowers at edges
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      vec2 offset = vec2(
        sin(fi * 2.1 + t * 0.2) * (0.6 + fi * 0.15),
        cos(fi * 1.7 + t * 0.15) * (0.5 + fi * 0.2)
      );
      vec2 q = p - offset;
      float smallFlower = petal(q, t * 0.5 + fi, 8.0 + fi * 2.0, 2.0, 0.12 + bass * 0.05);
      color += rose * smallFlower * 0.3;
    }

    // Subtle vein/fiber texture on petals
    float veins = sin(angle * 20.0 + dist * 15.0 - t) * 0.5 + 0.5;
    veins = pow(veins, 8.0) * 0.15 * smoothstep(0.8, 0.1, dist);
    color += crimson * veins;

    // Ambient pulsing with bass
    color *= 0.7 + energy * 0.5;

    // Mouse — bloom light
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      color += crimson * 0.15 / (md * md + 0.02);
    }

    // Click effect
    float brightness = length(color);
    if (click.z > 0.0 && clickType > 0) {
      float clickAge = time - click.z;
      if (clickAge < 1.5) {
        vec2 cp = click.xy * 2.0 - 1.0;
        cp.x *= resolution.x / resolution.y;
        float cd = length(p - cp);
        float fade = 1.0 - clickAge / 1.5;
        if (clickType == 1) {
          float ring = abs(cd - clickAge * 0.35) - 0.01;
          color += crimson * smoothstep(0.02, 0.0, ring) * fade * 0.6;
        } else if (clickType == 2) {
          float cAngle = atan(p.y - cp.y, p.x - cp.x);
          float rays = pow(abs(sin(cAngle * 6.0)), 3.0);
          float radial = smoothstep(clickAge * 0.5, 0.0, cd) * fade;
          color += rose * rays * radial * 0.5;
        } else if (clickType == 3) {
          float radius = clickAge * 0.4;
          float thickness = 0.05 + clickAge * 0.03;
          float wave = smoothstep(radius + thickness, radius, cd) * smoothstep(radius - thickness, radius, cd);
          color += crimson * wave * fade * 0.7;
        }
      }
    }

    // Color mode overrides
    brightness = (color.r + color.g + color.b) / 3.0;
    if (colorMode == 0) {
      // Default: the deep red palette (always colored for floral)
      gl_FragColor = vec4(color, 1.0);
    } else if (colorMode == 2) {
      gl_FragColor = vec4(vec3(1.0 - brightness), 1.0);
    } else if (colorMode == 3) {
      // Already red — just boost it
      gl_FragColor = vec4(color * 1.3, 1.0);
    } else {
      float hue = angle / 6.28318 + dist * 0.3 + time * 0.03;
      gl_FragColor = vec4(rainbow(hue) * brightness * 2.0, 1.0);
    }
  }
`;

// No visualization — black with subtle mouse glow and click effects
const noneShader = uniformHeader + `
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float brightness = 0.0;

    // Subtle mouse glow
    if (mouse.x >= 0.0) {
      vec2 mp = mouse * 2.0 - 1.0;
      mp.x *= resolution.x / resolution.y;
      float md = length(p - mp);
      brightness += 0.01 / (md * md + 0.03);
    }

    // Click effect
    if (click.z > 0.0 && clickType > 0) {
      float clickAge = time - click.z;
      if (clickAge < 1.5) {
        vec2 cp = click.xy * 2.0 - 1.0;
        cp.x *= resolution.x / resolution.y;
        float cd = length(p - cp);
        float fade = 1.0 - clickAge / 1.5;
        if (clickType == 1) {
          float ring = abs(cd - clickAge * 0.35) - 0.01;
          brightness += smoothstep(0.02, 0.0, ring) * fade * 0.4;
        } else if (clickType == 2) {
          float cAngle = atan(p.y - cp.y, p.x - cp.x);
          float rays = pow(abs(sin(cAngle * 6.0)), 3.0);
          float radial = smoothstep(clickAge * 0.5, 0.0, cd) * fade;
          float flash = 0.15 / (cd + 0.05) * max(0.0, 1.0 - clickAge * 3.0);
          brightness += (rays * radial * 0.5 + flash);
        } else if (clickType == 3) {
          float radius = clickAge * 0.4;
          float thickness = 0.05 + clickAge * 0.03;
          float wave = smoothstep(radius + thickness, radius, cd) * smoothstep(radius - thickness, radius, cd);
          brightness += wave * fade * 0.8;
          brightness += 0.1 * fade / (abs(cd - radius) + 0.05);
        }
      }
    }

    gl_FragColor = vec4(vec3(brightness), 1.0);
  }
`;

export const VISUALIZER_MODES = [
  { id: 'none', label: 'None', shader: noneShader },
  { id: 'noise', label: 'Noise Field', shader: noiseFieldShader },
  { id: 'waveform', label: 'Waveform', shader: waveformShader },
  { id: 'particles', label: 'Particles', shader: particlesShader },
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

const colorModeMap: Record<string, number> = { mono: 0, rainbow: 1, inverted: 2, red: 3 };
const clickEffectMap: Record<string, number> = { none: 0, ripple: 1, burst: 2, shockwave: 3 };

export default function Visualizer({ analyser, isPlaying, mode, colorMode, clickEffect }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const mouseRef = useRef({ x: -1, y: -1 });
  const clickRef = useRef({ x: 0, y: 0, z: 0 });
  const clickEffectRef = useRef(clickEffect);
  const modeRef = useRef(mode);
  const colorModeRef = useRef(colorMode);

  // Keep refs in sync
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    colorModeRef.current = colorMode;
  }, [colorMode]);

  useEffect(() => {
    clickEffectRef.current = clickEffect;
  }, [clickEffect]);

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
      const isMobile = window.innerWidth < 768;
      const dpr = isMobile
        ? Math.min(window.devicePixelRatio, 1.5)
        : Math.min(window.devicePixelRatio, 2);
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
      gl.uniform1i(loc('colorMode'), colorModeMap[colorModeRef.current] ?? 0);
      gl.uniform3f(loc('click'), clickRef.current.x, clickRef.current.y, clickRef.current.z);
      gl.uniform1i(loc('clickType'), clickEffectMap[clickEffectRef.current] ?? 0);

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
    // No mouseleave — track mouse globally since canvas is behind other elements

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      const time = (Date.now() - startTimeRef.current) / 1000;
      clickRef.current = { x, y, z: time };
    };

    window.addEventListener('mousemove', onMove);
    canvas.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('click', onClick);
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
