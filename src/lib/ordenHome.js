// Orden de "Algunos repuestos del catálogo" en la home. Sin imports: lo usan el servidor
// (página 1 en el HTML) y el navegador (resto de las páginas, desde /catalogo.json).
// 1) primero los que están en stock  2) dentro de cada marca, categorías intercaladas
// 3) las marcas intercaladas entre sí → cada página mezcla marcas y tipos de repuesto.

function intercalar(lista, clave) {
  const grupos = new Map();
  for (const p of lista) {
    const k = clave(p);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(p);
  }
  const colas = [...grupos.values()];
  const largo = Math.max(0, ...colas.map((c) => c.length));
  const out = [];
  for (let i = 0; i < largo; i++) for (const c of colas) if (c[i] !== undefined) out.push(c[i]);
  return out;
}

/** @param get (p) => [marca, categoria, estado] */
export function ordenHome(lista, get) {
  const base = [...lista.filter((p) => get(p)[2] === 'disponible'), ...lista.filter((p) => get(p)[2] !== 'disponible')];
  const porMarca = new Map();
  for (const p of base) {
    const m = get(p)[0];
    if (!porMarca.has(m)) porMarca.set(m, []);
    porMarca.get(m).push(p);
  }
  const marcasIntercaladas = [...porMarca.values()].map((l) => intercalar(l, (p) => get(p)[1]));
  return intercalar(marcasIntercaladas.flatMap((l, i) => l.map((p, j) => ({ p, i, j }))), (x) => x.i).map((x) => x.p);
}
