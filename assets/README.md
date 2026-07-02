# Directory / listing assets

Icons for the Claude Connectors Directory and ChatGPT App Directory submissions.

| File | Size | Use |
| --- | --- | --- |
| `app-icon-64.png` | 64×64, <1KB | ChatGPT App Directory icon (spec: 64×64px, <5KB) |
| `app-icon-512.png` | 512×512 | Claude listing / general use / social |

**Source:** the A2Me icon master `A2Me/app-icons/a2me-icon-1024.png` in the kinnectd
Google Drive (white DNA-helix on black, brand dark treatment). Regenerate with:

```bash
magick a2me-icon-1024.png -resize 64x64  -strip app-icon-64.png
magick a2me-icon-1024.png -resize 512x512 -strip app-icon-512.png
```

Screenshots (3–5 PNG per directory) are captured live from the connected app and
are not stored here — see `docs/directory-submission.md`.
