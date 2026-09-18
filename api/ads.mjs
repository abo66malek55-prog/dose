import { sbList, sbInsert, sbUpdate, sbDelete, json, readBody, isAdmin } from './_lib/db.mjs'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await sbList('ads', 'select=*&order=created_at.desc')
      return json(res, 200, rows)
    }
    if (!isAdmin(req)) return json(res, 401, { error: 'غير مصرح' })

    if (req.method === 'POST') {
      const b = await readBody(req)
      const row = {
        title: (b.title || '').trim(),
        subtitle: b.subtitle || '',
        body: b.body || '',
        discount_text: b.discount_text || '',
        image_url: b.image_url || '',
        active: b.active !== false,
      }
      if (!row.title) return json(res, 400, { error: 'عنوان الإعلان مطلوب' })
      if (!row.image_url) return json(res, 400, { error: 'صورة الإعلان مطلوبة' })
      const out = await sbInsert('ads', row)
      return json(res, 200, out)
    }

    if (req.method === 'PATCH') {
      const b = await readBody(req)
      if (!b.id) return json(res, 400, { error: 'id مطلوب' })
      const patch = {}
      for (const k of ['title', 'subtitle', 'body', 'discount_text', 'image_url']) {
        if (b[k] !== undefined) patch[k] = b[k]
      }
      if (b.active !== undefined) patch.active = !!b.active
      const out = await sbUpdate('ads', `id=eq.${b.id}`, patch)
      return json(res, 200, out)
    }

    if (req.method === 'DELETE') {
      const b = await readBody(req)
      if (!b.id) return json(res, 400, { error: 'id مطلوب' })
      await sbDelete('ads', `id=eq.${b.id}`)
      return json(res, 200, { ok: true })
    }

    return json(res, 405, { error: 'method not allowed' })
  } catch (e) {
    console.error(e)
    return json(res, 500, { error: 'حدث خطأ في الخادم' })
  }
}
