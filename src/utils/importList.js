export function parseImportPayload(jsonString) {
  let data
  try {
    data = JSON.parse(jsonString)
  } catch {
    throw new Error('El texto no es un JSON válido.')
  }
  if (!data || typeof data.name !== 'string' || !Array.isArray(data.items)) {
    throw new Error('Formato inválido: se espera un objeto con "name" e "items".')
  }
  return data
}
