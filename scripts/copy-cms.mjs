// Decap CMS dosyalarını npm paketinden public/admin içine kopyalar (üçüncü taraf CDN kullanılmaz).
import { cpSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const src = 'node_modules/decap-cms/dist';
const dst = 'public/admin/cms';
rmSync(dst, { recursive: true, force: true });
mkdirSync(dst, { recursive: true });
let n = 0;
for (const f of readdirSync(src)) {
  if (f.endsWith('.map') || f.endsWith('.cms.js')) continue;
  cpSync(join(src, f), join(dst, f));
  n++;
}
console.log(`Decap CMS: ${n} dosya kopyalandı.`);
