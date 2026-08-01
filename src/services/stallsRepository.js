import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const stallsCollection = collection(db, 'stalls')

export function watchStalls(callback, onError) {
  const q = query(stallsCollection, orderBy('locationOrder', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    onError,
  )
}

export async function createStall(name, ownerUid, locationOrder = 999) {
  const docRef = await addDoc(stallsCollection, {
    name,
    locationOrder,
    ownerUid,
  })
  return docRef.id
}

export function updateStall(stallId, changes) {
  return updateDoc(doc(db, 'stalls', stallId), changes)
}

export function deleteStall(stallId) {
  return deleteDoc(doc(db, 'stalls', stallId))
}

// Reescribe locationOrder de forma densa (0..n-1) siguiendo el orden recibido.
// Reemplaza al intercambio por pares de las flechas subir/bajar: con drag &
// drop el orden final se conoce completo, y normalizar los índices en cada
// commit evita que se acumulen huecos o empates que hagan inestable el
// orderBy('locationOrder') de watchStalls.
export async function reorderStalls(stallIds) {
  const batch = writeBatch(db)
  stallIds.forEach((stallId, index) => {
    batch.update(doc(db, 'stalls', stallId), { locationOrder: index })
  })
  await batch.commit()
}

// Nombre genérico para un puesto que el usuario crea sin nombrar. Se busca el
// mayor "Puesto N" existente en vez de usar stalls.length, para no repetir un
// nombre cuando se borraron puestos intermedios.
export function nextStallName(stalls = []) {
  const used = stalls
    .map((s) => /^puesto\s+(\d+)$/i.exec((s.name || '').trim()))
    .filter(Boolean)
    .map((match) => Number(match[1]))
  const highest = used.length > 0 ? Math.max(...used) : 0
  return `Puesto ${highest + 1}`
}
