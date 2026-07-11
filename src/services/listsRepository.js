import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const listsCollection = collection(db, 'lists')

export function watchListsForUser(uid, role, callback, onError) {
  const q = query(listsCollection, orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      const filtered = all.filter((list) =>
        (list.collaborators || []).some(
          (c) => c.uid === uid && (!role || c.role === role),
        ),
      )
      callback(filtered)
    },
    onError,
  )
}

export function watchCompletedListsForUser(uid, callback, onError) {
  const q = query(listsCollection, orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      const filtered = all.filter(
        (list) =>
          list.status === 'completed' &&
          (list.collaborators || []).some((c) => c.uid === uid),
      )
      callback(filtered)
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

export async function createList(name, owner) {
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
        role: 'planner',
      },
    ],
    collaboratorUids: [owner.uid],
  })
  return docRef.id
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
