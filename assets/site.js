/* Awesome Commercial Roofers
   One script for the whole site. No dependencies, no build step.
   Every block guards for missing markup so the same file can ship on every page. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav: solid background after 60px ---------- */
  var nav = document.querySelector('[data-nav]');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 60); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- nav: mobile sheet ---------- */
  var burger = document.querySelector('[data-burger]');
  var menu = document.querySelector('[data-menu]');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.textContent = open ? 'Close' : 'Menu';
    });
  }

  /* ---------- nav: services dropdown, click and hover ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-sub]'), function (li) {
    var btn = li.querySelector('button');
    if (!btn) return;
    var set = function (open) {
      li.setAttribute('data-open', String(open));
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      set(li.getAttribute('data-open') !== 'true');
    });
    li.addEventListener('mouseenter', function () { if (window.innerWidth > 1080) set(true); });
    li.addEventListener('mouseleave', function () { if (window.innerWidth > 1080) set(false); });
    document.addEventListener('click', function (e) { if (!li.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  });

  /* ---------- reveal on scroll ---------- */
  var animated = document.querySelectorAll('[data-anim]');
  if (animated.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(animated, function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry, i) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.dataset.delay || '', 10);
          setTimeout(function () { el.classList.add('is-in'); }, isNaN(delay) ? i * 50 : delay);
          io.unobserve(el);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px' });
      Array.prototype.forEach.call(animated, function (el) { io.observe(el); });
    }
  }

  /* ---------- magnetic tilt: hero proof cards, service and review cards ----------
     The card keeps whatever lift its hover rule gives it, because an inline
     transform would otherwise cancel that rule out. */
  if (!reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tilt]'), function (el) {
      var lift = parseFloat(el.getAttribute('data-tilt-lift') || '0') || 0;
      var at = function (rx, ry, ty) {
        el.style.transform = 'perspective(700px) rotateX(' + rx.toFixed(2) +
          'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(' + ty.toFixed(2) + 'px)';
      };
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        at(-y * 6, x * 7, lift);
      });
      el.addEventListener('mouseleave', function () { at(0, 0, 0); });
    });
  }

  /* ---------- stat figures count up once, when they arrive ---------- */
  (function () {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    if (reduced || !('IntersectionObserver' in window)) return;   // markup already shows the final value
    var run = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      var dur = 1400, t0 = null;
      var step = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        /* ease-out cubic: fast first, settles on the number rather than
           arriving at full speed */
        var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = v.toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString('en-US');
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        run(en.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(nums, function (el) { io.observe(el); });
  })();

  /* ---------- decision tiers: flip cards ----------
     Pointer devices flip on hover in CSS. Everything else, touch and keyboard
     included, goes through the toggle button so the back of the card is never
     reachable only by hovering. */
  var flipCards = document.querySelectorAll('[data-flip]');
  Array.prototype.forEach.call(flipCards, function (card) {
    var toggles = card.querySelectorAll('[data-flip-toggle]');
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var on = !card.classList.contains('is-flipped');
      card.classList.toggle('is-flipped', on);
      Array.prototype.forEach.call(toggles, function (b) {
        b.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
      /* activated by its own button: carry focus to the face now showing */
      if (e.target.closest('[data-flip-toggle]')) {
        var next = card.querySelector((on ? '.hx-flip-back' : '.hx-flip-front') + ' [data-flip-toggle]');
        if (next) next.focus();
      }
    });
  });

  /* ---------- sticky call bar: after the hero leaves, never on load ---------- */
  var hero = document.querySelector('.hx-hero');
  var bar = document.querySelector('[data-sticky]');
  if (bar) {
    if (hero && 'IntersectionObserver' in window) {
      bar.style.display = 'none';
      new IntersectionObserver(function (entries) {
        bar.style.display = entries[0].isIntersecting ? 'none' : 'flex';
      }, { threshold: 0 }).observe(hero);
    } else {
      bar.style.display = 'flex';
    }
  }

  /* ---------- before/after sliders: pointer, touch and keyboard ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-ba]'), function (frame) {
    var fig = frame.closest('.hx-ba');
    if (!fig) return;
    var set = function (p) {
      p = Math.max(0, Math.min(100, p));
      fig.style.setProperty('--pos', p + '%');
      frame.setAttribute('aria-valuenow', String(Math.round(p)));
    };
    var fromEvent = function (e) {
      var r = frame.getBoundingClientRect();
      var cx = e.touches ? e.touches[0].clientX : e.clientX;
      set((cx - r.left) / r.width * 100);
    };
    var down = false;
    frame.addEventListener('pointerdown', function (e) {
      down = true;
      if (frame.setPointerCapture) frame.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    frame.addEventListener('pointermove', function (e) { if (down) fromEvent(e); });
    frame.addEventListener('pointerup', function () { down = false; });
    frame.addEventListener('pointercancel', function () { down = false; });
    /* A slider nobody drags is a static photo. Nudge it once when it arrives,
       and never again, and abandon the nudge the moment a person takes over. */
    var touched = false;
    ['pointerdown', 'keydown'].forEach(function (ev) {
      frame.addEventListener(ev, function () { touched = true; fig.classList.remove('is-nudging'); }, true);
    });
    if (!reduced && 'IntersectionObserver' in window) {
      var nio = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        nio.disconnect();
        if (touched) return;
        fig.classList.add('is-nudging');
        var frames = [70, 32, 50], k = 0;
        var tick = function () {
          if (touched || k >= frames.length) {
            if (!touched) setTimeout(function () { fig.classList.remove('is-nudging'); }, 1200);
            return;
          }
          set(frames[k++]);
          setTimeout(tick, 1150);
        };
        setTimeout(tick, 450);
      }, { threshold: 0.55 });
      nio.observe(frame);
    }

    frame.addEventListener('keydown', function (e) {
      var now = parseFloat(frame.getAttribute('aria-valuenow'));
      if (e.key === 'ArrowLeft') { set(now - 4); e.preventDefault(); }
      if (e.key === 'ArrowRight') { set(now + 4); e.preventDefault(); }
      if (e.key === 'Home') { set(0); e.preventDefault(); }
      if (e.key === 'End') { set(100); e.preventDefault(); }
    });
  });

  /* ---------- process rail ---------- */
  (function () {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.hx-proc-row'));
    if (!rows.length) return;
    var img = document.querySelector('[data-proc-img]');
    var shots = ['/assets/img/step-1.webp', '/assets/img/step-2.webp', '/assets/img/step-3.webp',
      '/assets/img/step-4.webp', '/assets/img/step-5.webp'];
    var i = 0, timer = null;
    var restart = function () {
      clearInterval(timer);
      if (!reduced) timer = setInterval(function () { go(i + 1); }, 5000);
    };
    var go = function (n) {
      i = (n + rows.length) % rows.length;
      rows.forEach(function (r, k) {
        r.classList.toggle('is-active', k === i);
        r.classList.toggle('is-done', k < i);
        var t = r.querySelector('.hx-proc-title');
        if (t) t.classList.toggle('is-active', k === i);
      });
      if (img && shots[i]) {
        img.src = shots[i];
        // Steps 3 to 5 are still placeholders; keep the badge honest as the
        // rail advances rather than only on the first frame.
        var ph = (img.getAttribute('data-proc-placeholders') || '')
          .split(',').filter(Boolean).map(Number);
        if (ph.indexOf(i) === -1) img.removeAttribute('data-placeholder');
        else img.setAttribute('data-placeholder', '');
      }
      restart();
    };
    rows.forEach(function (r, k) {
      var t = r.querySelector('.hx-proc-title');
      if (t) t.addEventListener('click', function () { go(k); });
    });
    var next = document.querySelector('[data-proc-next]');
    var prev = document.querySelector('[data-proc-prev]');
    if (next) next.addEventListener('click', function () { go(i + 1); });
    if (prev) prev.addEventListener('click', function () { go(i - 1); });
    var panel = document.querySelector('.hx-proc');
    if (panel) {
      panel.addEventListener('mouseenter', function () { clearInterval(timer); });
      panel.addEventListener('mouseleave', restart);
    }
    restart();
  })();

  /* ---------- systems tabs: click plus arrow keys ---------- */
  (function () {
    var list = document.querySelector('.hx-tabs');
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role=tab]'));
    if (!tabs.length) return;
    var show = function (n) {
      tabs.forEach(function (b, k) {
        var sel = k === n;
        b.setAttribute('aria-selected', String(sel));
        b.setAttribute('tabindex', sel ? '0' : '-1');
        var p = document.getElementById(b.getAttribute('aria-controls'));
        if (p) p.hidden = !sel;
      });
    };
    tabs.forEach(function (b, k) { b.addEventListener('click', function () { show(k); }); });
    list.addEventListener('keydown', function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n === null) return;
      e.preventDefault();
      tabs[n].focus();
      show(n);
    });
    show(0);
  })();

  /* ---------- FAQ accordion ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.hx-faq-q'), function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (btn.nextElementSibling) btn.nextElementSibling.classList.toggle('is-open', !open);
    });
  });

  /* ---------- parallax: the featured band's backdrop drifts as it passes ----------
     Set through `translate`, not `transform`, so it composes with the Ken Burns
     transform animation already running on the same element instead of
     replacing it. */
  (function () {
    var layers = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!layers.length || reduced) return;
    var queued = false;
    var paint = function () {
      queued = false;
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var band = el.parentElement;
        var r = band.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var range = parseFloat(el.getAttribute('data-parallax')) || -60;
        /* -1 when the band is just below the fold, +1 when it has just left */
        var p = 1 - 2 * ((r.top + r.height / 2) / (vh + r.height));
        p = Math.max(-1, Math.min(1, p));
        el.style.translate = '0 ' + (p * range).toFixed(1) + 'px';
      });
    };
    var onScroll = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(paint);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    paint();
  })();

  /* ---------- footer year ---------- */
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
