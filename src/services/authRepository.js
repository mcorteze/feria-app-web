import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
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

// window.open() (lo que usa signInWithPopup por dentro) solo se abre en
// móvil si se llama de forma completamente síncrona dentro del gesto de
// click — cualquier await previo (incluso a authReady, aunque ya esté
// resuelto) basta para que el navegador lo trate como popup no solicitado
// y lo bloquee sin lanzar error capturable. Por eso authReady NO se espera
// aquí: se dispara en el import de config.js y para cuando el usuario
// alcanza a tocar el botón ya está resuelto en la práctica.
//
// Se usa popup siempre (nunca redirect): redirect navega por el dominio
// intermedio *.firebaseapp.com, y Bounce Tracking Protection de Chrome
// purga ese estado a mitad del flujo porque el usuario nunca "interactúa"
// directamente ahí — eso hacía fallar el login de forma intermitente sin
// importar cuántos otros fixes se aplicaran alrededor.
export async function signInWithGoogle() {
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
