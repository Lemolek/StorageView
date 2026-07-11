# StorageView Brand Assets

Author: **Lemolek**
Product: **StorageView**
Tagline: **Analyze. Visualize. Optimize.**

## Files

All assets live in `assets/brand/`:

- `storageview-icon.svg` — canonical app icon (dark tile); imported by the application sidebar.
- `storageview-icon-dark.svg` — app icon on a dark tile, for dark backgrounds.
- `storageview-icon-light.svg` — app icon on a light tile, for light backgrounds.
- `storageview-icon-monochrome-dark.svg` — monochrome icon variant for dark UI contexts.
- `storageview-icon-monochrome-light.svg` — monochrome icon variant for light UI contexts.
- `storageview-icon-transparent.svg` — icon mark without a background tile, for overlays and composites.
- `storageview-wordmark-dark.svg` — full wordmark (icon, name, tagline) for dark backgrounds.
- `storageview-wordmark-light.svg` — full wordmark (icon, name, tagline) for light backgrounds.
- `storageview-wordmark-transparent.svg` — wordmark without a background tile.
- `storageview-wordmark-dark-1400x360.png` — raster wordmark for dark backgrounds (README header, previews).
- `storageview-wordmark-light-1400x360.png` — raster wordmark for light backgrounds.

The Tauri icon set in `src-tauri/icons/` is generated from `storageview-app-icon-1024.png` with `npx tauri icon`; do not edit those files by hand.

## Usage Rules

- Sidebar header: `storageview-icon.svg` + the product name.
- README header: `storageview-wordmark-dark-1400x360.png` (or the light variant on light pages).
- UI inline icon: the monochrome variant matching the surrounding theme.
- Keep clear space around the mark of at least 12.5% of the icon width on every side.
- Do not stretch, skew, rotate or recolor the assets. Raster assets must never be recolored.
- Do not place the dark-tile assets on dark backgrounds or the light-tile assets on light backgrounds.

## Brand Colors

Dark (noir) theme:

```txt
Background: #050505
Surface:    #0B0B0B
Card:       #111111
Border:     #262626
Text:       #FFFFFF
Muted:      #A1A1AA
Accent:     #7C5CFF
Accent Alt: #00E5FF
```

Light theme:

```txt
Background: #FAFAFA
Surface:    #FFFFFF
Border:     #E4E4E7
Text:       #09090B
Muted:      #71717A
Accent:     #6947FF
Accent Alt: #007A8A
```

## Typography

Use **Inter** or **Geist**. Avoid casual, decorative, gaming, handwritten, or overly futuristic fonts.

## Legal Notice

Use this notice in the app About page, README footer, and generated documentation:

```txt
Copyright © 2026 Lemolek. All rights reserved.
Unauthorized copying, distribution, modification, sublicensing, or commercial use is prohibited unless explicitly permitted by the author.
```
