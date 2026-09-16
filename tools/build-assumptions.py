#!/usr/bin/env python3
"""Collect every {{CONFIRM: }} token into docs/ASSUMPTIONS.md with its page and
section, as the skill's close-out requires. Derived from the markup so it cannot
drift. Re-run after any copy edit:

    python3 tools/build-assumptions.py [page.html ...]
"""
import html, re, sys
from collections import OrderedDict

SECTION = re.compile(r"<!-- =====\s*(.*?)\s*=+ -->")
TOKEN = re.compile(r"\{\{CONFIRM:\s*(.*?)\}\}", re.S)

def plain(fragment, mid_tag=False):
    # A slice can begin inside a tag, which would leak attribute text into the
    # context. Drop everything up to the first tag close when that happens.
    if mid_tag and "<" in fragment and fragment.index(">") < fragment.index("<"):
        fragment = fragment[fragment.index(">") + 1:]
    fragment = re.sub(r"<[^>]*$", " ", fragment)  # drop a trailing partial tag
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    fragment = TOKEN.sub("[...]", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def context(src, m):
    """The sentence around the token, so a numeric token like 00 is answerable."""
    before = plain(src[max(0, m.start() - 340):m.start()], mid_tag=True)
    after = plain(src[m.end():m.end() + 260], mid_tag=True)
    before = before[-110:].lstrip()
    after = after[:110].rstrip()
    return f"...{before} **[{plain(m.group(1))}]** {after}...".replace("|", "\\|")


def collect(path):
    src = open(path, encoding="utf-8").read()
    cuts = [(m.start(), m.group(1).strip(" =")) for m in SECTION.finditer(src)]
    found = OrderedDict()
    for m in TOKEN.finditer(src):
        sec = "Head / nav / footer"
        for pos, name in cuts:
            if pos < m.start():
                sec = name
        key = (sec, plain(m.group(1)), context(src, m))
        found.setdefault(key, 0)
        found[key] += 1
    return found

pages = sys.argv[1:] or ["index.html"]
rows = OrderedDict()
for p in pages:
    for key, n in collect(p).items():
        rows.setdefault(p, OrderedDict())[key] = n

total = sum(n for page in rows.values() for n in page.values())
uniq = sum(len(page) for page in rows.values())

out = ["# Assumptions to confirm", "",
       "Every fact below is wrapped in a `{{CONFIRM: }}` token in the markup. The",
       "sentence around it already reads correctly; only the fact is missing. Nothing",
       "here was invented, estimated from market data, or carried over from another",
       "client.", "",
       f"**{total} placeholders across {len(pages)} page(s).** The site is not publishable",
       "until these are answered, because several of them are promises the client has",
       "to keep after launch.", "",
       "Regenerate with `python3 tools/build-assumptions.py`.", ""]

for page, items in rows.items():
    by_section = OrderedDict()
    for (sec, ask, ctx), n in items.items():
        by_section.setdefault(sec, []).append((ask, ctx, n))
    out += [f"## {page}", ""]
    for sec, entries in by_section.items():
        out += [f"### {sec}", "", "| Fact needed | Where it sits | Uses |", "| --- | --- | --- |"]
        for ask, ctx, n in entries:
            out.append(f"| {ask} | {ctx} | {n} |")
        out.append("")

open("docs/ASSUMPTIONS.md", "w", encoding="utf-8").write("\n".join(out))
print(f"docs/ASSUMPTIONS.md: {uniq} distinct facts, {total} occurrences")
