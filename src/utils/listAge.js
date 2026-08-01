// Una lista representa UNA feria concreta, no un documento vivo que se edita
// indefinidamente. Reutilizar la lista de la semana pasada agregándole
// productos nuevos mezcla ítems ya comprados o marcados como no encontrados
// con los nuevos, y el planificador no tiene forma de notarlo. Pasada esta
// ventana la lista deja de ser editable por el planificador y la única vía es
// crear una lista nueva (opcionalmente copiando los productos de la anterior).
export const LIST_EDIT_WINDOW_HOURS = 72

const MS_PER_HOUR = 60 * 60 * 1000

// createdAt puede llegar como Timestamp de Firestore, como el objeto plano
// { seconds } de la caché, o como null mientras serverTimestamp() todavía no
// resuelve en el snapshot local inmediato tras crear la lista.
export function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function listAgeHours(list) {
  const created = toDate(list?.createdAt)
  if (!created) return 0
  return (Date.now() - created.getTime()) / MS_PER_HOUR
}

// Sin createdAt resuelto se asume lista recién creada: nunca se bloquea por
// falta de dato, para no dejar inutilizable una lista que acaba de nacer.
export function isListExpired(list) {
  const created = toDate(list?.createdAt)
  if (!created) return false
  return Date.now() - created.getTime() > LIST_EDIT_WINDOW_HOURS * MS_PER_HOUR
}

export function formatListAge(list) {
  const hours = listAgeHours(list)
  if (hours < 1) return 'recién creada'
  if (hours < 24) {
    const rounded = Math.floor(hours)
    return `hace ${rounded} ${rounded === 1 ? 'hora' : 'horas'}`
  }
  const days = Math.floor(hours / 24)
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`
}
