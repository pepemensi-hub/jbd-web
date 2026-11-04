// Arma src/data/stock.json cruzando la exportación del sistema (articulos_v3.txt)
// con las fotos de la carpeta pública de Drive. Solo entran los artículos con foto.
//
// Uso:
//   node scripts/sync-articulos.mjs <carpeta-o-zip-extraído-con-articulos_v3.txt> [listado-imagenes.csv]
//
// - Sin CSV, lista la carpeta de Drive por la vista pública (embeddedfolderview).
//   OJO: esa vista corta en 5.500 archivos por subcarpeta, así que el listado es parcial.
// - Con CSV (columnas: id,nombre,carpeta), usa ese listado completo en lugar de Drive.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const DRIVE_RAIZ = '1KJrfPOhnAPzhKKJybLMA3R2T7oV7cPvZ';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(__dirname, '..', 'src', 'data', 'stock.json');

const [dirArticulos, csvImagenes] = process.argv.slice(2);
if (!dirArticulos) {
  console.error('Uso: node scripts/sync-articulos.mjs <carpeta con articulos_v3.txt> [listado-imagenes.csv]');
  process.exit(1);
}

// ---------- Rubro del sistema → categoría del sitio ----------
// Mantener sincronizado con el array `categorias` de src/components/CatalogoGrid.astro
const RUBROS = {
  filtros: [4, 5, 6, 8, 209, 210],
  correas: [3, 15, 16, 17, 111, 116],
  frenos: [49, 54, 78, 207, 215, 221, 222],
  encendido: [200, 201, 202, 212, 230],
  suspension: [52, 79, 398, 400, 401, 402, 405, 406, 408, 410, 417, 420, 422, 560, 562, 565],
  refrigeracion: [63, 65, 71, 87, 102, 346, 352, 556, 563],
  electricidad: [11, 13, 57, 72, 83, 198, 204, 206, 217, 218, 309, 310, 311, 312, 313, 314, 319, 327, 338, 345, 349, 350],
  inyeccion: [205, 216, 219],
  transmision: [59, 70, 74, 75, 76, 105, 114, 115, 197, 203, 211, 399, 561],
  direccion: [56, 343, 356, 403, 407, 409, 411, 413, 415, 418, 564],
  escape: [], // rubros 55 y 73 son mixtos: se reparten por palabra clave en categoriaMixta()
  'aire-acondicionado': [60, 82, 342],
  'tren-delantero': [51, 77, 404, 412, 414, 416, 419, 421],
  motor: [9, 18, 19, 20, 58, 88, 351, 494],
  carroceria: [62, 64, 81, 84, 85, 301, 302, 303, 304, 305, 306, 307, 308, 315, 316, 317, 318, 320, 321, 322, 323, 324, 325, 326, 328, 329, 330, 331, 332, 333, 334, 335, 337, 339, 340, 341, 344, 347, 348, 353, 354, 355, 423, 225, 551, 553, 554, 555, 557, 558, 559],
};
const RUBROS_EXCLUIDOS = new Set([14, 997, 998]); // flete, fábrica materia prima y moldes
const rubroACategoria = new Map();
for (const [cat, codigos] of Object.entries(RUBROS)) for (const c of codigos) rubroACategoria.set(c, cat);

