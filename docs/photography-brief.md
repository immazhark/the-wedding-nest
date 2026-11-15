# Photography and film — asset brief

How to hand over authentic TWN event media so it drops into the site without rework.

## Folder structure (upload to the repo or a shared drive; the agent will move them)

```
src/assets/events/<category>/<event-slug>/<nn>-<short-description>.jpg
```

`<category>`: `nikah`, `walima`, `mehndi`, `shaadi`, `engagement`, `reception`, `sangeet`, `celebrations`, `corporate`, `catering`, `decor`, `details`.
`<event-slug>`: a neutral label, e.g. `2025-12-garden-walima`. No family names unless they have agreed to be named.

Each image is registered with a small entry, `src/content/media/<event-slug>.json`, validated by `src/lib/media/schema.ts`: anything without `"permission": true` is rejected (unit tested).

```json
{
  "images": [
    {
      "file": "../../assets/events/walima/2025-12-garden-walima/01-stage-wide.jpg",
      "alt": "Describe what is actually in the photo, plainly.",
      "category": "walima",
      "focal": "center",
      "orientation": "landscape",
      "caption": "Optional, factual.",
      "credit": "Photographer name",
      "permission": true
    }
  ]
}
```

## Technical requirements

| Use | Orientation / ratio | Minimum size |
| --- | --- | --- |
| Home opening frame (desktop/tablet) | landscape, ~21:9 crop-safe (subject in the central band) | 3200 px wide |
| Home opening frame (phone) | portrait 4:5 crop of the same moment, or a separate portrait | 1600 px tall |
| Editorial pairs, galleries | portrait 4:5 / 3:4 and landscape 3:2 mixed | 2000 px long edge |
| Detail shots (florals, menus, textiles, mehndi) | square or portrait | 1600 px |
| Films | MP4 (H.264), 10–30 s, no burned-in text, no music unless licensed | 1920×1080 |

- Original JPEGs straight from the photographer (sRGB). No filters, heavy retouching or watermarks; the site generates AVIF/WebP and responsive sizes.
- Note the focal point if the subject isn't central (`top`, `bottom`, `left`, `right`, `top-left`, and so on).
- Only images where TWN planned, styled or delivered the work shown, and where the families and photographer have agreed to publication.

## What the site already supports

`src/components/media/Frame.astro`: portrait, landscape, panorama, square and tall ratios; focal point; caption and credit; eager/high-priority loading for the opening image; responsive AVIF/WebP via `astro:assets`; clearly labelled placeholders until real images are assigned.
