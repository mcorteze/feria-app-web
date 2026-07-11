import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export function watchFrequentCollaborators(uid, callback, onError) {
  return onSnapshot(
    collection(db, 'users', uid, 'frequentCollaborators'),
    (snapshot) => callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  )
}

export function addFrequentCollaborator(uid, collaborator) {
  return setDoc(doc(db, 'users', uid, 'frequentCollaborators', collaborator.uid), {
    uid: collaborator.uid,
    displayName: collaborator.displayName || '',
    email: collaborator.email || '',
    photoURL: collaborator.photoURL || '',
  })
}

export function removeFrequentCollaborator(uid, collaboratorUid) {
  return deleteDoc(doc(db, 'users', uid, 'frequentCollaborators', collaboratorUid))
}
