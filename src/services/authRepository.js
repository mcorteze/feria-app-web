import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, authReady, db, googleProvider } from '../firebase/config'

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback)
}

async function ensureUserDoc(user) {
  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)
  if (!snap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
    })
  }
}

// GitHub Pages sirve todo con Cross-Origin-Opener-Policy: same-origin, lo que
// impide que el popup de signInWithPopup se comunique de vuelta con la página
// principal (no hay forma de configurar esa cabecera en GitHub Pages). Se usa
// siempre signInWithRedirect, que no depende de comunicación entre ventanas.
export async function signInWithGoogle() {
  await authReady
  await signInWithRedirect(auth, googleProvider)
}

export async function consumeRedirectResult() {
  await authReady
  const result = await getRedirectResult(auth)
  if (result?.user) {
    await ensureUserDoc(result.user)
  }
  return result?.user || null
}

export function signOut() {
  return firebaseSignOut(auth)
}

export function updateDisplayName(user, displayName) {
  return updateProfile(user, { displayName })
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
