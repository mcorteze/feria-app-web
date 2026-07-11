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

export async function swapStallOrder(stallA, stallB) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'stalls', stallA.id), { locationOrder: stallB.locationOrder })
  batch.update(doc(db, 'stalls', stallB.id), { locationOrder: stallA.locationOrder })
  await batch.commit()
}
