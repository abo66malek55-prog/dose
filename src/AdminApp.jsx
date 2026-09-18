import React, { useEffect, useState } from 'react'
import { api, fileToDataUrl } from './api.js'

const CATS = [
  { key: 'hot', label: 'ساخنة ☕' },
  { key: 'cold', label: 'باردة 🧊' },
  { key: 'dessert', label: 'حلويات 🍰' },
]

const EMPTY_PRODUCT = { name: '', category: 'hot', price: '', points: '', description: '', image_url: '', available: true }
const EMPTY_AD = { title: '', subtitle: '', body: '', discount_text: '', image_url: '', active: true }

function Login({ onOk }) {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function go() {
    setBusy(true)
    setErr('')
    try {
      await api.login(pwd)
      sessionStorage.setItem('dose_admin_pwd', pwd)
      onOk()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="logo">☕ dose</div>
        <h2>لوحة المدير</h2>
        <input
          className="input"
          type="password"
          placeholder="كلمة مرور المدير"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
        />
        {err ? <div className="order-error">{err}</div> : null}
        <button className="btn btn-primary" onClick={go} disabled={busy}>{busy ? 'جارٍ الدخول…' : 'دخول'}</button>
        <a className="muted-link" href="/">← عودة للصفحة الرئيسية</a>
      </div>
    </div>
  )
}

function ProductsTab() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [editingId, setEditingId] = useState(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setItems(await api.products())
  }
  useEffect(() => { load() }, [])

  async function pickImage(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setMsg('جارٍ معالجة الصورة…')
    const dataUrl = await fileToDataUrl(f)
    setForm((s) => ({ ...s, image_url: dataUrl }))
    setMsg('')
  }

  async function save() {
    setBusy(true)
    setMsg('')
    try {
      if (editingId) await api.updateProduct({ ...form, id: editingId })
      else await api.saveProduct(form)
      setForm(EMPTY_PRODUCT)
      setEditingId(null)
      await load()
      setMsg('✅ تم الحفظ')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (!confirm('حذف هذا الصنف؟')) return
    await api.deleteProduct(id)
    await load()
  }

  function edit(p) {
    setEditingId(p.id)
    setForm({
      name: p.name, category: p.category, price: p.price, points: p.points,
      description: p.description || '', image_url: p.image_url || '', available: p.available,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="card">
        <h3>{editingId ? 'تعديل صنف' : 'إضافة صنف جديد'}</h3>
        <div className="form-grid">
          <input className="input" placeholder="اسم الصنف" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <input className="input" type="number" min="0" step="0.5" placeholder="السعر (ر.س)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className="input" type="number" min="0" placeholder="النقاط" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} />
          <input className="input" placeholder="وصف قصير (اختياري)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="btn btn-ghost file-btn">
            📷 اختر صورة
            <input type="file" accept="image/*" hidden onChange={pickImage} />
          </label>
          <label className="check-line">
            <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
            متاح للبيع
          </label>
        </div>
        {form.image_url ? <img className="thumb-preview" src={form.image_url} alt="" /> : null}
        {msg ? <div className="order-note">{msg}</div> : null}
        <div className="row">
          <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '…' : editingId ? 'حفظ التعديل' : 'إضافة'}</button>
          {editingId ? <button className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(EMPTY_PRODUCT) }}>إلغاء</button> : null}
        </div>
      </div>

      <div className="items-list">
        {items.map((p) => (
          <div className="item-row" key={p.id}>
            <div className="item-img">
              {p.image_url ? <img src={p.image_url} alt="" /> : <span>☕</span>}
            </div>
            <div className="item-main">
              <strong>{p.name}</strong>
              <span>{CATS.find((c) => c.key === p.category)?.label} · {p.price} ر.س · {p.points} نقطة {p.available ? '' : '· غير متاح'}</span>
            </div>
            <div className="row">
              <button className="btn btn-small" onClick={() => edit(p)}>تعديل</button>
              <button className="btn btn-small danger" onClick={() => remove(p.id)}>حذف</button>
            </div>
          </div>
        ))}
        {!items.length ? <div className="empty">لا توجد أصناف بعد — أضف أول صنف من الأعلى</div> : null}
      </div>
    </div>
  )
}

