# awesome-commercial-roofers.com

Commercial roof restoration site for Awesome Commercial Roofers, Farmington NM.
Static HTML, no build step, deployed on Netlify.

Built on the `roofing-website-v3` design system. Deviations from it are listed in
[docs/THEME-CONTRACT.md](docs/THEME-CONTRACT.md), each with a reason.

## Status: not publishable yet

The homepage is complete and validated, but **126 facts are still missing** and every
one of them is wrapped in a `{{CONFIRM: }}` token in the markup. Several are promises
the client has to keep after launch (response time, warranty terms, licence number),
so publishing before they are answered would put wrong information on a live site.

See [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md) for the full list with sentence context,
and [docs/SHOT-LIST.md](docs/SHOT-LIST.md) for the photography that has to replace the
placeholder images.

## Layout

```
index.html              the homepage, copy included
404.html
assets/styles.css       the whole design system, one sheet
assets/site.js          all behaviour, no dependencies
assets/img/*.webp       labelled placeholders, see docs/SHOT-LIST.md
netlify.toml            headers, caching, canonical host
tools/                  generators and checks, see below
docs/                   theme contract, assumptions, shot list
```

## Local

```bash
python3 -m http.server 8787      # then open http://localhost:8787/
```

Absolute asset paths mean `file://` will not work. Use the server.

## Checks, before every push

```bash
python3 tools/qa.py              # design system + copy laws + schema match
node tools/visual-qa.js          # renders at 3 widths, asserts layout and behaviour
```

`tools/qa.py` enforces the parts of the CRO checklist a machine can see: no raw hex
outside the token block, exactly two documented white-alpha uses, no neutral shadows,
exactly two font families, no banned phrases, the word "Conklin" never appearing, a
primary CTA at least every two sections, four USP slots, a tradeoff on every systems
panel, alt text on every image, and FAQ schema matching the rendered copy character
for character.

`tools/visual-qa.js` catches what the markup cannot show: it asserts every rendered
box matches its declared `aspect-ratio`, that nothing overflows horizontally at 1440,
1024 and 390, and that the tabs, accordion, before/after slider, sticky bar and mobile
menu all respond.

## Generators, after any copy edit

```bash
python3 tools/build-faq-schema.py     # rewrites the FAQPage JSON-LD from the accordion
python3 tools/build-assumptions.py    # rewrites docs/ASSUMPTIONS.md from the tokens
```

Both derive from the markup, so neither can drift from what the page actually says.
Run them after filling `{{CONFIRM: }}` tokens as well as after rewriting copy.

## Filling the placeholders

The phone number is `(505) 555-0000` / `tel:+15055550000` everywhere, deliberately an
obvious placeholder. One find-and-replace across `index.html` fixes every instance,
including the nav, hero, CTA band, footer, sticky bar and the schema block.

## Before it goes live

- Answer everything in `docs/ASSUMPTIONS.md` and re-run both generators
- Replace every image per `docs/SHOT-LIST.md`
- Switch `/assets/*` caching in `netlify.toml` to `immutable` and add content hashes
  to the asset filenames. It is short on purpose right now because placeholder images
  get replaced under the same names.
- Build the pages the homepage already links to: the four service pages, About,
  Process, Why choose us, Contact, Crew partners, the Farmington city page, the
  building-assessment landing page and Privacy. Until then those links 404.
- Netlify Forms need a real `<form data-netlify="true">` present in the deployed HTML;
  Netlify's parser does not see forms injected by JavaScript. The homepage has no form
  by design, so this applies to the assessment and crew pages.
- Point the Google Business Profile NAP at the footer address character for character
