import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const productsCollection = collection(db, 'products')

export function watchProducts(callback, onError) {
  const q = query(productsCollection, orderBy('name', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    onError,
  )
}

export async function createProduct(product, ownerUid) {
  const docRef = await addDoc(productsCollection, {
    name: product.name,
    categoryId: product.categoryId || null,
    defaultUnit: product.defaultUnit || 'un',
    lastPrice: product.lastPrice ?? null,
    priceHistory: product.lastPrice
      ? [{ price: product.lastPrice, date: new Date().toISOString() }]
      : [],
    stallId: product.stallId || null,
    stallName: product.stallName || '',
    useCount: 0,
    ownerUid,
  })
  return docRef.id
}

export function recordProductUse(productId) {
  return updateDoc(doc(db, 'products', productId), {
    useCount: increment(1),
  })
}

export async function findOrCreateProduct(name, defaultUnit, existingProducts, ownerUid) {
  const match = existingProducts.find(
    (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase(),
  )
  if (match) return match

  const id = await createProduct({ name: name.trim(), defaultUnit }, ownerUid)
  return { id, name: name.trim(), defaultUnit }
}

export function updateProduct(productId, changes) {
  return updateDoc(doc(db, 'products', productId), changes)
}

export function deleteProduct(productId) {
  return deleteDoc(doc(db, 'products', productId))
}

export function recordPrice(productId, price) {
  return updateDoc(doc(db, 'products', productId), {
    lastPrice: price,
    priceHistory: arrayUnion({ price, date: new Date().toISOString() }),
  })
}

export async function seedProducts(products, ownerUid) {
  const batch = writeBatch(db)
  for (const product of products) {
    const ref = doc(productsCollection)
    batch.set(ref, {
      name: product.name,
      categoryId: product.categoryId || null,
      defaultUnit: product.defaultUnit || 'un',
      lastPrice: null,
      priceHistory: [],
      stallId: null,
      stallName: '',
      useCount: 0,
      ownerUid,
    })
  }
  await batch.commit()
}
