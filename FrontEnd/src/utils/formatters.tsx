/**
 * formatea una fecha ISO a "DD de mes, YYYY" en español.
 *
 * @param isoDate - Cadena de fecha en formato ISO (ej. "2025-06-29T00:00:00.000Z")
 * @returns Fecha formateada (ej. "29 de junio, 2025")
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('es-MX', {
    day:   'numeric',
    month: 'long',
    year:  'numeric'
  }).format(date);
}