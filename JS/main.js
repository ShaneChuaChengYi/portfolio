/* ============================================================
   EAE Portfolio — Edition 02
   Editorial JS:
     - Theme persistence (paper / ink)
     - Sidebar nav + mobile overlay
     - Staggered clip-mask reveals (IntersectionObserver)
     - Number count-up on KPIs / stat strip
     - SVG bar + donut animations driven by scroll
     - Sortable / filterable analytics tables
     - Desktop hero cursor halo
   ============================================================ */
(function () {
  'use strict';

  const root = document.documentElement;
  const STORE = 'eae-portfolio-theme';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- Theme ---------- */
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    document.querySelectorAll('.theme-toggle .label').forEach(el => {
      el.textContent = t === 'light' ? 'Paper' : 'Ink';
    });
  }
  function initTheme() {
    let stored = null;
    try { stored = localStorage.getItem(STORE); } catch (e) {}
    applyTheme(stored === 'light' ? 'light' : 'dark');
  }
  function toggleTheme() {
    const next = (root.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(STORE, next); } catch (e) {}
  }

  /* ---------- Nav ---------- */
  function initNav() {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav-list a').forEach(a => {
      const href = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
      if (href === path) a.classList.add('active');
    });

    const side  = document.querySelector('.side-nav');
    const scrim = document.querySelector('.scrim');
    const open  = document.querySelector('.menu-btn');
    const close = document.querySelector('.menu-close');

    function openMenu() {
      if (!side) return;
      side.classList.add('open');
      if (scrim) scrim.classList.add('show');
    }
    function closeMenu() {
      if (!side) return;
      side.classList.remove('open');
      if (scrim) scrim.classList.remove('show');
    }

    if (open)  open.addEventListener('click', openMenu);
    if (close) close.addEventListener('click', closeMenu);
    if (scrim) scrim.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

    document.querySelectorAll('.theme-toggle').forEach(b => b.addEventListener('click', toggleTheme));
  }

  /* ---------- Reveal ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    // Stagger items that share a parent
    const groups = new Map();
    items.forEach(el => {
      const p = el.parentElement;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(el);
    });
    groups.forEach(arr => {
      arr.forEach((el, i) => {
        el.style.setProperty('--reveal-delay', (i * 70) + 'ms');
      });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(el => io.observe(el));
  }

  /* ---------- Count-up ---------- */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function animateNumber(el) {
    const raw = (el.dataset.count || el.textContent || '').toString();
    const target = parseFloat(raw.replace(/[^0-9.\-]/g, ''));
    if (!isFinite(target)) return;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = (raw.split('.')[1] || '').length;
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const v = target * easeOutCubic(t);
      el.textContent = prefix + v.toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  }
  function initCountUp() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(el => {
        const raw = el.dataset.count;
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        el.textContent = prefix + raw + suffix;
      });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateNumber(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(el => {
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      el.textContent = prefix + '0' + suffix;
      io.observe(el);
    });
  }

  /* ---------- SVG / bar viz ---------- */
  function initBarViz() {
    const bars = document.querySelectorAll('.viz .bar-row');
    if (!bars.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      bars.forEach(b => {
        const fill = b.querySelector('i');
        if (fill) fill.style.width = (b.dataset.width || '50') + '%';
      });
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const fill = e.target.querySelector('i');
          if (fill) {
            requestAnimationFrame(() => {
              fill.style.width = (e.target.dataset.width || '50') + '%';
            });
          }
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    bars.forEach(b => io.observe(b));
  }

  function initDonut() {
    const ring = document.querySelector('.donut-ring');
    if (!ring) return;
    const target = parseFloat(ring.dataset.value || '0');
    const circumference = 2 * Math.PI * 70;
    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference);

    function play() {
      const offset = circumference * (1 - target / 100);
      if (reduceMotion) {
        ring.style.transition = 'none';
        ring.style.strokeDashoffset = String(offset);
      } else {
        ring.style.transition = 'stroke-dashoffset 1400ms cubic-bezier(.2,.7,.2,1)';
        requestAnimationFrame(() => {
          ring.style.strokeDashoffset = String(offset);
        });
      }
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { play(); io.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      io.observe(ring);
    } else { play(); }
  }

  /* ---------- Hero cursor halo ---------- */
  function initCursor() {
    if (reduceMotion || isCoarse) return;
    const halo = document.querySelector('.cursor-halo');
    const hero = document.querySelector('.hero');
    if (!halo || !hero) return;
    let raf = null;
    let x = window.innerWidth / 2, y = window.innerHeight / 3;
    function move(e) {
      x = e.clientX; y = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        halo.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        raf = null;
      });
    }
    document.addEventListener('mousemove', move);
    hero.addEventListener('mouseenter', () => halo.classList.add('on'));
    hero.addEventListener('mouseleave', () => halo.classList.remove('on'));
  }

  /* ---------- Analytics table ---------- */
  function loadAnalyticsData() {
    return new Promise(resolve => {
      const embedded = document.getElementById('analytics-data');
      if (embedded) {
        try { resolve(JSON.parse(embedded.textContent)); return; }
        catch (e) { /* fall through */ }
      }
      fetch('../Data/analytics.json')
        .then(r => r.json())
        .then(resolve)
        .catch(() => resolve(null));
    });
  }

  function renderTable(container, data) {
    if (!data || !data.columns || !data.rows) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'table-toolbar';
    toolbar.innerHTML = `
      <label for="dyn-filter">Filter</label>
      <input id="dyn-filter" type="search" placeholder="Search rows…" autocomplete="off">
    `;

    const tableWrap = document.createElement('div');
    tableWrap.style.overflowX = 'auto';

    const table = document.createElement('table');
    table.className = 'analytics-table';

    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    data.columns.forEach((col, idx) => {
      const th = document.createElement('th');
      th.textContent = col.label;
      const ind = document.createElement('span');
      ind.className = 'sort-indicator';
      ind.textContent = '';
      th.appendChild(ind);
      th.dataset.index = String(idx);
      th.dataset.type = col.type || 'string';
      trh.appendChild(th);
    });
    thead.appendChild(trh);

    const tbody = document.createElement('tbody');

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    container.appendChild(toolbar);
    container.appendChild(tableWrap);

    const state = {
      rows: data.rows.slice(),
      sortIdx: -1,
      sortDir: 1,
      filter: ''
    };

    function renderRows() {
      const q = state.filter.trim().toLowerCase();
      let rows = state.rows;
      if (q) {
        rows = rows.filter(r => r.some(cell => String(cell).toLowerCase().includes(q)));
      }
      if (state.sortIdx >= 0) {
        const type = data.columns[state.sortIdx].type || 'string';
        rows = rows.slice().sort((a, b) => {
          const av = a[state.sortIdx];
          const bv = b[state.sortIdx];
          if (type === 'number') {
            return (parseFloat(av) - parseFloat(bv)) * state.sortDir;
          }
          return String(av).localeCompare(String(bv)) * state.sortDir;
        });
      }
      tbody.innerHTML = '';
      rows.forEach(r => {
        const tr = document.createElement('tr');
        r.forEach(cell => {
          const td = document.createElement('td');
          td.innerHTML = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }

    thead.querySelectorAll('th').forEach(th => {
      th.addEventListener('click', () => {
        const idx = parseInt(th.dataset.index, 10);
        if (state.sortIdx === idx) state.sortDir *= -1;
        else { state.sortIdx = idx; state.sortDir = 1; }
        thead.querySelectorAll('.sort-indicator').forEach(s => s.textContent = '');
        th.querySelector('.sort-indicator').textContent = state.sortDir === 1 ? '▲' : '▼';
        renderRows();
      });
    });

    toolbar.querySelector('input').addEventListener('input', e => {
      state.filter = e.target.value;
      renderRows();
    });

    renderRows();
  }

  function initAnalytics() {
    const mount = document.getElementById('dynamic-analytics');
    if (!mount) return;
    loadAnalyticsData().then(data => {
      if (!data) {
        mount.innerHTML = '<p style="color:var(--ink-mute)">Analytics data unavailable.</p>';
        return;
      }
      const tables = Array.isArray(data.tables) ? data.tables : [data];
      tables.forEach(t => {
        if (t.title) {
          const h = document.createElement('h3');
          h.textContent = t.title;
          h.style.marginTop = '36px';
          h.style.fontFamily = 'var(--serif)';
          mount.appendChild(h);
        }
        const wrap = document.createElement('div');
        wrap.className = 'table-container';
        mount.appendChild(wrap);
        renderTable(wrap, t);
      });
    });
  }

  /* ---------- Interactive XLSX spreadsheet ---------- */
  function colLetter(n) {
    let s = '';
    n = n + 1;
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }
  function isNumericCell(v) {
    if (v === null || v === undefined || v === '') return false;
    const s = String(v).trim().replace(/[,$%]/g, '').replace(/^S\$/, '');
    return s !== '' && !isNaN(parseFloat(s)) && isFinite(parseFloat(s));
  }
  function compareCells(a, b) {
    const an = isNumericCell(a);
    const bn = isNumericCell(b);
    if (an && bn) {
      return parseFloat(String(a).replace(/[,$%S]/g, '')) -
             parseFloat(String(b).replace(/[,$%S]/g, ''));
    }
    return String(a == null ? '' : a).localeCompare(String(b == null ? '' : b));
  }

  function renderSheet(host, sheet, state, opts) {
    opts = opts || {};
    const data = sheet.data;
    if (!data || !data.length) {
      host.innerHTML = '<p style="font-family:var(--mono); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-mute); padding:14px 0;">Empty sheet.</p>';
      return;
    }
    const headerRow = data[0].map(h => (h == null ? '' : String(h)));
    let bodyRows = data.slice(1);

    const q = (state.filter || '').trim().toLowerCase();
    if (q) {
      bodyRows = bodyRows.filter(r => r.some(c => String(c == null ? '' : c).toLowerCase().includes(q)));
    }
    if (state.sortIdx >= 0) {
      const idx = state.sortIdx;
      const dir = state.sortDir;
      bodyRows = bodyRows.slice().sort((a, b) => compareCells(a[idx], b[idx]) * dir);
    }

    const numCols = headerRow.length;
    const captionText = (opts.title ? opts.title + ' — ' : '') + sheet.name;
    const lettersTr = ['<tr class="xlsx-letters">', '<th class="xlsx-corner" scope="col"></th>'];
    for (let c = 0; c < numCols; c++) lettersTr.push('<th class="xlsx-col-letter" scope="col">' + colLetter(c) + '</th>');
    lettersTr.push('</tr>');

    const headTr = ['<tr class="xlsx-headers">', '<th class="xlsx-rownum-head" scope="col">#</th>'];
    for (let c = 0; c < numCols; c++) {
      const label = headerRow[c] || colLetter(c);
      const isSorted = state.sortIdx === c;
      const dirLabel = state.sortDir === 1 ? 'ascending' : 'descending';
      const ariaSort = isSorted ? dirLabel : 'none';
      const ind = isSorted ? '<span class="sort-ind" aria-hidden="true">' + (state.sortDir === 1 ? '▲' : '▼') + '</span>' : '';
      headTr.push(
        '<th data-col="' + c + '" scope="col" tabindex="0" role="button" aria-sort="' + ariaSort + '">' +
        escapeHtml(label) + ind + '</th>'
      );
    }
    headTr.push('</tr>');

    const bodyHtml = [];
    bodyRows.forEach((r, ri) => {
      bodyHtml.push('<tr>');
      bodyHtml.push('<td class="xlsx-rownum" scope="row">' + (ri + 1) + '</td>');
      for (let c = 0; c < numCols; c++) {
        const v = r[c];
        const cls = isNumericCell(v) ? ' class="xlsx-num"' : '';
        bodyHtml.push('<td' + cls + '>' + escapeHtml(v == null ? '' : String(v)) + '</td>');
      }
      bodyHtml.push('</tr>');
    });

    const maxH = opts.maxHeight || 600;
    host.innerHTML =
      '<div class="xlsx-scroll" style="max-height:' + maxH + 'px"><table class="xlsx-grid">' +
        '<caption class="xlsx-caption">' + escapeHtml(captionText) + '</caption>' +
        '<thead>' + lettersTr.join('') + headTr.join('') + '</thead>' +
        '<tbody>' + bodyHtml.join('') + '</tbody>' +
      '</table></div>';

    function doSort(c) {
      if (state.sortIdx === c) state.sortDir *= -1;
      else { state.sortIdx = c; state.sortDir = 1; }
      renderSheet(host, sheet, state, opts);
    }
    host.querySelectorAll('thead tr.xlsx-headers th[data-col]').forEach(th => {
      th.addEventListener('click', () => doSort(parseInt(th.dataset.col, 10)));
      th.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          doSort(parseInt(th.dataset.col, 10));
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ============================================================
     Reusable interactive spreadsheet loader

     Drop this markup on any page to mount a live, interactive
     spreadsheet rendered from a real .xlsx / .xls / .csv file:

       <div class="spreadsheet"
            data-spreadsheet
            data-src="../data/your-file.xlsx"
            data-title="Optional Kicker"
            data-max-height="600"
            data-default-sheet="Sheet1"
            data-no-search></div>

     Attribute reference:
       data-src           (required)  Relative path to the workbook file.
       data-title         (optional)  Label shown above the grid.
       data-max-height    (optional)  Scroller height in px (default 600).
       data-default-sheet (optional)  Sheet name to open first.
       data-no-search     (optional)  Presence hides the search box.

     No <script> include is required on the page — SheetJS is
     injected from CDN automatically, only when a [data-spreadsheet]
     element is present. On failure (e.g. opened via file://) the
     container remains empty; details are logged to the console.
     ============================================================ */

  const XLSX_CDN = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
  let xlsxLoaderPromise = null;
  function ensureXlsxLoaded() {
    if (window.XLSX) return Promise.resolve();
    if (xlsxLoaderPromise) return xlsxLoaderPromise;
    xlsxLoaderPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = XLSX_CDN;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('SheetJS failed to load'));
      document.head.appendChild(s);
    });
    return xlsxLoaderPromise;
  }

  function buildWorkbookUI(mount, workbook, opts) {
    opts = opts || {};
    const sheets = workbook.SheetNames.map(name => {
      const ws = workbook.Sheets[name];
      const arr = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
      // trim trailing empty rows
      let last = arr.length;
      while (last > 0 && arr[last - 1].every(v => v === '' || v == null)) last--;
      return { name: name, data: arr.slice(0, last) };
    });

    mount.innerHTML = '';

    const head = document.createElement('div');
    head.className = 'xlsx-head';
    const titleText = opts.title || 'Live Workbook';
    head.innerHTML =
      '<h3>' + escapeHtml(titleText) + '</h3>' +
      '<span class="xlsx-sub">' + sheets.length + ' sheet' + (sheets.length === 1 ? '' : 's') + ' · loaded from workbook</span>';
    mount.appendChild(head);

    const tabs = document.createElement('div');
    tabs.className = 'xlsx-tabs';
    tabs.setAttribute('role', 'tablist');
    let initialActive = 0;
    if (opts.defaultSheet) {
      const idx = sheets.findIndex(s => s.name === opts.defaultSheet);
      if (idx >= 0) initialActive = idx;
    }
    sheets.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = s.name;
      b.dataset.idx = String(i);
      b.setAttribute('role', 'tab');
      if (i === initialActive) b.classList.add('active');
      tabs.appendChild(b);
    });
    mount.appendChild(tabs);

    let toolbar = null;
    if (!opts.noSearch) {
      toolbar = document.createElement('div');
      toolbar.className = 'xlsx-toolbar';
      const inputId = 'xlsx-filter-' + Math.random().toString(36).slice(2, 8);
      toolbar.innerHTML =
        '<label for="' + inputId + '">Filter</label>' +
        '<input id="' + inputId + '" type="search" placeholder="Search any cell…" autocomplete="off">' +
        '<span class="xlsx-count"></span>';
      mount.appendChild(toolbar);
    }

    const host = document.createElement('div');
    mount.appendChild(host);

    const states = sheets.map(() => ({ sortIdx: -1, sortDir: 1, filter: '' }));
    let active = initialActive;

    function refresh() {
      renderSheet(host, sheets[active], states[active], opts);
      if (toolbar) {
        const total = sheets[active].data.length ? (sheets[active].data.length - 1) : 0;
        toolbar.querySelector('.xlsx-count').textContent = total + ' rows';
        const inp = toolbar.querySelector('input');
        inp.value = states[active].filter || '';
      }
      tabs.querySelectorAll('button').forEach((b, i) => {
        b.classList.toggle('active', i === active);
      });
    }

    tabs.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        active = parseInt(b.dataset.idx, 10);
        refresh();
      });
    });

    if (toolbar) {
      toolbar.querySelector('input').addEventListener('input', e => {
        states[active].filter = e.target.value;
        refresh();
      });
    }

    refresh();
  }

  function mountSpreadsheet(mount) {
    const src = mount.dataset.src;
    if (!src) {
      console.warn('[spreadsheet] missing data-src on', mount);
      return;
    }
    const opts = {
      title:        mount.dataset.title || '',
      maxHeight:    parseInt(mount.dataset.maxHeight || '600', 10) || 600,
      defaultSheet: mount.dataset.defaultSheet || '',
      noSearch:     mount.hasAttribute('data-no-search')
    };
    mount.classList.add('spreadsheet');
    mount.classList.add('xlsx-wrap');
    mount.setAttribute('aria-label', opts.title || 'Interactive spreadsheet');

    fetch(src)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.arrayBuffer();
      })
      .then(buf => {
        try {
          const wb = window.XLSX.read(buf, { type: 'array' });
          buildWorkbookUI(mount, wb, opts);
        } catch (err) {
          console.warn('[spreadsheet] parse failed for', src, err);
        }
      })
      .catch(err => {
        console.warn('[spreadsheet] load failed for', src, err);
      });
  }

  function initSpreadsheets() {
    const els = document.querySelectorAll('[data-spreadsheet]');
    if (!els.length) return;
    ensureXlsxLoaded()
      .then(() => els.forEach(mountSpreadsheet))
      .catch(err => console.warn('[spreadsheet]', err));
  }

  /* ---------- Image lightbox ---------- */
  function initImageLightbox() {
    const triggers = document.querySelectorAll('img.lightbox-image');
    if (!triggers.length) return;

    const lightbox = document.createElement('div');
    const descriptionId = 'image-lightbox-description';
    lightbox.className = 'image-lightbox';
    lightbox.hidden = true;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-describedby', descriptionId);
    lightbox.innerHTML = `
      <div class="image-lightbox__panel" role="document">
        <button class="image-lightbox__close" type="button" aria-label="Close image preview">&times;</button>
        <figure class="image-lightbox__figure">
          <img class="image-lightbox__image" alt="">
        </figure>
        <div class="image-lightbox__text">
          <span class="image-lightbox__label">Image preview</span>
          <p class="image-lightbox__description" id="${descriptionId}"></p>
        </div>
      </div>
    `;
    document.body.appendChild(lightbox);

    const fullImage = lightbox.querySelector('.image-lightbox__image');
    const description = lightbox.querySelector('.image-lightbox__description');
    const closeButton = lightbox.querySelector('.image-lightbox__close');
    let activeTrigger = null;

    function openLightbox(img) {
      const src = img.currentSrc || img.getAttribute('src') || '';
      if (!src) return;
      const text = img.dataset.lightboxDescription || img.getAttribute('alt') || '';
      activeTrigger = img;
      fullImage.src = src;
      fullImage.alt = img.getAttribute('alt') || text || 'Enlarged portfolio image';
      description.textContent = text;
      lightbox.hidden = false;
      document.body.classList.add('lightbox-open');
      closeButton.focus();
    }

    function closeLightbox() {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      document.body.classList.remove('lightbox-open');
      fullImage.removeAttribute('src');
      if (activeTrigger) activeTrigger.focus();
      activeTrigger = null;
    }

    triggers.forEach(img => {
      if (!img.hasAttribute('tabindex')) img.setAttribute('tabindex', '0');
      if (!img.hasAttribute('role')) img.setAttribute('role', 'button');
      if (!img.hasAttribute('aria-label')) {
        const label = img.getAttribute('alt') || 'portfolio image';
        img.setAttribute('aria-label', 'Open image preview: ' + label);
      }
      img.addEventListener('click', () => openLightbox(img));
      img.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(img);
        }
      });
    });

    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ---------- Init ---------- */
  initTheme();
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initReveal();
    initCountUp();
    initBarViz();
    initDonut();
    initCursor();
    initAnalytics();
    initSpreadsheets();
    initImageLightbox();
  });
})();
