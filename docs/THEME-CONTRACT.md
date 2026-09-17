# Theme contract: Awesome Commercial Roofers

The design system ships no colours of its own. It carries five brand inputs and derives
everything else. The client supplied "forest green (dark green) n Gold" and no logo, so
the two hexes below are a **proposal**, not a decision, and they are recorded as such.

A white/yellow/black build matched to the current live site was made and then reverted at
the agency's direction, in favour of what James actually asked for on the intake form. It
is in git history at `d36ad5e` if anyone wants to compare. One finding from it is worth
keeping: the live site's own dark-yellow steps (`#E6A200`, `#CC9000`, `#996C00`) measure
2.06:1, 2.60:1 and 4.36:1 on a white ground, so anywhere it sets yellow text on white it
is failing WCAG AA today.

Every ratio here was measured, not eyeballed.

## Brand inputs

| Token | Value | What it is |
| --- | --- | --- |
| `--dark` | `#13351F` | Forest green. Dark sections, nav, footer, headings on light. |
| `--light` | `#EEF2EA` | Page ground, tinted with the brand hue. Never `#ffffff`. |
| `--accent` | `#C8922C` | Gold. Primary button fill, eyebrows, `<em>`, figures, active states. |
| `--ink` | `#141A16` | Headings and body on light grounds. |
| `--font-display` | Anton | Heavy, condensed, uppercase only above 0.9rem. |
| `--font-body` | Archivo | Clean grotesque, 400 to 800. |

Two families, no third. Not Inter, Roboto or Arial. No serif pairing.

## Derived

| Token | Value | Derivation |
| --- | --- | --- |
| `--dark-deep` | `#0C2415` | `--dark` darkened ~15% lightness |
| `--dark-base` | `#081A0F` | hero base and overlay floor |
| `--accent-deep` | `#8B631F` | `--accent` stepped down until it clears 4.5:1 on `--light` |
| `--light-raised` | `#F7FAF5` | `--light` lightened a few points |
| `--accent-ink` | `#0C2415` | text on accent fills, see the deviation below |
| `--muted` | `#5B6660` | the only grey in the system |
| `--confirm` | `#8FBF7A` | checkmarks on dark grounds |
| `--confirm-deep` | `#5E8C48` | checkmarks on light grounds |

`--on-dark-*` alphas use the `--light` triplet `238,242,234`.
`--line*` alphas use the `--dark` triplet `19,53,31`.
Every shadow is tinted with `--dark` or `--dark-base`. None is neutral black.

## Measured contrast

| Pair | Ratio | Needs | Result |
| --- | --- | --- | --- |
| `--dark` on `--light` | 11.90:1 | 4.5:1 | pass |
| `--ink` on `--light` | 15.58:1 | 4.5:1 | pass |
| `--ink` on `--light-raised` | 16.78:1 | 4.5:1 | pass |
| `--accent-deep` on `--light` | 4.75:1 | 4.5:1 | pass |
| `--accent-deep` on `--light-raised` | 5.11:1 | 4.5:1 | pass |
| `--accent` as text on `--light` | 2.44:1 | fails by design | correct, fill only |
| `--accent` as `<em>` on `--dark` | 4.88:1 | 4.5:1 | pass |
| `--accent-ink` on `--accent` | 5.95:1 | 4.5:1 | pass |
| `--accent` against `--dark-base` | 6.53:1 | 3:1 non-text | pass |
| `--muted` on `--light` | 5.27:1 | 4.5:1 | pass |
| `--light` at .92 alpha on `--dark` | 10.31:1 | 4.5:1 | pass |
| `--light` at .78 alpha on `--dark` | 7.83:1 | 4.5:1 | pass |

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

## Three deviations from the reference sheet, each deliberate

**1. `--accent-ink` is `#0C2415`, not `#ffffff`.** The reference block sets white text on the
accent fill. On this gold that measures 2.76:1 and fails badly. Dark green on gold measures
5.95:1. White on gold is unreadable in any brand, so this looks like a bug in the reference
rather than a rule.

