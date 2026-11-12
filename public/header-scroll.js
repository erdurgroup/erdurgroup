/* Kaydırınca header'ı küçültür: body'ye .scrolled ve (ana sayfada) .past-hero ekler. */
(function () {
  var b = document.body, hero = document.querySelector('.hero'), ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY;
    var compact = y > 8;
    if (hero) {
      var at = hero.offsetTop + hero.offsetHeight * 0.55;
      var maxY = document.documentElement.scrollHeight - window.innerHeight;
      // Sayfa kısaysa (az yazı) büyük logo hiç kaybolamaz: header'ı da hiç küçültme, sade kalsın.
      if (maxY < at) compact = false;
      b.classList.toggle('past-hero', compact && y > at);
    }
    b.classList.toggle('scrolled', compact);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
