/**
 * Formatea el nombre de un aula o espacio físico evitando duplicar el prefijo "Aula".
 *
 * Ejemplos:
 *  - "Aula 2.10" -> "Aula 2.10"
 *  - "Aula Aula 2.10" -> "Aula 2.10"
 *  - "12" -> "Aula 12"
 *  - "2.10" -> "Aula 2.10"
 *  - "Laboratorio informático 4" -> "Laboratorio informático 4"
 *  - "Aula Magna" -> "Aula Magna"
 */
export function formatAula(aula?: string | null): string {
  if (!aula) return "";
  const trimmed = aula.trim();
  if (!trimmed) return "";

  // Si tiene duplicado "Aula Aula ...", limpiarlo
  const cleaned = trimmed.replace(/^aula\s+aula\b/i, "Aula");

  // Si ya empieza con Aula, Laboratorio, Lab, Sala, Taller, etc.
  if (/^(aula|laboratorio|lab|sala|taller)\b/i.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Si es solo el número o identificación (ej: "12", "2.10"), anteponer "Aula "
  return `Aula ${cleaned}`;
}
