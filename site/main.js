/* No scroll listeners: native scrolling, one reveal observer, CSS parallax. */
(() => {
  const root = document.documentElement;
  const intro = document.querySelector('#intro');
  const invitation = document.querySelector('#invitation');
  const openButton = document.querySelector('#open-invitation');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const target = Date.parse('2027-01-15T19:00:00-04:00');
  const units = ['days', 'hours', 'minutes', 'seconds'];
  const digits = units.map(unit => document.querySelector(`[data-unit="${unit}"]`));
  const summary = document.querySelector('#countdown-summary');
  let lastMinute = null;
  let timer;
  let opening = false;
  let observer;

  // Prepare hidden reveal states, but keep the observer idle behind the intro.
  if (root.classList.contains('js') && 'IntersectionObserver' in window && !reducedMotion.matches) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -18px 0px' });
    root.classList.add('motion-ready');
  }

  function tick() {
    const remaining = Math.max(0, target - Date.now());
    const seconds = Math.floor(remaining / 1000);
    const values = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24,
      Math.floor(seconds / 60) % 60, seconds % 60];
    digits.forEach((digit, index) => {
      const next = String(values[index]).padStart(2, '0');
      if (digit.textContent === next) return;
      digit.textContent = next;
      digit.classList.remove('changed');
      // Two frames restart a transform/opacity animation without forcing layout.
      requestAnimationFrame(() => requestAnimationFrame(() => digit.classList.add('changed')));
    });
    const minute = Math.floor(Date.now() / 60000);
    if (lastMinute !== minute) {
      summary.textContent = remaining > 0
        ? `Faltan ${values[0]} días, ${values[1]} horas y ${values[2]} minutos para la boda.`
        : '¡Hoy celebramos!';
      lastMinute = minute;
    }
    document.querySelector('#countdown').hidden = remaining === 0;
    document.querySelector('#today').hidden = remaining > 0;
    if (!remaining && timer) clearInterval(timer);
  }

  function startTicker() {
    clearInterval(timer);
    tick();
    if (Date.now() < target) timer = setInterval(tick, 1000);
  }

  function beginEntrance() {
    if (root.classList.contains('opened')) return;
    root.classList.add('opened');
    if (observer) setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(item => observer.observe(item));
    }, 700);
  }

  function finishOpening() {
    if (root.classList.contains('js')) beginEntrance();
    root.classList.remove('intro-active');
    invitation.inert = false;
    intro.remove();
    invitation.setAttribute('tabindex', '-1');
    invitation.focus({ preventScroll: true });
  }

  openButton.addEventListener('click', () => {
    if (opening) return;
    opening = true;
    intro.classList.add('is-opening');
    openButton.disabled = true;
    if (reducedMotion.matches) beginEntrance();
    else setTimeout(beginEntrance, 750);
    setTimeout(finishOpening, reducedMotion.matches ? 220 : 1220);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(timer);
    else startTicker();
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) root.classList.remove('motion-ready');
  });
  startTicker();
  // Mark ready only after every essential handler has been attached.
  if (root.classList.contains('js')) {
    invitation.inert = true;
    root.classList.add('app-ready', 'intro-active');
  } else {
    finishOpening();
  }
})();
