import { json } from './_lib/db.mjs'

export default async function handler(req, res) {
  return json(res, 200, { publicKey: process.env.VAPID_PUBLIC_KEY || '' })
}
