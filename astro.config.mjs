import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://jbdrespuestos.com',
  integrations: [
    sitemap({
      // Fuera del sitemap: las páginas 2, 3, 4… de cada listado (/repuestos/<cat>/<marca>/<n>/), con textos
      // casi iguales a la página 1. Siguen indexables y con su canonical propio; solo no se le "ofrecen" a Google.
      // También la 404.
      filter: (page) => !/\/repuestos\/[^/]+\/[^/]+\/\d+\/$/.test(page) && !/\/404\/?$/.test(page),
    }),
  ],
  // inlineStylesheets: el CSS va dentro del HTML, así no bloquea el primer dibujado (PageSpeed)
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
});