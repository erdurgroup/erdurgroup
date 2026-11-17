/* Ana sayfa logosu: kaydırınca küçülüp kaybolur (fare takibi yok). */
(function () {
  var hero = document.querySelector('.hero');
  if (!hero || document.body.classList.contains('no-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var root = document.documentElement;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var sp = 0, csp = 0;                      // kaydırma ilerlemesi 0..1
  var vel = 0, cvel = 0;                    // kaydırma hızı
  var lastY = window.scrollY, raf = 0;

  function set(name, v) { root.style.setProperty(name, v.toFixed(4)); }

  function tick() {
    csp += (sp - csp) * 0.14;
    vel *= 0.9;
    cvel += (vel - cvel) * 0.15;
    set('--sp', csp); set('--sv', cvel);
    var moving = Math.abs(sp - csp) > 0.001 || Math.abs(vel) > 0.002 || Math.abs(cvel) > 0.002;
    raf = moving ? requestAnimationFrame(tick) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }

  function onScroll() {
    var y = window.scrollY;
    vel = clamp(vel + (y - lastY) / 50, -1, 1);
    lastY = y;
    sp = clamp(y / (hero.offsetHeight * 0.85), 0, 1);
    kick();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
})();
