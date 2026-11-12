/* Kaydırınca header'ı küçültür: body'ye .scrolled ve (ana sayfada) .past-hero ekler. */
(function () {
  var b = document.body, hero = document.querySelector('.hero'), ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY;
    b.classList.toggle('scrolled', y > 8);
    if (hero) b.classList.toggle('past-hero', y > hero.offsetTop + hero.offsetHeight * 0.55);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
