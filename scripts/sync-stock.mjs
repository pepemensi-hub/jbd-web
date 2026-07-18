// Sincroniza el catálogo desde Google Sheets (publicado como CSV) a stock.json
// Uso: node scripts/sync-stock.mjs
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVHx81KqfGCu2nTTyMb87l4Wyuuc6ouax2SUuUIe9Tas5TvYhaH8KXzESAEMWnakg8Z4Gm7hWUJ8-0/pub?gid=2051779070&single=true&output=csv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(__dirname, '..', 'src', 'data', 'stock.json');

const CATEGORIAS_VALIDAS = ['filtros', 'correas', 'frenos', 'encendido', 'suspension', 'refrigeracion', 'electricidad'];
const ESTADOS_VALIDOS = ['disponible', 'pedido', 'agotado'];

console.log('Descargando planilla...');
const res = await fetch(CSV_URL);
if (!res.ok) {
  console.error(`Error al descargar: HTTP ${res.status}`);
  process.exit(1);
}
const csv = await res.text();

const { data, errors } = Papa.parse(csv, { header: true, skipEmptyLines: true });
if (errors.length) {
  console.warn('Avisos del parser:', errors.slice(0, 3));
}

const productos = [];
const problemas = [];

data.forEach((fila, i) => {
  const nroFila = i + 2; // +2: fila 1 son encabezados
  const sku = (fila.sku || '').trim();
  const nombre = (fila.nombre || '').trim();
  const marca = (fila.marca || '').trim();
  const categoria = (fila.categoria || '').trim().toLowerCase();
  const estado = (fila.estado || '').trim().toLowerCase();
  const modelos = (fila.modelos || '').split(',').map(m => m.trim()).filter(Boolean);
  const precioRaw = (fila.precio || '').toString().replace(/[^\d]/g, '');
  const precio = precioRaw ? parseInt(precioRaw, 10) : null;

  // Validaciones: si algo está mal, se salta la fila y se avisa
  if (!sku || !nombre || !marca) {
    problemas.push(`Fila ${nroFila}: falta sku, nombre o marca — se omite`);
    return;
  }
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    problemas.push(`Fila ${nroFila} (${sku}): categoría inválida "${fila.categoria}" — se omite`);
    return;
  }
  if (!ESTADOS_VALIDOS.includes(estado)) {
    problemas.push(`Fila ${nroFila} (${sku}): estado inválido "${fila.estado}" — se omite`);
    return;
  }

  productos.push({
    sku, nombre, marca, modelos, categoria,
    precio: estado === 'agotado' ? precio : precio,
    estado, imagen: null,
  });
});

const salida = {
  _nota: 'Generado por sync-stock.mjs desde Google Sheets. NO editar a mano.',
  actualizado: new Date().toISOString().slice(0, 10),
  productos,
};

writeFileSync(SALIDA, JSON.stringify(salida, null, 2), 'utf8');

console.log(`\n✓ ${productos.length} productos escritos en src/data/stock.json`);
if (problemas.length) {
  console.log(`\n⚠ ${problemas.length} fila(s) con problemas:`);
  problemas.forEach(p => console.log('  - ' + p));
} else {
  console.log('Sin errores. Toda la planilla se importó bien.');
}