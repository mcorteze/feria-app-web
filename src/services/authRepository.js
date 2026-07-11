import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
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

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

// En móvil, window.open() (lo que usa signInWithPopup por dentro) solo se
// abre si se llama de forma completamente síncrona dentro del gesto de
// click — cualquier await previo (incluso a una promesa ya resuelta) puede
// bastar para que el navegador lo trate como popup no solicitado y lo
// bloquee sin lanzar error. Por eso en móvil se va directo a redirect, sin
// intentar popup primero. En desktop no hay ese problema y el popup da
// mejor UX (no navega fuera de la página).
export async function signInWithGoogle() {
  await authReady
  if (isMobileDevice()) {
    await signInWithRedirect(auth, googleProvider)
    return null
  }
  const result = await signInWithPopup(auth, googleProvider)
  await ensureUserDoc(result.user)
  return result.user
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
