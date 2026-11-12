import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('yazilar', (p) => !p.data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
  return rss({
    title: 'Erdur Group · Yazılar',
    description: 'Tarım, sulama ve tarım makineleri üzerine sahadan öğrendiklerimiz.',
    site: context.site,
    customData: '<language>tr-tr</language>',
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: `/yazilar/${p.id}`,
    })),
  });
}
