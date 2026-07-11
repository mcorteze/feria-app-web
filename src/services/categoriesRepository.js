import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { SEED_CATEGORIES } from '../data/seedCategories'

const categoriesCollection = collection(db, 'categories')

export function watchCategories(callback, onError) {
  const q = query(categoriesCollection, orderBy('name', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(SEED_CATEGORIES)
        return
      }
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    onError,
  )
}

export function createCategory(name, color) {
  return addDoc(categoriesCollection, { name, color })
}
