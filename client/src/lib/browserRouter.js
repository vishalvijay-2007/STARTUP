const pathListeners = new Set()

const notifyPathListeners = () => {
  pathListeners.forEach((listener) => listener())
}

export const subscribeToPath = (listener) => {
  pathListeners.add(listener)
  window.addEventListener('popstate', listener)
  return () => {
    pathListeners.delete(listener)
    window.removeEventListener('popstate', listener)
  }
}

export const getCurrentPath = () => window.location.pathname

export const navigateToPath = (path, { replace = false } = {}) => {
  if (window.location.pathname === path) return
  if (replace) window.history.replaceState(null, '', path)
  else window.history.pushState(null, '', path)
  notifyPathListeners()
}
