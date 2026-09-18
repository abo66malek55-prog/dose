import { sbSingle, sbInsert, sbUpdate, json, readBody } from './_lib/db.mjs'
import { sendPushToOwners } from './_lib/push.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
  try {
    const { name, productId } = await readBody(req)
    const customerName = (name || '').trim()
    if (!customerName) return json(res, 400, { error: 'الاسم مطلوب' })
    if (!productId) return json(res, 400, { error: 'اختر مشروباً أولاً' })

    const product = await sbSingle('products', `select=*&id=eq.${productId}&limit=1`)
    if (!product) return json(res, 404, { error: 'المنتج غير موجود' })
    if (!product.available) return json(res, 400, { error: 'هذا المنتج غير متاح حالياً' })

    const earned = product.points || 0
    let customer = await sbSingle('customers', `select=*&name=${encodeURIComponent('eq.' + customerName)}&limit=1`)
    let total
    if (customer) {
      total = (customer.points || 0) + earned
      const updated = await sbUpdate('customers', `id=eq.${customer.id}`, { points: total })
      customer = updated && updated.length ? updated[0] : { ...customer, points: total }
    } else {
      const inserted = await sbInsert('customers', { name: customerName, points: earned })
      customer = inserted && inserted.length ? inserted[0] : { name: customerName, points: earned }
      total = earned
    }

    await sbInsert('orders', {
      customer_name: customerName,
      product_id: product.id,
      product_name: product.name,
      points_earned: earned,
      total_points: total,
    })

    // Fire the push notification but never fail the order because of it
    let push = { sent: 0, total: 0 }
    try {
      push = await sendPushToOwners({
        title: `طلب جديد من ${customerName} ☕`,
        body: `${product.name} — حصل على ${earned} نقطة، رصيده الآن ${total} نقطة`,
        url: '/admin',
      })
    } catch (e) {
      console.error('push failed', e)
    }

    return json(res, 200, {
      ok: true,
      product_name: product.name,
      points_earned: earned,
      total_points: total,
      push_sent: push.sent,
    })
  } catch (e) {
    console.error(e)
    return json(res, 500, { error: 'حدث خطأ في الخادم' })
  }
}
