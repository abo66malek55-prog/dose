import webpush from 'web-push'
import { sbList } from './db.mjs'

let configured = false
function ensureConfigured() {
  if (configured) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:owner@dose.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  configured = true
}

export async function sendPushToOwners({ title, body, url = '/admin' }) {
  ensureConfigured()
  const subs = await sbList('push_subscriptions', 'select=*')
  const payload = JSON.stringify({ title, body, url })
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: s.keys },
        payload,
        { TTL: 3600 }
      )
    )
  )
  // Prune subscriptions the push service says are gone (404/410)
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'rejected' && r.reason && (r.reason.statusCode === 404 || r.reason.statusCode === 410)) {
      try {
        await fetch(`${process.env.SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=${encodeURIComponent(subs[i].endpoint)}`, {
          method: 'DELETE',
          headers: {
            apikey: process.env.SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          },
        })
      } catch (e) {
        console.error('prune subscription failed', e)
      }
    }
  }
  const sent = results.filter((r) => r.status === 'fulfilled').length
  return { sent, total: subs.length }
}
