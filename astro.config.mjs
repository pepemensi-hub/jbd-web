import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://jbdrespuestos.com',
  integrations: [sitemap()],
  // inlineStylesheets: el CSS va dentro del HTML, así no bloquea el primer dibujado (PageSpeed)
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
});