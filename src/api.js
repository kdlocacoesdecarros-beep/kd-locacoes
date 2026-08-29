let cachedApiBase = null

async function resolveApiBase() {
  if (cachedApiBase) return cachedApiBase
  try {
    const res = await fetch(`${process.env.BASE_URL}config.json`)
    if (res.ok) {
      const cfg = await res.json()
      if (cfg.apiBase) {
        cachedApiBase = cfg.apiBase
        return cachedApiBase
      }
    }
  } catch (e) {
    // config.json só existe quando hospedado no RAB — em dev local cai no fallback
  }
  cachedApiBase = process.env.VUE_APP_API_URL || 'https://rab-kd.redesis.net/hook'
  return cachedApiBase
}

function getToken() {
  return localStorage.getItem('kd_token') || ''
}

export function setToken(token) {
  if (token) localStorage.setItem('kd_token', token)
  else localStorage.removeItem('kd_token')
}

async function request(path, { method = 'GET', body, query } = {}) {
  const base = await resolveApiBase()
  let url = `${base}/kd/${path}`
  if (query) {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    )
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['x-session-token'] = token

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  let data = null
  try {
    data = await res.json()
  } catch (e) {
    data = null
  }

  if (!res.ok || (data && data.error)) {
    const msg = (data && (data.error || data.mensagem)) || `Erro ${res.status}`
    throw new Error(msg)
  }
  return data
}

export const api = {
  get: (path, query) => request(path, { method: 'GET', query }),
  post: (path, body) => request(path, { method: 'POST', body }),
  del: (path, body) => request(path, { method: 'DELETE', body })
}
