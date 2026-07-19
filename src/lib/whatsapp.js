export function linkWA({ whatsapp, repuesto, sku, marca, modelo }) {
  const texto = [
    `Hola JBD, quiero consultar por: ${repuesto}${sku ? ` (cód. ${sku})` : ''}`,
    marca && modelo ? `Para: ${marca} ${modelo}` : ''
  ].filter(Boolean).join('\n');
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`;
}
