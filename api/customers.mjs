import { sbList, json, isAdmin } from './_lib/db.mjs'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const name = (req.query.name || '').trim()
      if (name) {
        const rows = await sbList('customers', `select=*&name=${encodeURIComponent('eq.' + name)}&limit=1`)
        return json(res, 200, rows.length ? rows[0] : null)
      }
      if (!isAdmin(req)) return json(res, 401, { error: 'غير مصرح' })
      const rows = await sbList('customers', 'select=*&order=points.desc,created_at.asc')
      return json(res, 200, rows)
    }
    return json(res, 405, { error: 'method not allowed' })
  } catch (e) {
    console.error(e)
    return json(res, 500, { error: 'حدث خطأ في الخادم' })
  }
}
