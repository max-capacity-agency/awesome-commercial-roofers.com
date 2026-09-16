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

  /* ---------- tilt on the hero proof cards ---------- */
  if (!reduced) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tilt]'), function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(600px) rotateX(' + (-y * 8).toFixed(2) +
          'deg) rotateY(' + (x * 10).toFixed(2) + 'deg)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = 'perspective(600px) rotateX(0) rotateY(0)';
      });
    });
  }

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
        var t = r.querySelector('.hx-proc-title');
        if (t) t.classList.toggle('is-active', k === i);
      });
      if (img && shots[i]) img.src = shots[i];
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

  /* ---------- footer year ---------- */
  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
