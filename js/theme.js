/* EAE Portfolio — theme system
   - Default: follow the device theme (prefers-color-scheme)
   - User can override to light or dark; choice is remembered
   - Cycles: Auto → Light → Dark → Auto
   The early <head> snippet (in each HTML file) sets the initial
   class before paint to avoid a flash. This file wires up the toggle. */

(function () {
  const root = document.documentElement;
  const KEY = 'eae-theme'; // 'auto' | 'light' | 'dark'

  function systemPrefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function getStored() {
    try { return localStorage.getItem(KEY) || 'auto'; }
    catch (e) { return 'auto'; }
  }

  function store(val) {
    try { localStorage.setItem(KEY, val); } catch (e) {}
  }

  /* Apply a theme choice to <html>:
     - 'auto'  → add .theme-auto, remove data-theme (CSS media query decides)
     - 'light' → data-theme="light"
     - 'dark'  → data-theme="dark" */
  function apply(theme) {
    root.classList.remove('theme-auto');
    root.removeAttribute('data-theme');
    if (theme === 'auto') {
      root.classList.add('theme-auto');
    } else {
      root.setAttribute('data-theme', theme);
    }
    updateLabel(theme);
  }

  function effectiveTheme(theme) {
    if (theme === 'auto') return systemPrefersDark() ? 'dark' : 'light';
    return theme;
  }

  function updateLabel(theme) {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const eff = effectiveTheme(theme);
    const labels = {
      auto: 'Theme: Auto (following device)',
      light: 'Theme: Light',
      dark: 'Theme: Dark'
    };
    btn.setAttribute('aria-label', labels[theme]);
    btn.setAttribute('title', labels[theme]);
    btn.dataset.theme = theme;
    btn.dataset.effective = eff;
  }

  document.addEventListener('DOMContentLoaded', () => {
    let current = getStored();
    apply(current);

    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        // cycle Auto → Light → Dark → Auto
        current = current === 'auto' ? 'light'
                : current === 'light' ? 'dark'
                : 'auto';
        store(current);
        apply(current);
      });
    }

    // if user is on Auto, react live to device theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (getStored() === 'auto') updateLabel('auto'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  });
})();
