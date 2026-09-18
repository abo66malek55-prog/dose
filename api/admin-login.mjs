import { json, isAdmin } from './_lib/db.mjs'

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
  if (isAdmin(req)) return json(res, 200, { ok: true })
  return json(res, 401, { error: 'كلمة المرور غير صحيحة' })
}
