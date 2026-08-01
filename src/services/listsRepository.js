import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { addItemsBatch } from './itemsRepository'

const listsCollection = collection(db, 'lists')

function sortByCreatedAtDesc(lists) {
  return [...lists].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
}

// Deliberadamente SIN orderBy en la query: combinar array-contains con orderBy
// en otro campo requiere un índice compuesto en Firestore (mismo patrón que
// myTasksQuery() en hub/tasksApi.ts). Se ordena acá en el cliente para no
// depender de crear ese índice manualmente en cada entorno/proyecto Firebase.
export function watchListsForUser(uid, role, callback, onError) {
  const q = query(listsCollection, where('collaboratorUids', 'array-contains', uid))
  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      const filtered = role
        ? all.filter((list) =>
            (list.collaborators || []).some((c) => c.uid === uid && c.role === role),
          )
        : all
      callback(sortByCreatedAtDesc(filtered))
    },
    onError,
  )
}

export function watchCompletedListsForUser(uid, callback, onError) {
  const q = query(listsCollection, where('collaboratorUids', 'array-contains', uid))
  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      const filtered = all.filter((list) => list.status === 'completed')
      callback(sortByCreatedAtDesc(filtered))
    },
    onError,
  )
}

export function watchList(listId, callback, onError) {
  return onSnapshot(
    doc(db, 'lists', listId),
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    },
    onError,
  )
}

export async function getList(listId) {
  const snap = await getDoc(doc(db, 'lists', listId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createList(name, owner, role = 'planner', extraCollaborators = []) {
  const extra = extraCollaborators.map((c) => ({
    uid: c.uid,
    displayName: c.displayName || '',
    photoURL: c.photoURL || '',
    role: 'buyer',
  }))
  const collaboratorUids = [owner.uid, ...extra.map((c) => c.uid)]
  const docRef = await addDoc(listsCollection, {
    name,
    status: 'active',
    createdAt: serverTimestamp(),
    totalSpent: 0,
    collaborators: [
      {
        uid: owner.uid,
        displayName: owner.displayName || '',
        photoURL: owner.photoURL || '',
        role,
      },
      ...extra,
    ],
    collaboratorUids,
  })
  return docRef.id
}

// Divide los ítems de una lista según su desenlace, para que la pantalla de
// renovación pueda mostrar cuántos hay de cada tipo y dejar decidir al usuario.
export function splitItemsByOutcome(items = []) {
  const pending = []
  const bought = []
  const notFound = []
  for (const item of items) {
    if (item.notFound) notFound.push(item)
    else if (item.isBought) bought.push(item)
    else pending.push(item)
  }
  return { pending, bought, notFound }
}

// Crea una lista NUEVA con los productos de otra. Nunca copia el desenlace:
// addItemsBatch reconstruye cada ítem desde cero (isBought/notFound en false,
// paidPrice en null), que es justamente lo que evita arrastrar el estado de la
// feria anterior. Se conservan cantidad, unidad, precio estimado y puesto.
export async function duplicateList(sourceList, items, owner, options = {}) {
  const { name, includeBought = false, includeNotFound = true } = options

  const buyers = (sourceList.collaborators || [])
    .filter((c) => c.uid !== owner.uid)
    .map((c) => ({
      uid: c.uid,
      displayName: c.displayName || '',
      photoURL: c.photoURL || '',
    }))

  const { pending, bought, notFound } = splitItemsByOutcome(items)
  const selected = [
    ...pending,
    ...(includeBought ? bought : []),
    ...(includeNotFound ? notFound : []),
  ]

  const listId = await createList(name, owner, 'planner', buyers)

  if (selected.length > 0) {
    await addItemsBatch(
      listId,
      selected.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        estimatedPrice: item.estimatedPrice,
        // El comentario de un ítem no encontrado es el motivo por el que no se
        // encontró la vez pasada ("no había en el puesto habitual"); no aplica
        // a la feria nueva y solo confundiría al comprador.
        comment: item.notFound ? '' : item.comment,
        stallId: item.stallId,
        stallName: item.stallName,
      })),
    )
  }

  return listId
}

export function renameList(listId, name) {
  return updateDoc(doc(db, 'lists', listId), { name })
}

export function deleteList(listId) {
  return deleteDoc(doc(db, 'lists', listId))
}

export function completeList(listId, totalSpent) {
  return updateDoc(doc(db, 'lists', listId), {
    status: 'completed',
    totalSpent,
  })
}

export async function joinListAsBuyer(listId, user) {
  const listRef = doc(db, 'lists', listId)
  const snap = await getDoc(listRef)
  if (!snap.exists()) {
    throw new Error('La lista no existe')
  }
  const data = snap.data()
  const already = (data.collaborators || []).some((c) => c.uid === user.uid)
  if (already) {
    return listId
  }
  await updateDoc(listRef, {
    collaborators: arrayUnion({
      uid: user.uid,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: 'buyer',
    }),
    collaboratorUids: arrayUnion(user.uid),
  })
  return listId
}

export function removeCollaborator(listId, collaborator) {
  return updateDoc(doc(db, 'lists', listId), {
    collaborators: arrayRemove(collaborator),
    collaboratorUids: arrayRemove(collaborator.uid),
  })
}
