import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'

function itemsCollection(listId) {
  return collection(db, 'lists', listId, 'items')
}

export function watchItems(listId, callback, onError) {
  const q = query(itemsCollection(listId), orderBy('productName', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    onError,
  )
}

export function addItem(listId, item) {
  return addDoc(itemsCollection(listId), {
    productId: item.productId || null,
    productName: item.productName,
    quantity: item.quantity,
    unit: item.unit,
    estimatedPrice: item.estimatedPrice ?? 0,
    paidPrice: null,
    isBought: false,
    comment: item.comment || '',
    stallId: item.stallId || null,
    stallName: item.stallName || '',
  })
}

export function updateItem(listId, itemId, changes) {
  return updateDoc(doc(db, 'lists', listId, 'items', itemId), changes)
}

export function deleteItem(listId, itemId) {
  return deleteDoc(doc(db, 'lists', listId, 'items', itemId))
}

export function markItemBought(listId, itemId, { quantity, paidPrice }) {
  return updateDoc(doc(db, 'lists', listId, 'items', itemId), {
    quantity,
    paidPrice,
    isBought: true,
  })
}

export function markItemPending(listId, itemId) {
  return updateDoc(doc(db, 'lists', listId, 'items', itemId), {
    isBought: false,
    paidPrice: null,
  })
}
