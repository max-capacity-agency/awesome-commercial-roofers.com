# Asset manifest

## Why every image is a placeholder

The shared Google Drive folder is not link-shared, so it can only be read through an
authenticated connector, one file at a time, as base64. Pulling ~100 multi-megabyte PNGs
that way was not workable, so the build ships generated placeholders at the exact aspect
ratios the layout needs, each labelled with its slot and its brief.

**If you want the Drive images wired in:** set the folder to "Anyone with the link can
view" and say so. They can then be fetched, converted to WebP, resized to each slot's
ratio and dropped in, in one pass.

## The harder problem, which sharing does not fix

The Drive library is a **residential** roofing set. Counting what is in it:

| Category | Roughly | Usable on this site |
| --- | --- | --- |
| Residential shingle roofs, before/after pairs, transformations | ~45 files | No |
| Siding projects | ~12 files | No |
| Windows | ~7 files | No |
| Service tiles for gutters, skylights, storm damage, new construction | ~10 files | No |
| Hero videos, all residential drone footage | 5 files | No |
| Commercial or flat roofing | ~9 files | Maybe, needs review |
| Generic roofer-at-work shots | ~10 files | Some, if no shingles are visible |
| `Roofing logo.png` | 1 file | Unknown, appears to be from another project |

This is a commercial-only roof restoration company. A residential shingle roof in the hero
tells a property manager they are on the wrong site inside a second. Of roughly 100 files,
under 20 are plausibly usable, and none shows a coating restoration, which is the actual
service being sold.

That is why the hero is `hero-style: static` rather than `video`. There is no commercial
video in the library, and the residential drone footage would misrepresent the trade.

## Candidate Drive files, if you want them used as interim stand-ins

These are the only ones worth reviewing. All need captioning as generic system imagery
rather than as this client's work, per the launch decision to hold until real proof exists.

| Slot | Candidate Drive file |
| --- | --- |
| Hero | `Commercial : flat roofing service.png` |
| Featured project | `Commercial roofing 1.png` … `Commercial roofing 5.png` |
| Before / after pair 1 | `Commercial roofing before.png` + `Commercial roofing after.png` |
| Before / after (split, non-interactive) | `Commercial before after split.png` |
| Owner | `Roofer consulting business owner.png` |
| Process, survey step | `Inspection.png`, `Inspection video.mp4` |
| Service: maintenance | `Maintenance programs service.png` |

Nothing in the library suits the four systems tabs, the metal restoration service card, or
the Four Corners parallax break.

## Generated placeholders

`tools/` does not hold the generator; it lives in the session scratchpad because it is a
one-off. Every placeholder is a WebP carrying its slot name, its brief, and its pixel
dimensions, sized so the baked label renders at roughly 12 to 20px on screen whatever the
slot. Total weight of all 25 is 668KB.

Any image still showing a `PLACEHOLDER` badge in the corner is wired up in the layout but
carries no real content. The badge comes from `[data-placeholder]` in `styles.css`; delete
that attribute from the markup as each real photo lands.
