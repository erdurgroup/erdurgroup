# Erdur Group web sitesi

Astro (statik site) + Cloudflare (hosting, DNS, SSL) + Decap CMS (yönetim paneli: `/admin`).

## Yazı eklemek
`erdurgroup.com/admin` → GitHub ile giriş → **Yazılar → Yeni Yazı** → Yayınla.
Site 1-2 dakika içinde güncellenir. Ana sayfa metinleri, markalar, iletişim ve sosyal medya bağlantıları **Site Ayarları** içinden değiştirilir.

## Yerelde çalıştırmak (opsiyonel)
```
npm install
npm run dev
```

## Güvenlik notları
- Sitede veritabanı, giriş sayfası ya da eklenti yok; yayınlanan her şey statik dosyadır.
- `/admin` girişi Cloudflare Worker (`src/worker.js`) üzerinden GitHub OAuth ile yapılır ve sadece `ALLOWED_USERS` listesindeki GitHub hesapları girebilir.
- Güvenlik başlıkları ve CSP `public/_headers` dosyasındadır.
- Gizli anahtarlar (`GITHUB_CLIENT_SECRET` vb.) asla bu depoya yazılmaz, Cloudflare panelinde tutulur.
