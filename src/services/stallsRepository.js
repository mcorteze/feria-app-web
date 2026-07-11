import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore'
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
