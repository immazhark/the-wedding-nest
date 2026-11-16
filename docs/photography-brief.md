# Photography and film — asset brief

How to hand over authentic TWN event media so it drops into the site without rework.

## Folder structure (upload to the repo or a shared drive; the agent will move them)

```
src/assets/events/<category>/<event-slug>/<nn>-<short-description>.jpg
```

`<category>`: `nikah`, `walima`, `mehndi`, `shaadi`, `engagement`, `reception`, `sangeet`, `celebrations`, `corporate`, `catering`, `decor`, `details`.
`<event-slug>`: a neutral label, e.g. `2025-12-garden-walima`. No family names unless they have agreed to be named.

Each image is registered with a small entry, `src/content/media/<event-slug>.json`,
validated by `mediaManifestSchema` in `src/lib/media/schema.ts`. The path must
be a local file under `../../assets/events/<category>/<event-slug>/<image>.jpg`
(or `.jpeg`, `.png`, `.webp`, `.avif`), and the category folder must match
the metadata. External URLs, parent-directory traversal, unsupported formats and
duplicate image entries are rejected.

Homepage photography is selected from `src/lib/media/catalog.ts`, which joins
each reviewed JSON manifest entry to an **exact matching imported local asset**.
The `Frame.astro` component accepts only that paired `photo`; image and
approval metadata cannot be supplied independently. The build rejects a
manifest with a missing file, any undeclared original in `src/assets/events/`,
duplicate photos across manifests, or duplicate homepage placements. An
additional build-time directory scan detects **every** staged event file,
including GIF/SVG/video/document formats that are not part of the approved
image glob, and fails closed. Keep consent scans, videos, and working drafts
outside `src/assets/events/` until an explicitly reviewed media pipeline
is built. Frames
render approved alt text, focal point, caption and credit; missing slots keep
honestly labelled placeholders.

The optional `slot` chooses an approved homepage placement:
`home-hero`, `home-work-portrait`, `home-work-wide`, or
`home-work-detail`. An approved photograph without a slot is not placed
on the homepage. **Never commit an unreviewed original to the event
asset directory**; keep working files outside the published build.

**Important:** `"permission": true` is an editor's declaration, not evidence
that consent exists. Each photo must additionally include an opaque
`releaseRef` such as `TWN-REL-2026-A001`, pointing to a privately held,
verified record of the family's and photographer's permission. Never add
family names, personal contact information, release document URLs or the
consent document itself to the public source manifest. Before committing any
photo, confirm the release covers that image and intended use, verify
attribution, and obtain the owner's explicit approval. The format of a
release reference is checked automatically; the underlying consent must
still be verified by an authorised human. A correctly formatted reference
alone never authorises publication; only add a manifest and original to the
repository after the owner approves that exact image for its intended use.

```json
{
  "images": [
    {
      "file": "../../assets/events/walima/2025-12-garden-walima/01-stage-wide.jpg",
      "alt": "Describe what is actually in the photo, plainly.",
      "category": "walima",
      "slot": "home-work-wide",
      "focal": "center",
      "orientation": "landscape",
      "caption": "Optional, factual.",
      "credit": "Photographer name",
      "permission": true,
      "releaseRef": "TWN-REL-2026-A001"
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
