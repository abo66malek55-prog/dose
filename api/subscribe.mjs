import { sbInsert, sbDelete, json, readBody, isAdmin } from './_lib/db.mjs'

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const b = await readBody(req)
      if (!b.endpoint || !b.keys) return json(res, 400, { error: 'subscription ناقص' })
      // one device = one endpoint; replace old record for this endpoint
      await sbDelete('push_subscriptions', `endpoint=${encodeURIComponent('eq.' + b.endpoint)}`)
      const out = await sbInsert('push_subscriptions', {
        endpoint: b.endpoint,
        keys: b.keys,
        label: b.label || 'owner',
      })
      return json(res, 200, { ok: true })
    }
    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return json(res, 401, { error: 'غير مصرح' })
      const b = await readBody(req)
      if (b.endpoint) await sbDelete('push_subscriptions', `endpoint=${encodeURIComponent('eq.' + b.endpoint)}`)
      else await sbDelete('push_subscriptions', 'endpoint=neq.')
      return json(res, 200, { ok: true })
    }
    return json(res, 405, { error: 'method not allowed' })
  } catch (e) {
    console.error(e)
    return json(res, 500, { error: 'حدث خطأ في الخادم' })
  }
}
