async function req(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const adminPwd = sessionStorage.getItem('dose_admin_pwd')
  if (adminPwd) headers['x-admin-password'] = adminPwd
  const res = await fetch(path, { ...options, headers: { ...headers, ...(options.headers || {}) } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'خطأ في الاتصال')
  return data
}

export const api = {
  products: () => req('/api/products'),
  saveProduct: (p) => req('/api/products', { method: 'POST', body: JSON.stringify(p) }),
  updateProduct: (p) => req('/api/products', { method: 'PATCH', body: JSON.stringify(p) }),
  deleteProduct: (id) => req('/api/products', { method: 'DELETE', body: JSON.stringify({ id }) }),

  ads: () => req('/api/ads'),
  saveAd: (a) => req('/api/ads', { method: 'POST', body: JSON.stringify(a) }),
  updateAd: (a) => req('/api/ads', { method: 'PATCH', body: JSON.stringify(a) }),
  deleteAd: (id) => req('/api/ads', { method: 'DELETE', body: JSON.stringify({ id }) }),

  customer: (name) => req(`/api/customers?name=${encodeURIComponent(name)}`),
  customers: () => req('/api/customers'),
  orders: () => req('/api/orders'),

  order: (name, productId) => req('/api/order', { method: 'POST', body: JSON.stringify({ name, productId }) }),

  login: (password) =>
    req('/api/admin-login', { method: 'POST', body: JSON.stringify({}), headers: { 'x-admin-password': password } }),

  vapidPublicKey: () => req('/api/vapid'),
  subscribe: (sub) => req('/api/subscribe', { method: 'POST', body: JSON.stringify(sub) }),
  testPush: () => req('/api/test-push', { method: 'POST', body: JSON.stringify({}) }),
}

// Resize an image file to a compact JPEG data URL (keeps DB rows small)
export function fileToDataUrl(file, maxSize = 1100, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}