// Los rubros del sistema vienen sucios (p. ej. muchas pastillas de freno están en MOTOR o RUBRO GENERAL),
// así que primero se clasifica por el nombre y el rubro queda como respaldo. El orden importa.
const PALABRAS_CLAVE = [
  ['motor', /^PASTILLA (DE )?REG/], // pastillas de regulación de válvulas, no de freno
  ['frenos', /^((JGO\.? ?|JUEGO )?PASTILLAS?( DE)? FRENO|JGO\.? ?PASTILLAS|DISCO(S)? (DE )?FRENO|CAMPANA|ZAPATA|CILINDRO (DE )?RUEDA|BOMBA (DE )?FRENO|CALIPER|MORDAZA|CABLE (DE )?FRENO|FLEXIBLE (DE )?FRENO|SERVO ?FRENO|LIQUIDO (DE )?FRENO)/],
  ['filtros', /^FILTRO/],
  ['correas', /^(CORREA|KIT (DE )?DISTRIB|TENSOR|POLEA (TENSORA|LOCA)|RODILLO TENSOR)/],
  ['encendido', /^(BUJIA|BOBINA|CABLE(S)? (DE )?BUJIA|JGO\.? ?CABLES? (DE )?BUJIA|DISTRIBUIDOR|MODULO (DE )?ENCENDIDO)/],
  ['aire-acondicionado', /^(COMPRESOR|CONDENSADOR|EVAPORADOR|FILTRO DESHIDRAT|VALVULA EXPANSION)|AIRE ACOND/],
  ['refrigeracion', /^(RADIADOR|TERMOSTATO|BOMBA (DE )?AGUA|ELECTROVENTILADOR|BULBO|DEPOSITO (DE )?AGUA|TAPA (DE )?RADIADOR|MANGUERA (DE )?RADIADOR)/],
  ['transmision', /^(EMBRAGUE|KIT (DE )?EMBRAGUE|DISCO (DE )?EMBRAGUE|PLACA (DE )?EMBRAGUE|CRAPODINA|RULEMAN (DE )?EMBRAGUE|HOMOCINETICA|JUNTA HOMOCINETICA|SEMIEJE|CABLE (DE )?EMBRAGUE|CRUCETA|DIFERENCIAL)/],
  ['direccion', /^(EXTREMO|PRECAP|CAJA (DE )?DIRECCION|BOMBA (DE )?DIRECCION|FUELLE (DE )?DIRECCION|BRAZO AXIAL|MANCHON)/],
  ['suspension', /^(AMORTIG|ESPIRAL|RESORTE|CAZOLETA|BIELETA|BARRA ESTAB|TOPE (DE )?AMORTIG|KIT (DE )?AMORTIG|ELASTICO)/],
  ['tren-delantero', /^(BUJE|JGO\.? ?BUJES|KIT (DE )?BUJES|PARRILLA|BANDEJA|ROTULA|MAZA|RULEMAN (DE )?RUEDA|KIT RULEMAN|PUNTA (DE )?EJE)/],
  ['inyeccion', /^(INYECTOR|BOMBA (DE )?NAFTA|BOMBA (DE )?COMBUSTIBLE|CUERPO (DE )?MARIPOSA|REGULADOR (DE )?PRESION|MOTOR PASO|VALVULA IAC|SENSOR (MAP|TPS|MARIPOSA))/],
  ['escape', /^(SILENCIADOR|CA[ÑN]O (DE )?ESCAPE|CATALIZADOR|SONDA LAMBDA|FLEXIBLE (DE )?ESCAPE)/],
  ['electricidad', /^(LAMPARA|BATERIA|ALTERNADOR|MOTOR (DE )?ARRANQUE|ARRANQUE|SENSOR|RELAY|RELE|FUSIBLE|LLAVE (DE )?(LUCES|ENCENDIDO)|INTERRUPTOR|BOCINA|REGULADOR (DE )?VOLTAJE|ESCOBILLA|FICHA)/],
];
function categoriaPorNombre(nombre) {
  for (const [cat, re] of PALABRAS_CLAVE) if (re.test(nombre)) return cat;
  return null;
}

// Rubros 55 (REFRIG/COMB/ESCAPE) y 73 (ADM/ESCAPE/ALIMENT.) mezclan de todo: se clasifican por el nombre.
const RUBROS_MIXTOS = new Set([55, 73]);
function categoriaMixta(nombre) {
  if (/TERMOST|RADIADOR|BULBO|MANGUERA|BOMBA (DE )?AGUA|DEPOSITO|DEP\.|VENTILADOR|REFRIG|ANTICONG|ENFRIADOR/.test(nombre)) return 'refrigeracion';
  if (/^(SILENCIADOR|CA[ÑN]O (DE )?(ESCAPE|DESCARGA)|CATALIZADOR|FLEXIBLE|MULTIPLE (DE )?ESC|SONDA LAMBDA|JUNTA (DE )?ESCAPE|SOPORTE (DE )?ESCAPE)/.test(nombre)) return 'escape';
  if (/INYEC|COMBUST|NAFTA|GAS[OÓ]IL|MARIPOSA|RAIL|CARBURADOR|TANQUE/.test(nombre)) return 'inyeccion';
  return 'motor';
}

// ---------- Utilidades ----------
const leerLatin1 = p => new TextDecoder('latin1').decode(readFileSync(p));
const clave = s => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const limpiar = s => (s || '').replace(/\s+/g, ' ').trim();
const titulo = s => s.charAt(0) + s.slice(1).toLowerCase();
const decodificarHtml = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function leerTabla(nombre) {
  return leerLatin1(join(dirArticulos, nombre)).split(/\r?\n/).slice(1).filter(Boolean).map(l => l.split('|'));
}

