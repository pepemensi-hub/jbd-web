// Datos del catálogo en formato compacto para CatalogoGrid (se arman las tarjetas en el cliente).
// Cada producto: [sku, nombre, marca, fabricante, categoria, estado, imagen]
import stock from '../data/stock.json';

export function GET() {
  const productos = stock.productos.map((p: any) => [
    p.sku, p.nombre, p.marca, p.fabricante || '', p.categoria, p.estado, p.imagen || '',
  ]);
  return new Response(JSON.stringify({ actualizado: stock.actualizado, productos }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
