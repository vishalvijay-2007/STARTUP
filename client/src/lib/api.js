const API_BASE_URL = (
  import.meta.env.VITE_API_URL?.trim()
  || (import.meta.env.PROD ? 'https://startup-api-3shs.onrender.com/api' : 'http://localhost:5000/api')
).replace(/\/$/, '')

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const method = (options.method || 'GET').toUpperCase()
  const requestUrl = `${API_BASE_URL}${path}`
  const isProfilePhotoRequest = /^\/users\/[^/]+\/photo$/.test(path)
  const safePath = path.replace(/\/users\/[^/]+(?=\/|$)/, '/users/:id')
  if (import.meta.env.DEV && isProfilePhotoRequest) {
    console.info('Profile photo API request', { url: requestUrl, method })
  }
  const response = await fetch(requestUrl, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(localStorage.getItem('authToken')
        ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        : {}),
      ...options.headers,
    },
  })
  const contentType = response.headers.get('content-type') || ''
  const isJsonResponse = /application\/(?:[\w.-]+\+)?json/i.test(contentType)
  const logProfilePhotoResponse = (message) => {
    if (!import.meta.env.DEV || !isProfilePhotoRequest) return
    const details = {
      url: requestUrl,
      method,
      status: response.status,
      contentType,
      ...(message ? { message: message.replace(/[\r\n\t]+/g, ' ').slice(0, 200) } : {}),
    }
    if (response.ok) console.info('Profile photo API response', details)
    else console.error('Profile photo API response', details)
  }
  if (response.status === 404 && isProfilePhotoRequest && !isJsonResponse) {
    logProfilePhotoResponse('The configured backend does not have the photo upload route; response body omitted.')
    const error = new Error('Photo uploads are not available on the configured backend yet. Please redeploy the backend and try again.')
    error.code = 'PROFILE_PHOTO_ROUTE_MISSING'
    throw error
  }
  if (response.status === 404 && method === 'POST' && path === '/ai/chat') {
    const error = new Error('The configured backend does not have the AI chat route yet. Redeploy the backend from this project, then try again.')
    throw error
  }
  if (response.status === 401 && localStorage.getItem('authToken')) {
    localStorage.removeItem('authToken')
    window.dispatchEvent(new Event('auth-expired'))
  }

  const logResponseError = () => {
    if (import.meta.env.DEV) {
      console.error('API request failed', {
        method,
        path: safePath,
        status: response.status,
        contentType,
      })
    }
  }

  if (!isJsonResponse) {
    logProfilePhotoResponse('Non-JSON response; response body omitted.')
    logResponseError()
    const error = new Error('The server returned an unexpected response. Please try again.')
    error.code = 'NON_JSON_RESPONSE'
    throw error
  }

  let result
  try {
    result = await response.json()
  } catch {
    logProfilePhotoResponse('Invalid JSON response; response body omitted.')
    logResponseError()
    const error = new Error('The server returned an unexpected response. Please try again.')
    error.code = 'NON_JSON_RESPONSE'
    throw error
  }

  if (!response.ok) {
    logProfilePhotoResponse(typeof result.message === 'string' ? result.message : `Request failed (${response.status}).`)
    logResponseError()
    const error = new Error(typeof result.message === 'string' ? result.message : `Request failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  logProfilePhotoResponse()
  return result
}
