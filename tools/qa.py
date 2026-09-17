#!/usr/bin/env python3
"""Static pass over the roofing-website-v3 checklist items that can be checked
without a browser. Run before every push."""
import html, json, re, sys

css = open("assets/styles.css", encoding="utf-8").read()
doc = open("index.html", encoding="utf-8").read()
fails, warns = [], []

def fail(m): fails.append(m)
def warn(m): warns.append(m)

# ---------- CSS discipline ----------
root = css[css.index(":root{"):css.index("\n}", css.index(":root{"))]
body = css.replace(root, "")
# #000/#fff inside mask-image are alpha masks; --gradient-shine is the documented
# @property exception (initial-value takes no var()).
stray = [h for h in re.findall(r"#[0-9a-fA-F]{3,8}\b", body)
         if h.lower() not in ("#000", "#fff", "#c8922c")]
# #000/#fff inside mask-image are alpha masks, not surface colour
if stray: fail(f"raw hex outside the token block: {sorted(set(stray))}")

white = re.findall(r"rgba\(255,\s*255,\s*255", body)
if len(white) != 2: fail(f"white-alpha uses = {len(white)}, expected exactly 2 (sheen + CTA glare)")

for sh in re.findall(r"--sh-[a-z]+:[^;]+;", root):
    if re.search(r"rgba\(0,\s*0,\s*0", sh) or re.search(r"rgba\((\d+),\s*\1,\s*\1", sh):
        fail(f"neutral/black shadow: {sh.strip()}")

greys = set(re.findall(r"--(muted|confirm|confirm-deep):", root))
if "muted" not in greys: fail("--muted missing")

fams = set(re.findall(r"family=([A-Za-z+]+)", doc))
if fams != {"Anton", "Archivo"}: fail(f"font families loaded: {fams}, expected exactly Anton + Archivo")
for banned in ("Inter", "Roboto", "Arial", "serif;"):
    if f"family={banned}" in doc: fail(f"banned typeface requested: {banned}")
if re.search(r"font-family:[^;}]*\bGeorgia\b", css): fail("Georgia (third typeface) still in the sheet")

# accent as paragraph-size text on light
for m in re.finditer(r"([^{}]+)\{([^}]*(?:^|[;{\s])color:var\(--accent\)[^}]*)\}", css):
    sel, blk = m.group(1).strip(), m.group(2)
    if "on-dark" in sel or "--dark" in sel or "parallax" in sel or "hx-hero" in sel \
       or "foot" in sel or "feature" in sel or "stars" in sel or "proof" in sel \
       or "shiny" in sel or "crewline" in sel or "hx-proc-rail" in sel:
        continue
    warn(f"check accent-as-text on a light ground: {sel}")

if "prefers-reduced-motion" not in css: fail("no prefers-reduced-motion block")
if "background-attachment:scroll" not in css: fail("no parallax fallback under 900px")
if "max-height" in css and "hx-faq-a" in css.split("max-height")[0][-400:]:
    fail("FAQ accordion still uses max-height")

# ---------- structure ----------
dark = len(re.findall(r'class="hx-sec hx-sec--dark', doc))
if dark > 4: fail(f"{dark} dark sections, the system rations it to 4")
par = len(re.findall(r'class="hx-parallax"', doc))
if par != 1: fail(f"{par} photo-parallax breaks, expected exactly 1")

# every section needs a CTA within two
secs = re.split(r'<!-- ===== (?=\d+)', doc)[1:]
run = 0
for s in secs:
    name = s.split("=", 1)[0].strip()
    has = ('shiny-cta' in s) or ('accent-cta' in s) or ('hx-sticky-btn' in s)
    run = 0 if has else run + 1
    if run >= 2: fail(f"two consecutive sections with no primary CTA, at: {name}")

# ---------- copy laws ----------
h1 = re.search(r"<h1>(.*?)</h1>", doc, re.S).group(1)
for token in ("Farmington", "NM"):
    if token not in h1: fail(f"H1 missing geography token {token!r}: {h1}")
# The display line was removed at the agency's direction. Copy law 1 allows a
# slogan there precisely because the H1 does the literal work; without it the H1
# still carries outcome, service and geography, so this is a valid shape. Kept as
# a warning so its absence stays a recorded decision, not a silent regression.
if not re.search(r"hx-display", doc):
    warn("no hero display line (removed on request; H1 still carries the literal work)")
if not re.search(r"hx-promise", doc): fail("hero promise line missing")
meta = re.search(r'<p class="hx-meta">(.*?)</p>', doc, re.S).group(1)
facts = meta.count("<span>") + meta.count('<span><b')
# CRO rule 3 wants service area, response time, and rating with review count.
# The third cannot ship until the client actually has reviews, and an invented
# one was removed on request, so two is the honest maximum for now.
if facts < 2:
    fail(f"hero meta strip carries {facts} facts, needs at least service area and response time")
