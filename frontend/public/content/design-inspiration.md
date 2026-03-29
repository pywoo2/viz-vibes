# Design Inspiration: Glass, Space, and MySpace

The visual design of viz-vibes pulls from a few different places. Here's the mood board in my head.

## iOS liquid glass

Apple's liquid glass aesthetic — frosted translucent surfaces, subtle depth, light that feels physical — was a huge influence. The sidebar, player bar, and overlay cards all use `backdrop-filter: blur()` to create that glassy, layered look.

What I like about this style is that it implies depth without being skeuomorphic. The surfaces feel like they exist in space, but they don't pretend to be real materials. It's an honest kind of beauty.

## The dark canvas

Almost everything sits on a dark background. This was a practical choice as much as an aesthetic one — the visualizer needs darkness to shine. Bright UI elements would compete with the shaders.

But darkness also creates a certain mood. It's intimate. It's focused. When you're listening to music in a dark room, the screen becomes a window into something.

## MySpace energy

This one surprises people, but hear me out. Early MySpace had this chaotic, personal, *maximalist* energy. People customized everything. They embedded music players. They expressed themselves through their pages.

viz-vibes channels a bit of that spirit:

- Music plays automatically (well, after the epilepsy warning)
- Floating images and notes create a lived-in, personal feel
- The visualizer is front and center — it's not hidden behind a "play" button
- Users can leave public notes that float around the scene

It's not the clean, corporate music experience. It's messy and personal and a little weird. That's intentional.

## Typography

The type is kept deliberately quiet — lightweight, lowercase, lots of letter-spacing. This is partly aesthetic (it fits the glass vibe) and partly functional (it keeps text from competing with the visualizer).

Section headers use `font-weight: 200` or `300`. Body text sits at `0.85rem`. Everything breathes.

## What didn't work

Some things I tried and abandoned:

- **Color-matched UI** — tinting the sidebar to match the visualizer's current palette. It was cool but distracting.
- **Waveform in the progress bar** — looked great in mockups, killed performance.
- **Album art generation** — AI-generating cover art for each track. The quality was too inconsistent.

Design is as much about what you remove as what you add.
