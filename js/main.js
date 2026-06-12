/* EAE Portfolio — interactions */

document.addEventListener('DOMContentLoaded', () => {

  /* --- nav scroll shadow --- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --- mobile menu --- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    // close menu on link tap
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
    // close menu on scroll (mobile UX: user moved on)
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      if (Math.abs(window.scrollY - lastY) > 60 && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
      lastY = window.scrollY;
    }, { passive: true });
  }

  /* --- scroll reveal --- */
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* --- count-up numbers --- */
  const counters = document.querySelectorAll('.count');
  const animate = el => {
    const target = parseFloat(el.dataset.target || '0');
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();
    const step = now => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!reduced && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animate(e.target);
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  } else {
    counters.forEach(el => {
      const d = parseInt(el.dataset.decimals || '0', 10);
      el.textContent = (el.dataset.prefix || '') +
        parseFloat(el.dataset.target || '0').toFixed(d) +
        (el.dataset.suffix || '');
    });
  }

  /* --- image lightbox with swipe-to-close --- */
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-label', 'Image preview');
  const lightboxImg = document.createElement('img');
  lightbox.appendChild(lightboxImg);
  document.body.appendChild(lightbox);

  document.querySelectorAll('[data-zoom]').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };
  lightbox.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  // swipe down to close on touch devices
  let touchStartY = 0;
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dx = Math.abs(e.changedTouches[0].clientX - touchStartX);
    // swipe down >80px and mostly vertical → close
    if (dy > 80 && dy > dx * 1.5) {
      closeLightbox();
    }
  }, { passive: true });

  /* --- scroll affordance: hide gradient when scrolled to end --- */
  document.querySelectorAll('.table-scroll').forEach(el => {
    const update = () => {
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      el.classList.toggle('scrolled-end', atEnd);
    };
    el.addEventListener('scroll', update, { passive: true });
    // initial check after layout
    requestAnimationFrame(update);
    window.addEventListener('resize', update, { passive: true });
  });
});
