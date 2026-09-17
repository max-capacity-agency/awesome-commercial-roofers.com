# Theme contract: Awesome Commercial Roofers

The design system ships no colours of its own. It carries five brand inputs and derives
everything else. The palette is taken from the live site at awesome-commercial-roofers.com,
which runs `#ffb400` yellow (91 uses in its stylesheet), `#0d0d0d` near-black, white and
`#737373` grey.

**This overrides the intake form**, which asked for "forest green (dark green) n Gold".
Matching the existing site keeps brand continuity; the green build is in git history if
anyone wants to compare.

Every ratio here was measured, not eyeballed.

## Brand inputs

| Token | Value | What it is |
| --- | --- | --- |
| `--dark` | `#12100A` | The site's `#0d0d0d`, tinted a few degrees toward the brand amber. The system requires a tinted dark, not a neutral one. |
| `--light` | `#FAF7F0` | Reads as white, carries the brand hue. Never `#ffffff`, per the contract. |
| `--accent` | `#FFB400` | The brand yellow, taken from the live site unchanged. |
| `--ink` | `#14110B` | Headings and body on light grounds. |
| `--font-display` | Anton | Heavy, condensed, uppercase only above 0.9rem. |
| `--font-body` | Archivo | Clean grotesque, 400 to 800. |

Two families, no third. Not Inter, Roboto or Arial. No serif pairing.

## Derived

| Token | Value | Derivation |
| --- | --- | --- |
| `--dark-deep` | `#0A0906` | `--dark` darkened |
| `--dark-base` | `#050403` | hero base and overlay floor |
| `--accent-deep` | `#8A6100` | `--accent` stepped down until it clears 4.5:1 on `--light` |
| `--light-raised` | `#FFFDF8` | `--light` lightened a few points |
| `--accent-ink` | `#12100A` | text on accent fills, see the deviation below |
| `--muted` | `#6B6459` | the only grey in the system |
| `--confirm` | `var(--accent)` | checkmarks on dark grounds |
| `--confirm-deep` | `var(--accent-deep)` | checkmarks on light grounds |

`--on-dark-*` alphas use the `--light` triplet `250,247,240`.
`--line*` alphas use the `--dark` triplet `18,16,10`.

**The site's own dark-yellow step does not pass.** It ships `#E6A200`, `#CC9000` and
`#996C00`. Measured on this light ground those are 2.06:1, 2.60:1 and 4.36:1. The last is
the closest and still misses 4.5:1, so `--accent-deep` steps one further to `#8A6100`
(5.18:1). Anywhere the current site sets yellow text on white, it is failing WCAG AA.

Every shadow is tinted with `--dark` or `--dark-base`. None is neutral black.

## Measured contrast

| Pair | Ratio | Needs | Result |
| --- | --- | --- | --- |
| `--dark` on `--light` | 17.77:1 | 4.5:1 | pass |
| `--ink` on `--light` | 17.61:1 | 4.5:1 | pass |
| `--ink` on `--light-raised` | 18.53:1 | 4.5:1 | pass |
| `--accent-deep` on `--light` | 5.18:1 | 4.5:1 | pass |
| `--accent-deep` on `--light-raised` | 5.45:1 | 4.5:1 | pass |
| `--accent` as text on `--light` | 1.67:1 | fails by design | correct, fill only |
| `--accent` as `<em>` on `--dark` | 10.67:1 | 4.5:1 | pass |
| `--accent-ink` on `--accent` | 10.67:1 | 4.5:1 | pass |
| `--muted` on `--light` | 5.46:1 | 4.5:1 | pass |
| `--light` at .92 alpha on `--dark` | 15.09:1 | 4.5:1 | pass |
| `--light` at .78 alpha on `--dark` | 10.92:1 | 4.5:1 | pass |

## Contract checklist

- [x] `--light` is tinted, not `#ffffff`
- [x] `--dark` clears 4.5:1 against `--light`
- [x] `--ink` clears 4.5:1 against `--light` and `--light-raised`
- [x] `--accent-deep` clears 4.5:1 against `--light` at 16px
- [x] `--accent` used only as a fill, as `<em>` on dark, or as a figure
- [x] every `--on-dark-*` alpha uses the `--light` RGB triplet
- [x] every `--line*` alpha uses the `--dark` RGB triplet
- [x] every shadow tinted with `--dark`, none neutral black
- [x] exactly two font families loaded
- [x] no raw hex outside the token block, bar the one documented exception

`tools/qa.py` enforces the last five on every run.

## Four deviations from the reference sheet, each deliberate

**1. `--accent-ink` is `#12100A`, not `#ffffff`.** The reference block sets white text on the
accent fill. On this yellow that measures 1.78:1, which is close to invisible. Near-black on
the yellow measures 10.67:1.

**2. The FAQ accordion animates `grid-template-rows`, not `max-height`.** `components.md`
shows `max-height:340px`; `design-system.md` says "Never `max-height`" in the motion
vocabulary. The explicit prohibition wins, and the fixed 340px would have clipped four of
the fourteen answers on this page anyway.

**3. Base body type is 1.0625rem, not 1rem.** The client asked for "med to large so people
can read with no problems". The scale, line height and measure are otherwise untouched.

**4. Checkmarks use the brand yellow, not the system's `#8FBF7A` green.** On a forest-green
brand that green was harmonious. On white/yellow/black it reads as a stray third hue, so
`--confirm` maps to `--accent` on dark grounds and `--accent-deep` on light. Both clear
contrast with room to spare.

## Three gaps the reference sheet has, filled here

- `--r-process` (32px) is named in the design-system prose but missing from the token block.
- `--ground` is referenced by components 8 and 10 but never defined. Mapped to `--light-raised`.
- Components 9 and 10 set `background:#fff` and a Georgia quote glyph. White is not a ground
  in this system and Georgia would be a third typeface, so both were replaced with
  `--light-raised` and `--font-display`.
