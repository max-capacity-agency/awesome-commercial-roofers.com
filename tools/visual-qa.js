/* Renders the page and asserts what the static checker cannot see: that every
   element's rendered box matches its declared aspect-ratio, that nothing
   overflows horizontally, and that the interactive components respond.

   The aspect-ratio assertion exists because width/height attributes on <img>
   are presentational hints that silently defeat `aspect-ratio` unless the rule
   also sets `height:auto`. That bug is invisible in the markup.

   Usage: node tools/visual-qa.js [url]                                        */
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://localhost:8787/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const fails = [];
  const browser = await chromium.launch({ executablePath: EXE });

  for (const vp of [{ width: 1440, height: 950, tag: 'desktop' },
                    { width: 1024, height: 800, tag: 'tablet' },
                    { width: 390, height: 844, tag: 'mobile' }]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    page.on('pageerror', e => fails.push(`${vp.tag}: page error: ${e.message}`));
    page.on('console', m => {
      if (m.type() !== 'error') return;
      if (/Failed to load resource/.test(m.text())) return; // reported via requestfailed, with a URL
      fails.push(`${vp.tag}: console: ${m.text()}`);
    });
    page.on('requestfailed', r => {
      const u = r.url();
      if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return; // blocked by the sandbox proxy, not a site fault
      fails.push(`${vp.tag}: request failed: ${u}`);
    });
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    // Two things the geometry assertions below need, neither of which the real
    // page should change. Smooth scrolling makes every scrollTo read back a
    // stale position, which silently turned the horizontal-overflow check into
    // a no-op. And the reveal animations translate elements sideways while they
    // run, so a check that lands mid-flight sees an overflow that does not
    // exist a moment later. We are asserting the settled layout, so settle it.
    await page.addStyleTag({ content:
      'html{scroll-behavior:auto!important}' +
      '[data-anim]{opacity:1!important;animation:none!important;transform:none!important}' });
    await page.evaluate(() => document.querySelectorAll('[data-anim]').forEach(e => e.classList.add('is-in')));
    await page.waitForTimeout(600);

    const report = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('*').forEach(el => {
        const cs = getComputedStyle(el);
        const ar = cs.aspectRatio;
        if (!ar || ar === 'auto' || ar.startsWith('auto ')) return;
        const [a, b] = ar.split('/').map(s => parseFloat(s));
        if (!a || !b) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const want = a / b, got = r.width / r.height;
        if (Math.abs(want - got) / want > 0.04) {
          bad.push(`${el.className || el.tagName} declares ${ar} but renders ${got.toFixed(2)} (${Math.round(r.width)}x${Math.round(r.height)})`);
        }
      });
      // documentElement.scrollWidth counts visual overflow that `overflow:hidden`
      // already clips, and the design system deliberately scales full-bleed hero
      // photography past the viewport edge (Ken Burns). So test what a user can
      // actually do, then separately name any in-flow element that really blows out.
      window.scrollTo(400, 0);
      const canScrollX = window.scrollX > 0;
      window.scrollTo(0, 0);
      const clipped = el => {
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const o = getComputedStyle(a);
          if (o.overflowX === 'hidden' || o.overflowX === 'clip') return true;
        }
        return false;
      };
      const wide = [];
      document.querySelectorAll('body *').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.right <= window.innerWidth + 1) return;
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') return;
        if (cs.transform !== 'none') return;   // a transform is visual, not layout
        if (clipped(el)) return;               // an ancestor already clips it
        wide.push(`${el.tagName}.${(el.className || '').toString().trim().slice(0, 34)} ` +
                  `w=${Math.round(r.width)} right=${Math.round(r.right)}`);
      });
      return { bad: [...new Set(bad)], canScrollX, wide: [...new Set(wide)].slice(0, 6) };
    });

    report.bad.forEach(m => fails.push(`${vp.tag}: ${m}`));
    if (report.canScrollX) fails.push(`${vp.tag}: the page scrolls horizontally`);
    report.wide.forEach(w => fails.push(`${vp.tag}: unclipped element past the viewport: ${w}`));

    // Cheap guard against a whole block vanishing: the hero H1 must be on
    // screen at load. A positioning regression once pushed it out of view and
    // every geometry assertion still passed.
    const heroVisible = await page.evaluate(() => {
      const h1 = document.querySelector('.hx-hero h1');
      if (!h1) return 'missing';
      const r = h1.getBoundingClientRect();
      return (r.width > 100 && r.top < window.innerHeight && r.bottom > 0) ? 'ok'
           : `off-screen (top=${Math.round(r.top)} h=${Math.round(r.height)})`;
    });
    if (heroVisible !== 'ok') fails.push(`${vp.tag}: hero H1 not visible at load: ${heroVisible}`);

    if (vp.tag === 'desktop') {
      await page.click('#tab-silicone');
      if (await page.evaluate(() => document.getElementById('sys-silicone').hidden)) fails.push('tabs do not switch');
      await page.click('.hx-faq-q');
      await page.waitForTimeout(650);
      if (!await page.evaluate(() => document.querySelector('.hx-faq-a').getBoundingClientRect().height > 30))
        fails.push('FAQ accordion does not open');
      // the decision cards hide the argument behind a flip, so the tap toggle
      // has to work without hover and both faces have to fit the card
      await page.click('.hx-flip-hint');
      await page.waitForTimeout(1100);
      const flip = await page.evaluate(() => {
        const card = document.querySelector('[data-flip]');
        const inner = card.querySelector('.hx-flip-in');
        const t = getComputedStyle(inner).transform;
        const m = new DOMMatrixReadOnly(t === 'none' ? undefined : t);
        const over = [...document.querySelectorAll('.hx-flip-face')]
          .filter(f => f.scrollHeight > f.clientHeight + 1).length;
        return { flipped: card.classList.contains('is-flipped'), m11: Math.round(m.m11),
                 expanded: card.querySelector('.hx-flip-back [data-flip-toggle]')
                   .getAttribute('aria-expanded'), over: over };
      });
      if (!flip.flipped || flip.m11 !== -1) fails.push(`decision card does not flip on tap (${JSON.stringify(flip)})`);
      if (flip.expanded !== 'true') fails.push('decision card does not report aria-expanded after flipping');
      if (flip.over) fails.push(`${flip.over} flip face(s) overflow the card`);

      await page.focus('[data-ba]');
      await page.keyboard.press('ArrowRight');
      if (await page.getAttribute('[data-ba]', 'aria-valuenow') === '50') fails.push('before/after ignores the keyboard');
      // the stat figures must land on their real value, and must not eat the
      // flag marker sitting in the same span
      await page.evaluate(() => document.querySelector('.hx-usp-grid').scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(2200);
      const counted = await page.evaluate(() => [...document.querySelectorAll('[data-count]')].map(el => ({
        shown: el.textContent,
        want: Number(el.getAttribute('data-count')).toLocaleString('en-US'),
        flag: !!el.parentElement.querySelector('i') })));
      counted.forEach(c => {
        if (c.shown !== c.want) fails.push(`counter settled on ${c.shown}, not ${c.want}`);
        if (!c.flag) fails.push(`counter at ${c.want} lost its flag marker`);
      });

      // the featured band's backdrop has to move with scroll, and its parallax
      // must not replace the Ken Burns transform on the same element
      const par = [];
      const bandTop = await page.evaluate(() =>
        Math.round(document.querySelector('.hx-feature').getBoundingClientRect().top + scrollY));
      for (const d of [-600, -200, 200]) {
        await page.evaluate(y => window.scrollTo(0, y), bandTop + d);
        await page.waitForTimeout(240);
        par.push(await page.evaluate(() => ({
          t: document.querySelector('[data-parallax]').style.translate,
          tf: getComputedStyle(document.querySelector('[data-parallax]')).transform })));
      }
      if (new Set(par.map(x => x.t)).size < 3) fails.push(`parallax layer does not move: ${par.map(x => x.t).join(' / ')}`);
      if (par.some(x => x.tf === 'none')) fails.push('parallax replaced the Ken Burns transform instead of composing with it');

      // the rail has to read as progress: every step before the active one filled
      await page.evaluate(() => { document.querySelector('[data-proc-next]').click();
        document.querySelector('[data-proc-next]').click(); });
      await page.waitForTimeout(120);
      const rail = await page.evaluate(() => [...document.querySelectorAll('.hx-proc-row')]
        .map(r => r.classList.contains('is-done') ? 'd' : r.classList.contains('is-active') ? 'a' : '-').join(''));
      if (!/^d*a-*$/.test(rail)) fails.push(`process rail is not cumulative: ${rail}`);

      await page.evaluate(() => window.scrollTo(0, 3000));
      await page.waitForTimeout(300);
      if (await page.evaluate(() => getComputedStyle(document.querySelector('[data-sticky]')).display) === 'none')
        fails.push('sticky call bar never appears after the hero');
    }
    if (vp.tag === 'mobile') {
      await page.click('[data-burger]');
      await page.waitForTimeout(250);
      if (!await page.evaluate(() => document.querySelector('[data-menu]').classList.contains('is-open')))
        fails.push('mobile menu does not open');
    }
    await page.close();
  }

  await browser.close();
  fails.forEach(f => console.log('  FAIL  ' + f));
  console.log(`\n${fails.length} failures`);
  process.exit(fails.length ? 1 : 0);
})();