function AdsTab() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY_AD)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() { setItems(await api.ads()) }
  useEffect(() => { load() }, [])

  async function pickImage(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const dataUrl = await fileToDataUrl(f, 1400, 0.85)
    setForm((s) => ({ ...s, image_url: dataUrl }))
  }

  async function save() {
    setBusy(true)
    setMsg('')
    try {
      await api.saveAd(form)
      setForm(EMPTY_AD)
      await load()
      setMsg('✅ تمت إضافة الإعلان — سيظهر بملء الشاشة للزبائن')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggle(a) {
    await api.updateAd({ id: a.id, active: !a.active })
    await load()
  }
  async function remove(id) {
    if (!confirm('حذف هذا الإعلان؟')) return
    await api.deleteAd(id)
    await load()
  }

  return (
    <div>
      <div className="card">
        <h3>إعلان جديد بملء الشاشة</h3>
        <p className="hint">صورة احترافية لنوع من المشروبات + نص العرض والخصم — كل المعلومات في صورة واحدة تظهر عند فتح الموقع.</p>
        <div className="form-grid">
          <input className="input" placeholder="العنوان الرئيسي" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input" placeholder="نص العرض / الخصم (مثال: خصم 50%)" value={form.discount_text} onChange={(e) => setForm({ ...form, discount_text: e.target.value })} />
          <input className="input" placeholder="عنوان فرعي (اختياري)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <input className="input" placeholder="تفاصيل العرض (اختياري)" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <label className="btn btn-ghost file-btn">
            🖼️ اختر صورة الإعلان
            <input type="file" accept="image/*" hidden onChange={pickImage} />
          </label>
          <label className="check-line">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            مفعّل
          </label>
        </div>
        {form.image_url ? <img className="thumb-preview ad-preview" src={form.image_url} alt="" /> : null}
        {msg ? <div className="order-note">{msg}</div> : null}
        <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? '…' : 'نشر الإعلان'}</button>
      </div>

      <div className="items-list">
        {items.map((a) => (
          <div className="item-row" key={a.id}>
            <div className="item-img ad-thumb">{a.image_url ? <img src={a.image_url} alt="" /> : <span>🖼️</span>}</div>
            <div className="item-main">
              <strong>{a.title}</strong>
              <span>{a.discount_text ? `${a.discount_text} · ` : ''}{a.active ? 'مفعّل ✅' : 'معطّل ⛔'}</span>
            </div>
            <div className="row">
              <button className="btn btn-small" onClick={() => toggle(a)}>{a.active ? 'تعطيل' : 'تفعيل'}</button>
              <button className="btn btn-small danger" onClick={() => remove(a.id)}>حذف</button>
            </div>
          </div>
        ))}
        {!items.length ? <div className="empty">لا توجد إعلانات بعد</div> : null}
      </div>
    </div>
  )
}

function OrdersTab() {
  const [items, setItems] = useState([])
  useEffect(() => {
    api.orders().then(setItems).catch(() => {})
  }, [])
  return (
    <div className="items-list">
      {items.map((o) => (
        <div className="item-row" key={o.id}>
          <div className="item-main">
            <strong>{o.customer_name}</strong>
            <span>{o.product_name} · +{o.points_earned} نقطة · الرصيد {o.total_points} · {new Date(o.created_at).toLocaleString('ar')}</span>
          </div>
        </div>
      ))}
      {!items.length ? <div className="empty">لا توجد طلبات بعد</div> : null}
    </div>
  )
}

