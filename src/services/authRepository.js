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

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
])

export async function signInWithGoogle() {
  await authReady
  try {
    const result = await signInWithPopup(auth, googleProvider)
    await ensureUserDoc(result.user)
    return result.user
  } catch (err) {
    if (POPUP_FALLBACK_CODES.has(err?.code)) {
      await signInWithRedirect(auth, googleProvider)
      return null
    }
    throw err
  }
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