// ---------- Imágenes ----------
async function listarDrive(id, carpeta, salida) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`);
  if (!res.ok) throw new Error(`Drive respondió HTTP ${res.status} para la carpeta ${carpeta || '/'}`);
  const html = await res.text();
  const re = /<div class="flip-entry" id="entry-([^"]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?flip-entry-title">([^<]*)</g;
  const subcarpetas = [];
  let m, n = 0;
  while ((m = re.exec(html))) {
    n++;
    const [, eid, href, nombre] = m;
    if (href.includes('/folders/')) subcarpetas.push([eid, decodificarHtml(nombre)]);
    else salida.push({ id: eid, nombre: decodificarHtml(nombre), carpeta });
  }
  if (carpeta) console.log(`  ${carpeta}: ${n} archivos${n >= 5500 ? ' (listado cortado por Drive)' : ''}`);
  for (const [sid, snombre] of subcarpetas) await listarDrive(sid, snombre, salida);
  return salida;
}

function leerCsvImagenes(p) {
  return readFileSync(p, 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map(l => {
    const [id, nombre, carpeta] = l.split(',').map(c => c.replace(/^"|"$/g, '').trim());
    return { id, nombre, carpeta };
  });
}

console.log(csvImagenes ? `Leyendo listado de imágenes ${csvImagenes}...` : 'Listando la carpeta de Drive...');
const imagenes = csvImagenes ? leerCsvImagenes(csvImagenes) : await listarDrive(DRIVE_RAIZ, '', []);
const fotoPorCodigo = new Map();
for (const img of imagenes) {
  if (!/\.(jpe?g|png|webp|gif)$/i.test(img.nombre)) continue;
  const k = clave(img.nombre.replace(/\.[a-z0-9]+$/i, ''));
  if (k && !fotoPorCodigo.has(k)) fotoPorCodigo.set(k, img);
}
console.log(`${imagenes.length} imágenes, ${fotoPorCodigo.size} códigos distintos`);

// ---------- Artículos ----------
const fabricantes = new Map(leerTabla('marcas_principales_v3.txt').map(([c, n]) => [c, limpiar(n)]));
const articulos = leerTabla('articulos_v3.txt');

const productos = [];
const vistos = new Set();
const sinCategoria = new Map();
let sinFoto = 0;

for (const col of articulos) {
  if (col.length < 31) continue; // filas cortadas por saltos de línea dentro de la descripción
  const sku = limpiar(col[0]);
  const k = clave(sku);
  if (!k || vistos.has(k)) continue;
  const foto = fotoPorCodigo.get(k);
  if (!foto) { sinFoto++; continue; }

  const rubro = parseInt(col[16], 10);
  if (RUBROS_EXCLUIDOS.has(rubro)) continue;
  const nombre = limpiar(col[4]);
  if (!nombre) continue;
  const nombreMayus = nombre.toUpperCase();
  const categoria = categoriaPorNombre(nombreMayus)
    || (RUBROS_MIXTOS.has(rubro) ? categoriaMixta(nombreMayus) : (rubroACategoria.get(rubro) || 'otros'));
  if (categoria === 'otros') sinCategoria.set(rubro, (sinCategoria.get(rubro) || 0) + 1);
  const situacion = limpiar(col[30]).toLowerCase();
  const estado = situacion.startsWith('cr') ? 'pedido' : 'disponible';

  vistos.add(k);
  productos.push({
    sku,
    nombre,
    marca: foto.carpeta ? titulo(foto.carpeta) : 'Universal',
    fabricante: fabricantes.get(limpiar(col[13])) || '',
    modelos: [],
    categoria,
    precio: null,
    estado,
    imagen: foto.id,
  });
}

productos.sort((a, b) => a.marca.localeCompare(b.marca) || a.nombre.localeCompare(b.nombre));

writeFileSync(SALIDA, JSON.stringify({
  _nota: 'Generado por sync-articulos.mjs (articulos_v3.txt + fotos de Drive). NO editar a mano.',
  actualizado: new Date().toISOString().slice(0, 10),
  productos,
}, null, 2), 'utf8');

const porCategoria = {};
for (const p of productos) porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + 1;
console.log(`\n✓ ${productos.length} productos con foto escritos en src/data/stock.json`);
console.log(`  ${sinFoto} artículos sin foto quedaron afuera`);
console.log('  Por categoría:', porCategoria);
if (sinCategoria.size) {
  const top = [...sinCategoria].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([r, n]) => `${r}:${n}`).join(' ');
  console.log(`  Rubros que cayeron en "otros" (rubro:cantidad): ${top}`);
}