elif facts < 3:
    warn("hero meta strip carries 2 of 3 facts; the rating and review count are absent "
         "until the client has reviews")
if "hx-price" not in doc: fail("hero price anchor element missing")
if len(re.findall(r'<li><svg class="hx-check"', doc)) != 4:
    fail("hero USP checklist must carry exactly 4 items")
if len(re.findall(r'<div class="hx-usp-grid">.*?</div>\s*</div>', doc, re.S)) and \
   len(re.findall(r'<article data-anim="panY"', doc)) != 4:
    fail("USP grid must carry exactly 4 cards")

BANNED = ["quality craftsmanship", "attention to detail", "highest quality materials",
          "comprehensive warranties", "top-tier", "peace of mind", "your trusted partner",
          "one-stop shop", "above and beyond", "unmatched", "state-of-the-art", "nestled",
          "dedicated to excellence", "customer satisfaction is our top priority",
          "Learn more</a>", ">Submit<", ">Contact us</a>"]
low = doc.lower()
for b in BANNED:
    if b.lower() in low: fail(f"banned phrase present: {b!r}")
if "conklin" in low: fail("the word Conklin appears, client forbade it")
if "—" in doc: fail("em dash in the copy")

# tradeoff on every systems panel
panels = re.findall(r'role="tabpanel"(.*?)(?=role="tabpanel"|</section>)', doc, re.S)
for i, p in enumerate(panels, 1):
    if "hx-panel-trade" not in p: fail(f"systems panel {i} states no tradeoff")

# ---------- accessibility / build ----------
imgs = re.findall(r"<img\b[^>]*>", doc)
for t in imgs:
    if "alt=" not in t: fail(f"img without alt: {t[:90]}")
    if re.search(r'alt="[^"]*\.(webp|jpg|png)"', t): fail(f"alt is a filename: {t[:90]}")
if len(re.findall(r'href="tel:', doc)) < 4:
    fail("tel: link must be in the nav, hero, CTA band, footer and sticky bar")
if 'loading="lazy"' not in doc: fail("no lazy loading below the fold")
if 'fetchpriority="high"' not in doc: warn("hero image not marked high priority")

# ---------- schema ----------
blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', doc, re.S)
if len(blocks) != 2: fail(f"{len(blocks)} JSON-LD blocks, expected 2")
faq = None
for b in blocks:
    try:
        data = json.loads(b)
    except Exception as e:
        fail(f"invalid JSON-LD: {e}"); continue
    if data.get("@type") == "FAQPage": faq = data
if faq:
    rendered = re.findall(
        r'<button class="hx-faq-q"[^>]*>\s*<span>(.*?)</span>.*?<div class="hx-faq-a">\s*<div>\s*(.*?)\s*</div>\s*</div>',
        doc, re.S)
    def flat(x): return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", x))).strip()
    if len(rendered) != len(faq["mainEntity"]):
        fail(f"schema has {len(faq['mainEntity'])} questions, page renders {len(rendered)}")
    else:
        for (q, a), ent in zip(rendered, faq["mainEntity"]):
            if flat(q) != ent["name"] or flat(a) != ent["acceptedAnswer"]["text"]:
                fail(f"schema does not match rendered copy: {ent['name'][:50]}")
    if len(rendered) < 13: fail(f"homepage FAQ carries {len(rendered)}, the mandatory set is 13")
    for q, a in rendered:
        if not flat(a): fail(f"blank FAQ answer: {flat(q)[:50]}")

tokens = re.findall(r"\{\{CONFIRM:[^}]*\}\}", doc)
flags = re.findall(r'<span class="flag" data-flag="([^"]*)">', doc)
for f_ in flags:
    if not f_.strip():
        fail("a flag carries an empty data-flag, so the punch list cannot name what is missing")
# Invented stand-in content is fine for review and fatal at launch.
launch = "--launch" in sys.argv
if launch and (flags or tokens):
    fail(f"not launch-ready: {len(flags)} invented values and {len(tokens)} unfilled tokens remain")

print(f"\n{len(tokens)} CONFIRM tokens and {len(flags)} invented flagged values on the page.")
print("Every flagged value is a guess. Run with --launch to fail the build while any remain.\n")
for w in warns: print(f"  WARN  {w}")
for f in fails: print(f"  FAIL  {f}")
print(f"\n{len(fails)} failures, {len(warns)} warnings")
sys.exit(1 if fails else 0)
