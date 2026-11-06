// Datos compartidos para las páginas SEO del catálogo (/repuestos/... y /marcas/...).
import stock from '../data/stock.json';

export const CATEGORIAS = [
  { id: 'filtros', label: 'Filtros', intro: 'Filtros de aceite, aire, combustible y habitáculo para el service de tu auto.' },
  { id: 'correas', label: 'Correas', intro: 'Correas de distribución, poly-V y kits con tensores y poleas.' },
  { id: 'frenos', label: 'Frenos', intro: 'Pastillas, discos, cintas, campanas, cilindros y bombas de freno.' },
  { id: 'encendido', label: 'Encendido', intro: 'Bujías, bobinas, cables y componentes del sistema de encendido.' },
  { id: 'suspension', label: 'Suspensión', intro: 'Amortiguadores, espirales, bujes, cazoletas y bieletas.' },
  { id: 'refrigeracion', label: 'Refrigeración', intro: 'Bombas de agua, termostatos, radiadores, mangueras y depósitos.' },
  { id: 'electricidad', label: 'Electricidad', intro: 'Sensores, bulbos, lámparas, alternadores, arranques y componentes eléctricos.' },
  { id: 'inyeccion', label: 'Inyección', intro: 'Inyectores, bombas de nafta, sensores y repuestos del sistema de inyección.' },
  { id: 'transmision', label: 'Transmisión', intro: 'Kits de embrague, crucetas, homocinéticas, semiejes y rulemanes.' },
  { id: 'direccion', label: 'Dirección', intro: 'Extremos, precaps, cremalleras, bombas y repuestos de dirección.' },
  { id: 'escape', label: 'Escape', intro: 'Silenciadores, caños, juntas y abrazaderas de escape.' },
  { id: 'aire-acondicionado', label: 'Aire acondicionado', intro: 'Compresores, filtros deshidratadores, válvulas y repuestos de A/A.' },
  { id: 'tren-delantero', label: 'Tren delantero', intro: 'Rótulas, parrillas, bujes, mazas y rulemanes de rueda.' },
  { id: 'motor', label: 'Motor', intro: 'Juntas, retenes, pistones, aros, válvulas, soportes y repuestos de motor.' },
  { id: 'carroceria', label: 'Carrocería y accesorios', intro: 'Ópticas, manijas, espejos, burletes y accesorios de carrocería.' },
  { id: 'otros', label: 'Otros repuestos', intro: 'Más repuestos y accesorios para el auto.' },
];

export const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** "para Volkswagen" / "universales" */
export const paraMarca = (marca) => (marca === 'Universal' ? 'universales' : `para ${marca}`);

const ordenar = (a, b) =>
  (a.estado === 'disponible' ? 0 : 1) - (b.estado === 'disponible' ? 0 : 1) || a.nombre.localeCompare(b.nombre, 'es');

export const productos = [...stock.productos].sort(ordenar);

export const marcas = [...new Set(productos.map((p) => p.marca))]
  .map((nombre) => ({ nombre, slug: slug(nombre), total: productos.filter((p) => p.marca === nombre).length }))
  .sort((a, b) => b.total - a.total);

export const categorias = CATEGORIAS
  .map((c) => ({ ...c, total: productos.filter((p) => p.categoria === c.id).length }))
  .filter((c) => c.total > 0);

export const deCategoria = (id) => productos.filter((p) => p.categoria === id);
export const deMarca = (nombre) => productos.filter((p) => p.marca === nombre);

/** Muestra variada: intercala marcas para que no salgan 24 del mismo tipo */
export function muestra(lista, n = 24, clave = 'marca') {
  const grupos = new Map();
  for (const p of lista) {
    if (!grupos.has(p[clave])) grupos.set(p[clave], []);
    grupos.get(p[clave]).push(p);
  }
  const colas = [...grupos.values()];
  const out = [];
  for (let i = 0; out.length < n && colas.some((c) => c.length > i); i++) {
    for (const c of colas) if (c[i] && out.length < n) out.push(c[i]);
  }
  return out;
}
