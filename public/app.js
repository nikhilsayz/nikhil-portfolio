/* Nikhil Kartikeya — portfolio runtime.
   Ports the behaviour documented in the design handoff: film grain,
   nav condense, page transitions, marquees, scroll reveal, work-row previews,
   the workflow stepper, About's experience rows and the case-study chapter bar. */
(function () {
  'use strict';

  var ACC = '#B3CF3C';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mq = function (q) { return window.matchMedia(q).matches; };
  var fine = function () { return mq('(hover: hover) and (pointer: fine)'); };
  var reduced = function () { return mq('(prefers-reduced-motion: reduce)'); };
  var touch = function () { return mq('(hover: none)'); };

  /* ------------------------------------------------------------ page fades */
  /* The intro fade is pure CSS (see [data-page] / @keyframes pageIn) so the page
     is never blank if this script is slow or fails. JS owns only the exit. */
  function initPageTransition() {
    var root = document.body;
    root.style.willChange = 'auto';   // never on body: it breaks position:fixed
    var page = $('[data-page]');
    var reduce = reduced();

    // returning via the back button must not leave the page mid-exit
    window.addEventListener('pageshow', function () {
      if (page) page.removeAttribute('data-leaving');
    });

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href || a.target === '_blank' || a.hasAttribute('download')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      // internal, same-document-navigating links only
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
      if (!href.startsWith('/')) return;
      if (href.split('#')[0] === location.pathname) return;
      if (reduce || !page) return;   // let the browser navigate normally
      e.preventDefault();
      page.setAttribute('data-leaving', '');
      setTimeout(function () { location.href = href; }, 400);
    });
  }

  /* The gradient fields are laid out 20% wider than their section so the blobs
     bleed off-edge. Clip on the section, or they inflate document scrollWidth. */
  function clipFields() {
    $$('[data-herofield], [data-footfield]').forEach(function (f) {
      if (f.parentElement) f.parentElement.style.overflowX = 'clip';
    });
  }

  /* The NK logo is visually tiny; give it a real 44px tap target. */
  function padLogoTarget() {
    var wrap = $('[data-logo-wrap]');
    var link = wrap && wrap.closest('a');
    if (!link) return;
    link.style.minWidth = '44px';
    link.style.minHeight = '44px';
  }

  function applyFields() {
    var run = !reduced();
    $$('[data-herofield], [data-footfield]').forEach(function (f) {
      f.style.opacity = '1';
      $$('div', f).forEach(function (d) {
        if (d.style.animation) d.style.animationPlayState = run ? 'running' : 'paused';
      });
    });
    $$('[data-marquee]').forEach(function (m) {
      m.style.animationPlayState = run ? 'running' : 'paused';
    });
  }

  /* ------------------------------------------------------------------- nav */
  function initNav() {
    var nav = $('[data-nav]');
    var shell = $('[data-nav-shell]');
    var rule = $('[data-nav-rule]');
    if (!nav || !shell) return;

    var wideW = 0, tightW = 0, state = null;

    function measure() {
      var prevW = shell.style.width,
          prevT = shell.style.transition,
          prevJ = shell.style.justifyContent;
      shell.style.transition = 'none';
      shell.style.width = '100%';
      wideW = shell.getBoundingClientRect().width;
      shell.style.justifyContent = 'flex-start';
      shell.style.width = 'max-content';
      tightW = Math.ceil(shell.scrollWidth) + 10;
      shell.style.width = prevW;
      shell.style.justifyContent = prevJ;
      shell.getBoundingClientRect();
      shell.style.transition = prevT;
    }

    function syncH() {
      var h = Math.round(nav.getBoundingClientRect().height);
      if (h) document.documentElement.style.setProperty('--navh', h + 'px');
    }
    syncH();

    function apply(force) {
      syncH();
      if (window.innerWidth <= 900) {
        var glassM = window.scrollY > window.innerHeight * 0.8;
        nav.style.justifyContent = 'center';
        shell.style.width = 'max-content';
        shell.style.maxWidth = '100%';
        shell.style.justifyContent = 'flex-start';
        shell.style.background = glassM ? 'rgba(10,10,10,0.62)' : 'rgba(10,10,10,0)';
        shell.style.borderColor = glassM ? 'rgba(243,242,238,0.16)' : 'rgba(243,242,238,0)';
        shell.style.backdropFilter = glassM ? 'blur(16px) saturate(140%)' : 'blur(0px)';
        shell.style.webkitBackdropFilter = shell.style.backdropFilter;
        shell.style.boxShadow = glassM ? '0 10px 30px rgba(0,0,0,0.4)' : '0 0 0 rgba(0,0,0,0)';
        if (rule) rule.style.opacity = '0';
        state = null;
        return;
      }
      var on = window.scrollY > window.innerHeight * 0.8;
      if (!force && on === state) return;
      state = on;
      if (!wideW || !tightW) measure();
      shell.style.width = (on ? tightW : wideW) + 'px';
      shell.style.justifyContent = on ? 'flex-start' : 'space-between';
      shell.style.background = on ? 'rgba(10,10,10,0.58)' : 'rgba(10,10,10,0)';
      shell.style.borderColor = on ? 'rgba(243,242,238,0.18)' : 'rgba(243,242,238,0)';
      shell.style.backdropFilter = on ? 'blur(18px) saturate(150%)' : 'blur(0px)';
      shell.style.webkitBackdropFilter = shell.style.backdropFilter;
      shell.style.boxShadow = on
        ? '0 1px 0 rgba(255,255,255,0.07) inset, 0 14px 44px rgba(0,0,0,0.45)'
        : '0 0 0 rgba(0,0,0,0)';
      if (rule) rule.style.opacity = on ? '1' : '0';
    }

    requestAnimationFrame(function () { measure(); apply(true); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { wideW = 0; tightW = 0; apply(true); });
    }
    window.addEventListener('scroll', function () { apply(false); }, { passive: true });
    window.addEventListener('resize', function () { wideW = 0; tightW = 0; apply(true); });
    window.addEventListener('orientationchange', function () {
      wideW = 0; tightW = 0; setTimeout(function () { apply(true); }, 120);
    });
  }

  /* ------------------------------------------------------------------ logo */
  var logoW = null;

  function initLogo() {
    var wrap = $('[data-logo-wrap]');
    if (!wrap) return;
    var short = $('[data-logo-short]', wrap);
    var full = $('[data-logo-full]', wrap);
    if (!short || !full) return;

    function measure() {
      var prev = wrap.style.width, prevT = wrap.style.transition;
      wrap.style.transition = 'none';
      wrap.style.width = 'max-content';
      var sw = short.offsetWidth, fw = full.offsetWidth;
      if (!sw || !fw) {                       // pre-layout: never cache a zero
        wrap.style.width = prev || 'max-content';
        wrap.style.transition = prevT;
        return false;
      }
      logoW = { short: sw, full: fw };
      wrap.style.width = sw + 'px';
      wrap.getBoundingClientRect();
      wrap.style.transition = prevT;
      return true;
    }

    wrap.style.width = 'max-content';
    if (!measure()) requestAnimationFrame(measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('resize', measure);
  }

  function swapLogo(open) {
    var wrap = $('[data-logo-wrap]');
    if (!wrap) return;
    var short = $('[data-logo-short]', wrap);
    var full = $('[data-logo-full]', wrap);
    if (!short || !full) return;
    if (!logoW || !logoW.short || !logoW.full) {
      var sw = short.offsetWidth, fw = full.offsetWidth;
      if (sw && fw) logoW = { short: sw, full: fw };
    }
    wrap.style.width = logoW ? (open ? logoW.full : logoW.short) + 'px' : 'max-content';
    short.style.opacity = open ? '0' : '1';
    short.style.transform = open ? 'translateY(-6px)' : 'none';
    short.style.filter = open ? 'blur(3px)' : 'none';
    full.style.opacity = open ? '1' : '0';
    full.style.transform = open ? 'none' : 'translateY(6px)';
    full.style.filter = open ? 'none' : 'blur(3px)';
  }

  /* ---------------------------------------------------------------- footer */
  function initFooter() {
    var link = $('[data-footer-marq]');
    if (!link) return;
    var rows = $$('[data-fill-row]', link);
    var set = function (on) {
      rows.forEach(function (r) { r.style.color = on ? 'var(--acc)' : 'var(--ink)'; });
    };
    link.addEventListener('mouseenter', function () { set(true); });
    link.addEventListener('mouseleave', function () { set(false); });
    link.addEventListener('focusin', function () { set(true); });
    link.addEventListener('focusout', function () { set(false); });
  }

  /* ---------------------------------------------------------------- reveal */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (!els.length) return;
    if (reduced() || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }
    var pending = els.slice();

    function show(el) {
      var i = pending.indexOf(el);
      if (i === -1) return;
      pending.splice(i, 1);
      el.style.opacity = '1';
      el.style.transform = 'none';
      obs.unobserve(el);
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) show(e.target); });
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });

    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition = 'opacity .7s cubic-bezier(.22,.7,.2,1), transform .8s cubic-bezier(.22,.7,.2,1)';
      obs.observe(el);
    });

    /* Safety net. The observer alone can miss elements when the page is
       restored mid-scroll, entered on an anchor, or scrolled in large jumps —
       and a portfolio must never leave a section stuck at opacity 0. */
    var ticking = false;
    function sweep() {
      ticking = false;
      if (!pending.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', sweep);
        return;
      }
      var h = window.innerHeight;
      pending.slice().forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < h * 0.96 && r.bottom > 0) show(el);
      });
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sweep);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sweep);
    window.addEventListener('load', sweep);
    sweep();
    setTimeout(sweep, 1200);
  }

  /* ------------------------------------------------------- work-row preview */
  function initRowPreview() {
    if (!fine()) { $$('[data-preview]').forEach(function (c) { c.style.display = 'none'; }); return; }
    $$('[data-preview]').forEach(function (card) {
      var row = card.closest('a');
      if (!row) return;
      var meta = $('[data-rowmeta]', row);
      card.style.right = 'auto';
      card.style.top = '0';
      card.style.left = '0';
      card.style.willChange = 'transform, opacity';

      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null, live = false;

      function place(e) {
        var r = row.getBoundingClientRect();
        var w = card.offsetWidth || 240, h = card.offsetHeight || 200;
        tx = Math.max(8, Math.min(r.width - w - 8, e.clientX - r.left - w / 2));
        ty = Math.max(-h * 0.18, Math.min(r.height - h * 0.82, e.clientY - r.top - h / 2));
      }
      function loop() {
        cx += (tx - cx) * 0.16;
        cy += (ty - cy) * 0.16;
        card.style.transform = 'translate3d(' + cx.toFixed(1) + 'px, ' + cy.toFixed(1) + 'px, 0) scale(1)';
        raf = live ? requestAnimationFrame(loop) : null;
      }
      function show(e) {
        if (e && e.clientX !== undefined) { place(e); cx = tx; cy = ty + 14; }
        card.style.opacity = '1';
        if (meta) meta.style.opacity = '0';
        if (!live) { live = true; loop(); }
      }
      function hide() {
        live = false;
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        card.style.opacity = '0';
        card.style.transform = 'translate3d(' + cx.toFixed(1) + 'px, ' + (cy + 10).toFixed(1) + 'px, 0) scale(0.97)';
        if (meta) meta.style.opacity = '1';
      }

      row.addEventListener('mouseenter', show);
      row.addEventListener('mousemove', place);
      row.addEventListener('mouseleave', hide);
      row.addEventListener('focusin', function () { show(); });
      row.addEventListener('focusout', hide);
    });
  }

  /* ------------------------------------------------------- workflow stepper */
  var STEPS = {
    1: { idx: '01', copy: 'I start by finding the logic — turning complex behavioural data into a clear structural blueprint before a single pixel exists.' },
    2: { idx: '02', copy: 'Then AI-driven fidelity: generating and rendering high-resolution visuals fast, so the idea and the finished thing stop being two different conversations.' },
    3: { idx: '03', copy: 'Technical precision — polishing every detail, then making it real in Framer or in code. This is where a design either survives or falls apart.' },
    4: { idx: '04', copy: 'Ship, then watch. Deploy, read the behaviour, feed it back in. That part never really ends, which is the point.' }
  };
  var step = 1;

  function applyStack() {
    if (!$('[data-step]')) return;
    $$('[data-step]').forEach(function (el) {
      var on = Number(el.dataset.step) === step;
      var num = $('[data-num]', el), title = $('[data-title]', el),
          sub = $('[data-sub]', el), bar = $('[data-bar]', el);
      if (num) num.style.color = on ? ACC : '#86867E';
      if (title) { title.style.color = on ? 'var(--ink)' : 'var(--t2)'; title.style.opacity = on ? '1' : '0.85'; }
      if (sub) sub.style.opacity = on ? '1' : '0.4';
      if (bar) bar.style.width = on ? '38px' : '0px';
      el.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    var n = 0;
    $$('[data-tool]').forEach(function (el) {
      var on = (el.dataset.in || '').split(',').indexOf(String(step)) > -1;
      var d = on ? n * 0.035 : 0;
      el.style.transition = 'opacity .45s cubic-bezier(.22,.7,.2,1) ' + d + 's, transform .5s cubic-bezier(.22,.7,.2,1) ' + d + 's, border-color .35s, background .35s, filter .4s';
      el.style.opacity = on ? '1' : '0.16';
      el.style.transform = on ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.96)';
      el.style.borderColor = on ? 'rgba(179,207,60,0.55)' : 'var(--line)';
      el.style.background = on ? 'rgba(179,207,60,0.07)' : 'var(--surface2)';
      el.style.filter = on ? 'none' : 'grayscale(1)';
      if (on) n++;
    });

    var idx = $('[data-panel-index]'), copy = $('[data-panel-copy]'), d = STEPS[step];
    if (idx && d && idx.textContent !== d.idx) {
      idx.style.opacity = '0'; idx.style.transform = 'translateY(8px)';
      setTimeout(function () { idx.textContent = d.idx; idx.style.opacity = '1'; idx.style.transform = 'none'; }, 180);
    }
    if (copy && d && copy.textContent.trim() !== d.copy) {
      copy.style.opacity = '0'; copy.style.transform = 'translateY(8px)';
      setTimeout(function () { copy.textContent = d.copy; copy.style.opacity = '1'; copy.style.transform = 'none'; }, 180);
    }
    bind('stepHint', 'Step 0' + step + ' of 04 · hover or tap to explore');
  }

  function setStep(n) {
    if (!n || n === step) return;
    step = n;
    applyStack();
  }

  function initStack() {
    if (!$('[data-step]')) return;
    $$('[data-step]').forEach(function (el) {
      if (!el.hasAttribute('tabindex') && el.tagName !== 'BUTTON' && el.tagName !== 'A') {
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
      }
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStep(Number(el.dataset.step)); }
      });
    });
    applyStack();
  }

  /* ----------------------------------------------- About: experience rows */
  function setExp(row, open) {
    var body = $('[data-exp-body]', row);
    var arrow = $('[data-exp-arrow]', row);
    if (body) {
      body.style.maxHeight = open ? body.scrollHeight + 30 + 'px' : '0px';
      body.style.opacity = open ? '1' : '0';
    }
    if (arrow) {
      arrow.style.transform = open ? 'rotate(90deg)' : 'none';
      arrow.style.color = open ? '#0A0A0A' : '#86867E';
      arrow.style.background = open ? ACC : 'transparent';
      arrow.style.borderColor = open ? ACC : 'var(--line)';
    }
    row.dataset.open = open ? '1' : '';
    row.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function initExp() {
    var rows = $$('[data-exp]');
    if (!rows.length) return;
    rows.forEach(function (row) {
      if (!row.hasAttribute('tabindex')) row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'button');
      row.setAttribute('aria-expanded', 'false');
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExp(row, !row.dataset.open); }
      });
      row.addEventListener('focus', function () { if (!touch()) setExp(row, true); });
      row.addEventListener('blur', function () { if (!touch()) setExp(row, false); });
    });
    // an open row must re-measure when the viewport changes
    window.addEventListener('resize', function () {
      rows.forEach(function (r) {
        if (!r.dataset.open) return;
        var b = $('[data-exp-body]', r);
        if (b) { b.style.maxHeight = 'none'; b.style.maxHeight = b.scrollHeight + 30 + 'px'; }
      });
    });
  }

  /* --------------------------------------------------- case-study chapters */
  function initChapters() {
    var bar = $('[data-progress]');
    var label = $('[data-chapter]');
    if (!bar && !label) return;
    var ticking = false;

    function update() {
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + '%';
      if (!label) return;
      var current = null;
      $$('[data-sec]').forEach(function (s) {
        if (s.getBoundingClientRect().top < window.innerHeight * 0.45) current = s.dataset.sec;
      });
      var next = current || '01 — Overview';
      if (label.textContent !== next) label.textContent = next;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* -------------------------------------------------------- misc behaviours */
  function initFzPhoto() {
    var photo = $('[data-fz-photo]');
    if (!photo) return;
    var plate = photo.closest('a');
    if (!plate) return;
    var on = function () { photo.style.filter = 'grayscale(0) contrast(1) brightness(1)'; photo.style.transform = 'scale(1.04)'; };
    var off = function () { photo.style.filter = 'grayscale(1) contrast(1.08) brightness(0.82)'; photo.style.transform = 'scale(1.01)'; };
    plate.addEventListener('mouseenter', on);
    plate.addEventListener('mouseleave', off);
    plate.addEventListener('focusin', on);
    plate.addEventListener('focusout', off);
    if (touch() && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.intersectionRatio > 0.6 ? on() : off(); });
      }, { threshold: [0, 0.6, 1] }).observe(plate);
    }
  }

  function initIconFallbacks() {
    $$('[data-tool] img').forEach(function (img) {
      var fallback = function () {
        var host = img.closest('[data-tool]');
        var label = (host && host.dataset.label) || '';
        var s = document.createElement('span');
        s.style.cssText = 'width:17px;text-align:center;font-size:12px;font-weight:800;font-stretch:76%;';
        s.textContent = label.slice(0, 2);
        img.replaceWith(s);
      };
      img.addEventListener('error', fallback);
      if (img.complete && img.naturalWidth === 0) fallback();
    });
  }

  function initClock() {
    var el = $('[data-bind="clock"]');
    if (!el) return;
    var tick = function () {
      var t = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit'
      });
      el.textContent = t + ' IST';
    };
    tick();
    setInterval(tick, 20000);
  }

  function bind(key, value) {
    var el = document.querySelector('[data-bind="' + key + '"]');
    if (el) el.textContent = value;
  }

  function initContactForm() {
    var form = $('form');
    if (!form) return;
    bind('buttonLabel', 'Send message');
    bind('statusNote', 'Straight to my inbox — your mail client opens with the message ready to send. Replies within a day.');
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var get = function (k) { return (data.get(k) || '').toString().trim(); };
      var name = get('name') || get('Name');
      var email = get('email') || get('Email');
      var message = get('message');
      var topic = get('subject');

      if (!name || !email || !message) {
        bind('statusNote', 'Please add your name, email and a short message first.');
        return;
      }
      var subject = encodeURIComponent(topic ? topic + ' — ' + name : 'Portfolio enquiry — ' + name);
      var lines = [message, '', '— ' + name, email];
      var body = encodeURIComponent(lines.join('\n'));
      window.location.href = 'mailto:nikhilkalimahanthi@gmail.com?subject=' + subject + '&body=' + body;
      bind('buttonLabel', 'Opening your mail app');
      bind('statusNote', 'Your mail client should be opening with the message ready. If nothing happens, write to nikhilkalimahanthi@gmail.com directly.');
    });
  }

  /* --------------------------------------------- declarative handler wiring */
  var HANDLERS = {
    onLogoIn: function () { swapLogo(true); },
    onLogoOut: function () { swapLogo(false); },
    onStep: function (e) { setStep(Number(e.currentTarget.dataset.step)); },
    onExpOpen: function (e) { if (!touch()) setExp(e.currentTarget, true); },
    onExpClose: function (e) { if (!touch()) setExp(e.currentTarget, false); },
    onExpToggle: function (e) { setExp(e.currentTarget, !e.currentTarget.dataset.open); },
    onSubmit: function (e) { e.preventDefault(); }
  };

  function wireHandlers() {
    $$('[data-on]').forEach(function (el) {
      el.dataset.on.split(/\s+/).forEach(function (pair) {
        var bits = pair.split(':');
        var evt = bits[0], name = bits[1];
        var fn = HANDLERS[name];
        if (!fn) return;
        if (evt === 'mouseenter' || evt === 'mouseleave') {
          el.addEventListener(evt, function (e) { if (!touch()) fn(e); });
        } else if (evt === 'submit') {
          // handled by initContactForm
        } else {
          el.addEventListener(evt, fn);
        }
      });
    });
  }

  /* ------------------------------------------------------- reduced motion */
  function watchMotion() {
    var m = window.matchMedia('(prefers-reduced-motion: reduce)');
    var on = function () { applyFields(); };
    if (m.addEventListener) m.addEventListener('change', on);
    else if (m.addListener) m.addListener(on);
  }

  function boot() {
    initPageTransition();
    clipFields();
    padLogoTarget();
    applyFields();
    initNav();
    initLogo();
    initFooter();
    initReveal();
    initRowPreview();
    initStack();
    initExp();
    initChapters();
    initFzPhoto();
    initIconFallbacks();
    initClock();
    initContactForm();
    wireHandlers();
    watchMotion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