**2. The FAQ accordion animates `grid-template-rows`, not `max-height`.** `components.md`
shows `max-height:340px`; `design-system.md` says "Never `max-height`" in the motion
vocabulary. The explicit prohibition wins, and the fixed 340px would have clipped four of
the fourteen answers on this page anyway.

**3. Base body type is 1.0625rem, not 1rem.** The client asked for "med to large so people
can read with no problems". The scale, line height and measure are otherwise untouched.

## Three gaps the reference sheet has, filled here

- `--r-process` (32px) is named in the design-system prose but missing from the token block.
- `--ground` is referenced by components 8 and 10 but never defined. Mapped to `--light-raised`.
- Components 9 and 10 set `background:#fff` and a Georgia quote glyph. White is not a ground
  in this system and Georgia would be a third typeface, so both were replaced with
  `--light-raised` and `--font-display`.

## Motion

Nine motion behaviours, all of them off under `prefers-reduced-motion: reduce`.
The CSS-only ones fall to the global `animation:none;transition:none` rule; the
five driven by script check the media query and return before doing anything.

| Behaviour | Where | Driven by |
| --- | --- | --- |
| Reveal on scroll | every `[data-anim]` block | IntersectionObserver adds `is-in` |
| Ken Burns | hero and featured backdrops | CSS keyframes |
| Card flip | decision tiers | CSS `rotateY`, 1.9s, hover on pointer devices and a button everywhere else |
| Count up | the two stat figures | script, 1.4s ease-out cubic, once per figure |
| Cumulative rail | process steps | script adds `is-done` to steps behind the active one |
| Attract nudge | before/after slider | script, three positions, once, abandoned the moment a person drags |
| Magnetic tilt | hero panels, service and review cards | script, pointer position, `hover:hover and pointer:fine` only |
| Parallax | featured band backdrop | script sets `translate`, which composes with the Ken Burns `transform` |
| Staggered rows | comparison table | `[data-anim="fade"]` with 70ms steps, our column 35ms ahead of theirs |
| Sheen on the rim | primary button | animated conic gradient on the border box |

**Buttons set `text-shadow:none`.** The hero applies a two-layer text shadow to
everything inside it so copy stays legible over the photograph. A button carries
its own solid ground, so it needs none, and inheriting it put a dark blur behind
the label. The ghost button is the exception and keeps the shadow, because its
ground really is the photograph.

**The primary button lost its radial vignette and rotating sheen overlay.** Both
were depth cues tuned for the forest-green ground. On gold the vignette read as a
smear across the lower half and the overlay as a light band at the top edge. The
travelling highlight on the border box is what makes this the shiny button, and
that is all that remains.

Two of these need a note.

**The parallax uses `translate`, not `transform`.** The same element already runs
a Ken Burns `transform` animation, and a script-set `transform` would replace it.
The separate `translate` property applies before `transform` and composes with
it, so both run. `tools/visual-qa.js` asserts the computed `transform` is still
a matrix after the parallax has moved, so this cannot silently regress.

**The sticky FAQ question earns almost nothing at current answer lengths.** It is
implemented and correct: the question pins at `--nav-h` plus 8px while its own
row passes. But the tallest open row is 207px against an 844px phone viewport, so
the whole question and answer fit on screen and the question never needs to
stick. It is kept because it costs nothing and starts paying the moment an answer
grows past a screen. Nobody should expect to see it today.

## The flag convention

Values the client has not confirmed are shown on the page as invented stand-ins wrapped in
`<span class="flag" data-flag="what we still need">`, marked with a flag emoji and nothing
else. They exist so the page reads as a finished thing during review without any invented
number passing as a fact.

The span carried a dotted accent underline as well until the agency asked for the emoji on
its own. The underline is gone rather than restyled, so the marker is now a single signal
instead of two, and the copy underneath reads at normal weight.

The design system bans emoji outright. This is a deliberate, temporary override for the
review build: every flag comes out as its fact is confirmed, and `tools/qa.py --launch`
fails the build while a single one remains.