function CustomersTab() {
  const [items, setItems] = useState([])
  useEffect(() => {
    api.customers().then(setItems).catch(() => {})
  }, [])
  return (
    <div className="items-list">
      {items.map((c) => (
        <div className="item-row" key={c.id}>
          <div className="item-avatar">{c.name.slice(0, 1)}</div>
          <div className="item-main">
            <strong>{c.name}</strong>
            <span>{c.points} نقطة</span>
          </div>
          <div className="points-pill">{c.points}</div>
        </div>
      ))}
      {!items.length ? <div className="empty">لا يوجد زبائن بعد</div> : null}
    </div>
  )
}

async function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i)
  return output
}

function NotificationsTab() {
  const [state, setState] = useState('')
  const [busy, setBusy] = useState(false)

  async function enable() {
    setBusy(true)
    setState('')
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return setState('❌ هذا المتصفح لا يدعم الإشعارات. استخدم Chrome على أندرويد أو الكمبيوتر.')
      }
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return setState('❌ لم يتم منح صلاحية الإشعارات — اسمح بالإشعارات من إعدادات المتصفح.')

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        const { publicKey } = await api.vapidPublicKey()
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: await urlBase64ToUint8Array(publicKey),
        })
      }
      await api.subscribe(sub.toJSON())
      setState('✅ تم تفعيل الإشعارات على هذا الجهاز! ستصلك إشعارات فورية مع كل طلب جديد.')
    } catch (e) {
      setState('❌ ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  async function test() {
    setBusy(true)
    setState('')
    try {
      const r = await api.testPush()
      setState(r.ok ? `✅ أُرسل إشعار تجريبي (${r.sent} جهاز)` : r.message || 'لم يُرسل')
    } catch (e) {
      setState('❌ ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <h3>🔔 الإشعارات الفورية</h3>
      <p className="hint">
        افتح هذه الصفحة على <strong>هاتف صاحب المحل</strong> واضغط "تفعيل الإشعارات" — بعد ذلك عند إرسال أي زبون طلباً
        سيصلك إشعار فوري يعرض اسم الزبون والمنتج والنقاط التي حصل عليها ورصيده الجديد.
      </p>
      <p className="hint">💡 نصيحة: على أندرويد استخدم "إضافة إلى الشاشة الرئيسية" من قائمة Chrome لتثبيت المنصة كتطبيق.</p>
      <div className="row">
        <button className="btn btn-primary" onClick={enable} disabled={busy}>تفعيل الإشعارات على هذا الجهاز</button>
        <button className="btn btn-ghost" onClick={test} disabled={busy}>إرسال إشعار تجريبي</button>
      </div>
      {state ? <div className="order-note">{state}</div> : null}
    </div>
  )
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('dose_admin_pwd'))
  const [tab, setTab] = useState('products')

  if (!authed) return <Login onOk={() => setAuthed(true)} />

  const tabs = [
    { key: 'products', label: 'الأصناف ☕' },
    { key: 'ads', label: 'الإعلانات 🖼️' },
    { key: 'orders', label: 'الطلبات 🧾' },
    { key: 'customers', label: 'الزبائن 👥' },
    { key: 'notify', label: 'الإشعارات 🔔' },
  ]

  return (
    <div className="app admin">
      <header className="header">
        <div className="logo">☕ dose — لوحة المدير</div>
        <button className="btn btn-ghost btn-small" onClick={() => { sessionStorage.removeItem('dose_admin_pwd'); setAuthed(false) }}>
          خروج
        </button>
      </header>
      <div className="cat-tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`cat-tab ${tab === t.key ? 'on' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      <main className="admin-main">
        {tab === 'products' ? <ProductsTab /> : null}
        {tab === 'ads' ? <AdsTab /> : null}
        {tab === 'orders' ? <OrdersTab /> : null}
        {tab === 'customers' ? <CustomersTab /> : null}
        {tab === 'notify' ? <NotificationsTab /> : null}
      </main>
    </div>
  )
}
