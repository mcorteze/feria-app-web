const STORAGE_KEY = 'feria-app:lastRole'

export function getLastRole() {
  return localStorage.getItem(STORAGE_KEY) === 'buyer' ? 'buyer' : 'planner'
}

export function setLastRole(role) {
  localStorage.setItem(STORAGE_KEY, role)
}
