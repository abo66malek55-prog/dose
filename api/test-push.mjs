import { json, isAdmin } from './_lib/db.mjs'
import { sendPushToOwners } from './_lib/push.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
  if (!isAdmin(req)) return json(res, 401, { error: 'غير مصرح' })
  try {
    const out = await sendPushToOwners({
      title: 'إشعار تجريبي من dose ☕',
      body: 'مبروك! الإشعارات الفورية تعمل على هذا الجهاز 🎉',
      url: '/admin',
    })
    if (out.total === 0) return json(res, 200, { ok: false, message: 'لا توجد أجهزة مشتركة بعد. فعّل الإشعارات على جهازك أولاً.' })
    return json(res, 200, { ok: true, ...out })
  } catch (e) {
    console.error(e)
    return json(res, 500, { error: 'فشل إرسال الإشعار' })
  }
}
