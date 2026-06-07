// Devuelve la hora actual en formato "HH:MM"
export function getCurrentTime(): string {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Devuelve la fecha actual en formato "Lunes, 1 de Enero de 2026"
export function getCurrentDate(): string {
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Devuelve un saludo basado en la hora actual.
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "¡Buenos días!";
  }
  if (hour >= 12 && hour < 20) {
    return "¡Buenas tardes!";
  }
  return "¡Buenas noches!";
}
