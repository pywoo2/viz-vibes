# Building the Visualizer

The heart of viz-vibes is the audio-reactive visualizer — a full-screen WebGL canvas that responds to whatever song is playing. Here's how it works under the hood.

## From sound to pixels

The Web Audio API gives us an `AnalyserNode` that produces frequency data in real time. Every animation frame, we read the current frequency bins and split them into three bands:

- **Bass** (20–250 Hz) — drives the large-scale motion
- **Mids** (250–2000 Hz) — controls texture density and color shifts
- **Highs** (2000+ Hz) — triggers sparkle and edge detail

These values get passed as uniforms into a GLSL fragment shader that runs on the GPU.

## The shader pipeline

Each visualizer mode is a different fragment shader. They all share the same basic structure:

```
uniform float u_bass;
uniform float u_mid;
uniform float u_high;
uniform float u_time;
uniform vec2 u_resolution;
```

The `Noise Field` mode, for example, layers three octaves of simplex noise. The bass value scales the noise amplitude, mids shift the color palette, and highs add a shimmering overlay. The result is an organic, constantly-evolving landscape that feels alive.

## Click effects

When you click anywhere on the visualizer, a ripple (or burst, or shockwave) propagates outward from the click point. This is done by tracking click events and passing them to the shader as additional uniforms — position, age, and intensity. The shader blends these into the current frame.

> The trick is making it feel responsive without being distracting. The effects decay quickly so they never compete with the music.

## Performance

Running a full-screen fragment shader at 60fps takes real GPU power. A few things keep it smooth:

1. Resolution scaling on mobile — we render at a lower pixel ratio
2. `smoothingTimeConstant` on the analyser prevents jittery frequency data
3. The canvas uses `willReadFrequently: false` to keep it on the GPU path

## What I learned

Shaders are a completely different way of thinking about graphics. There's no "draw a circle" — you write a function that, given a pixel coordinate, returns a color. Every pixel runs in parallel. It's beautiful and maddening in equal measure.

The most surprising thing was how much the *smoothing* matters. Raw frequency data is noisy and chaotic. A little exponential smoothing turns chaos into something that feels musical.
