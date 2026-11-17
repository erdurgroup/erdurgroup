/* İletişim haritası: "haritayı göster"e basılınca Google Haritası yüklenir. */
(function () {
  var box = document.querySelector('.map-consent');
  if (!box) return;
  box.querySelector('.map-show').addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = box.getAttribute('data-src');
    f.title = box.getAttribute('data-title') || 'Google Haritalar';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.allowFullscreen = true;
    box.replaceWith(f);
  });
})();
