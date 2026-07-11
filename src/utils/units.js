import { UNITS } from '../data/seedCategories'

const UNIT_ALIASES = {
  litro: 'lt',
  lata: 'un',
  rollo: 'un',
  bolsa: 'paquete',
  sobre: 'paquete',
  frasco: 'paquete',
  caja: 'paquete',
}

export function normalizeUnit(rawUnit) {
  const value = (rawUnit || '').toString().trim().toLowerCase()
  if (UNITS.includes(value)) return value
  if (UNIT_ALIASES[value]) return UNIT_ALIASES[value]
  return 'un'
}
