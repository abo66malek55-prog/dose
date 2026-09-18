import { sbList, sbInsert, sbUpdate, sbDelete, json, readBody, isAdmin } from './_lib/db.mjs'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await sbList('products', 'select=*&order=sort_order.asc,created_at.asc')
      return json(res, 200, rows)
    }
    if (!isAdmin(req)) return json(res, 401, { error: 'غير مصرح' })

    if (req.method === 'POST') {
      const b = await readBody(req)
      const row = {
        name: (b.name || '').trim(),
        category: b.category,
        price: Number(b.price) || 0,
        points: Number(b.points) || 0,
        description: b.description || '',
        image_url: b.image_url || '',
        available: b.available !== false,
        sort_order: Number(b.sort_order) || 0,
      }
      if (!row.name) return json(res, 400, { error: 'الاسم مطلوب' })
      if (!['hot', 'cold', 'dessert'].includes(row.category)) return json(res, 400, { error: 'التصنيف غير صحيح' })
      const out = await sbInsert('products', row)
      return json(res, 200, out)
    }

    if (req.method === 'PATCH') {
      const b = await readBody(req)
      if (!b.id) return json(res, 400, { error: 'id مطلوب' })
      const patch = {}
      for (const k of ['name', 'category', 'description', 'image_url']) {
        if (b[k] !== undefined) patch[k] = b[k]
      }
      for (const k of ['price', 'points', 'sort_order']) {
        if (b[k] !== undefined) patch[k] = Number(b[k]) || 0
      }
      if (b.available !== undefined) patch.available = !!b.available
      const out = await sbUpdate('products', `id=eq.${b.id}`, patch)
      return json(res, 200, out)
    }

    if (req.method === 'DELETE') {
      const b = await readBody(req)
      if (!b.id) return json(res, 400, { error: 'id مطلوب' })
      await sbDelete('products', `id=eq.${b.id}`)
      return json(res, 200, { ok: true })
    }

    return json(res, 405, { error: 'method not allowed' })
  } catch (e) {
    console.error(e)
    return json(res, 500, { error: 'حدث خطأ في الخادم' })
  }
}
