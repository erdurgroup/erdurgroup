import site from './data/site.json';

export const S = site;

export const safeUrl = (u?: string) => (u && /^https:\/\//i.test(u.trim()) ? u.trim() : '');

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const readingMinutes = (body = '') => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 190));

export const socials = () =>
  (
    [
      ['instagram', S.social.instagram],
      ['facebook', S.social.facebook],
      ['youtube', S.social.youtube],
      ['tiktok', S.social.tiktok],
    ] as const
  )
    .map(([name, url]) => ({ name, url: safeUrl(url) }))
    .filter((s) => s.url);

export const waLink = () => {
  const n = (S.contact.whatsapp || '').replace(/\D/g, '');
  return n ? `https://wa.me/${n}` : '';
};
export const telLink = () => {
  const n = (S.contact.phone || '').replace(/[^\d+]/g, '');
  return n ? `tel:${n}` : '';
};
