import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase/config'

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

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

export async function signInWithGoogle() {
  if (isMobileDevice()) {
    await signInWithRedirect(auth, googleProvider)
    return null
  }
  const result = await signInWithPopup(auth, googleProvider)
  await ensureUserDoc(result.user)
  return result.user
}

export async function consumeRedirectResult() {
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
