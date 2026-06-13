/* EAE Portfolio — interactions
   Written for cross-browser reliability, with explicit handling for
   iOS Safari / WebKit quirks (see inline notes). */

(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {

    var reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO = 'IntersectionObserver' in window;

    /* ---------- nav scroll shadow ---------- */
    var nav = document.querySelector('.nav');
    if (nav) {
      var onScroll = function () {
        nav.classList.toggle('scrolled', window.pageYOffset > 8);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---------- mobile menu ---------- */
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      var navAnchors = links.querySelectorAll('a');
      for (var i = 0; i < navAnchors.length; i++) {
        navAnchors[i].addEventListener('click', function () {
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      }
      var lastY = window.pageYOffset;
      window.addEventListener('scroll', function () {
        var y = window.pageYOffset;
        if (Math.abs(y - lastY) > 60 && links.classList.contains('open')) {
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
        lastY = y;
      }, { passive: true });
    }

    /* ---------- scroll reveal ----------
       iOS note: IntersectionObserver callbacks are throttled during
       momentum scroll, and very tall elements may never cross a high
       threshold. We use threshold 0 + a positive-then-negative
       rootMargin so an element reveals as soon as any part enters the
       lower 90% of the viewport. A safety timer guarantees nothing is
       ever left stuck at opacity:0. */
    var revealEls = document.querySelectorAll('.reveal');

    function revealAll() {
      for (var i = 0; i < revealEls.length; i++) revealEls[i].classList.add('in');
    }

    if (reduced || !hasIO) {
      revealAll();
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

      for (var i = 0; i < revealEls.length; i++) io.observe(revealEls[i]);

      /* SAFETY NET: if for any reason (WebKit edge case, observer never
         firing) elements are still hidden after 3s, reveal them so the
         page is never left with invisible content. */
      setTimeout(function () {
        for (var j = 0; j < revealEls.length; j++) {
          var el = revealEls[j];
          if (!el.classList.contains('in')) {
            var r = el.getBoundingClientRect();
            if (r.top < window.innerHeight * 1.5) el.classList.add('in');
          }
        }
      }, 3000);
    }

    /* ---------- count-up numbers ----------
       iOS note: the previous threshold:0.5 meant tall containers (hero
       card, stat band) could never reach 50% visibility on a phone, so
       the numbers never animated. We trigger as soon as the element is
       even slightly visible, and always settle on the exact value. */
    var counters = document.querySelectorAll('.count');

    function finalText(el) {
      var d = parseInt(el.getAttribute('data-decimals') || '0', 10);
      return (el.getAttribute('data-prefix') || '') +
        parseFloat(el.getAttribute('data-target') || '0').toFixed(d) +
        (el.getAttribute('data-suffix') || '');
    }

    function animate(el) {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      var target = parseFloat(el.getAttribute('data-target') || '0');
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      var dur = 1400;
      var start = null;
      function step(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = finalText(el); // guarantee exact final value
      }
      requestAnimationFrame(step);
    }

    if (reduced || !hasIO || !('requestAnimationFrame' in window)) {
      for (var k = 0; k < counters.length; k++) counters[k].textContent = finalText(counters[k]);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            animate(e.target);
            cio.unobserve(e.target);
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });

      for (var k = 0; k < counters.length; k++) cio.observe(counters[k]);

      /* safety net for counters too */
      setTimeout(function () {
        for (var m = 0; m < counters.length; m++) {
          if (!counters[m].dataset.done) {
            var r = counters[m].getBoundingClientRect();
            if (r.top < window.innerHeight * 1.5) animate(counters[m]);
          }
        }
      }, 3000);
    }

    /* ---------- image lightbox ---------- */
    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-label', 'Image preview');
    var lightboxImg = document.createElement('img');
    lightbox.appendChild(lightboxImg);
    document.body.appendChild(lightbox);

    var zoomable = document.querySelectorAll('[data-zoom]');
    for (var z = 0; z < zoomable.length; z++) {
      zoomable[z].addEventListener('click', function () {
        lightboxImg.src = this.src;
        lightboxImg.alt = this.alt || '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    }

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) closeLightbox();
    });

    /* swipe-down to close (touch). passive listeners so iOS scroll
       performance is unaffected. */
    var tY = 0, tX = 0;
    lightbox.addEventListener('touchstart', function (e) {
      tY = e.touches[0].clientY;
      tX = e.touches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      var dy = e.changedTouches[0].clientY - tY;
      var dx = Math.abs(e.changedTouches[0].clientX - tX);
      if (dy > 80 && dy > dx * 1.5) closeLightbox();
    }, { passive: true });

    /* ---------- horizontal-scroll affordance on tables ---------- */
    var scrollers = document.querySelectorAll('.table-scroll');
    for (var s = 0; s < scrollers.length; s++) {
      (function (el) {
        var update = function () {
          var atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
          el.classList.toggle('scrolled-end', atEnd);
        };
        el.addEventListener('scroll', update, { passive: true });
        requestAnimationFrame(update);
        window.addEventListener('resize', update, { passive: true });
      })(scrollers[s]);
    }
  });
})();
