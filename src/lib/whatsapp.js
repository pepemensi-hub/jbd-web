export function linkWA({ whatsapp, mensaje, repuesto, sku, marca, modelo }) {
  const texto = mensaje || [
    `Hola JBD, quiero consultar por: ${repuesto}${sku ? ` (cód. ${sku})` : ''}`,
    marca && modelo ? `Para: ${marca} ${modelo}` : ''
  ].filter(Boolean).join('\n');
  return `https://wa.me/${whatsapp}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;
}
