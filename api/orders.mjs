import { sbList, json, isAdmin } from './_lib/db.mjs'

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
    if (!isAdmin(req)) return json(res, 401, { error: 'غير مصرح' })
    const rows = await sbList('orders', 'select=*&order=created_at.desc&limit=100')
    return json(res, 200, rows)
  } catch (e) {
    console.error(e)
    return json(res, 500, { error: 'حدث خطأ في الخادم' })
  }
}
