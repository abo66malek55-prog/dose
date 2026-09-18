import React, { useEffect, useState, useRef } from 'react'
import { api } from './api.js'

const CATS = [
  { key: 'hot', label: 'مشروبات ساخنة', emoji: '☕' },
  { key: 'cold', label: 'مشروبات باردة', emoji: '🧊' },
  { key: 'dessert', label: 'حلويات', emoji: '🍰' },
]

function AdOverlay({ ads, onClose }) {
  const [idx, setIdx] = useState(0)
  const [count, setCount] = useState(5)

  useEffect(() => {
    if (ads.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 6000)
    return () => clearInterval(t)
  }, [ads.length])

  useEffect(() => {
    const t = setInterval(() => setCount((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  if (!ads.length) return null
  const ad = ads[idx]

  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-media">
        {ad.image_url ? (
          <img src={ad.image_url} alt={ad.title} onError={(e) => (e.target.style.display = 'none')} />
        ) : null}
        <div className="ad-fallback">☕</div>
      </div>
      <div className="ad-content">
        {ad.discount_text ? <span className="ad-discount">{ad.discount_text}</span> : null}
        <h2>{ad.title}</h2>
        {ad.subtitle ? <p className="ad-subtitle">{ad.subtitle}</p> : null}
        {ad.body ? <p className="ad-body">{ad.body}</p> : null}
        <div className="ad-actions">
          <button className="btn btn-primary" onClick={onClose}>اطلب الآن ☕</button>
          {count > 0 ? (
            <button className="btn btn-ghost" onClick={onClose}>تخطي ({count})</button>
          ) : (
            <button className="btn btn-ghost" onClick={onClose}>إغلاق ✕</button>
          )}
        </div>
        {ads.length > 1 ? <div className="ad-dots">{ads.map((_, i) => <span key={i} className={i === idx ? 'on' : ''} />)}</div> : null}
      </div>
    </div>
  )
}

function ProductCard({ p, selected, onSelect }) {
  const [imgOk, setImgOk] = useState(true)
  const cat = CATS.find((c) => c.key === p.category)
  return (
    <button className={`product-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="product-img">
        {p.image_url && imgOk ? (
          <img src={p.image_url} alt={p.name} onError={() => setImgOk(false)} />
        ) : (
          <span className="product-emoji">{cat ? cat.emoji : '🍽️'}</span>
        )}
        {p.points ? <span className="points-badge">+{p.points} نقطة</span> : null}
      </div>
      <div className="product-info">
        <h3>{p.name}</h3>
        {p.description ? <p>{p.description}</p> : null}
        <div className="product-bottom">
          <span className="price">{Number(p.price) ? `${p.price} ر.س` : '—'}</span>
          {!p.available ? <span className="unavailable">غير متاح</span> : null}
        </div>
      </div>
    </button>
  )
}

export default function App() {
  const [products, setProducts] = useState([])
  const [ads, setAds] = useState([])
  const [cat, setCat] = useState('hot')
  const [name, setName] = useState('')
  const [selected, setSelected] = useState(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAd, setShowAd] = useState(false)
  const [myPoints, setMyPoints] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    Promise.all([api.products(), api.ads()])
      .then(([ps, as]) => {
        setProducts(ps.filter((p) => p.available || true))
        const activeAds = as.filter((a) => a.active)
        setAds(activeAds)
        setShowAd(activeAds.length > 0)
      })
      .catch(() => setError('تعذر تحميل القائمة، حدث الصفحة'))
      .finally(() => setLoading(false))
  }, [])

  async function submitOrder() {
    setError('')
    if (!name.trim()) return setError('اكتب اسمك أولاً 🙂')
    if (!selected) return setError('اختر مشروباً من القائمة')
    setSending(true)
    try {
      const r = await api.order(name.trim(), selected.id)
      setResult(r)
      setMyPoints(r.total_points)
      setSelected(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  const visible = products.filter((p) => p.category === cat)

  return (
    <div className="app">
      {showAd && ads.length > 0 ? <AdOverlay ads={ads} onClose={() => setShowAd(false)} /> : null}

      <header className="header">
        <div className="logo">☕ dose</div>
        <div className="tagline">قهوتك بنقاط</div>
        <a className="admin-link" href="/admin" title="لوحة المدير">⚙</a>
      </header>

      <section className="hero">
        <h1>اشرب قهوتك… واجمع نقاطك ☕</h1>
        <p>اختر مشروبك المفضل، أدخل اسمك، وأرسل طلبك — كل طلب يمنحك نقاطاً تظهر فوراً على جهاز المحل.</p>
        <button className="btn btn-primary" onClick={() => menuRef.current.scrollIntoView({ behavior: 'smooth' })}>
          شاهد القائمة
        </button>
      </section>

      {ads.length > 0 && !showAd ? (
        <section className="ad-strip" onClick={() => setShowAd(true)}>
          <img src={ads[0].image_url} alt="" onError={(e) => (e.target.style.visibility = 'hidden')} />
          <div className="ad-strip-text">
            <span className="ad-discount">{ads[0].discount_text || 'عرض خاص'}</span>
            <strong>{ads[0].title}</strong>
          </div>
          <span className="ad-strip-open">التفاصيل</span>
        </section>
      ) : null}

      <main className="menu" ref={menuRef}>
        <div className="cat-tabs">
          {CATS.map((c) => (
            <button key={c.key} className={`cat-tab ${cat === c.key ? 'on' : ''}`} onClick={() => setCat(c.key)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">جارٍ التحميل…</div>
        ) : (
          <div className="grid">
            {visible.map((p) => (
              <ProductCard key={p.id} p={p} selected={selected && selected.id === p.id} onSelect={() => setSelected(p)} />
            ))}
            {!visible.length ? <div className="empty">لا توجد أصناف في هذا القسم بعد</div> : null}
          </div>
        )}
      </main>

      <div className="order-bar">
        <div className="order-bar-inner">
          <input
            className="input"
            placeholder="اكتب اسمك…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
          <button className="btn btn-primary" onClick={submitOrder} disabled={sending}>
            {sending ? 'جارٍ الإرسال…' : selected ? `أرسل الطلب: ${selected.name}` : 'أرسل الطلب'}
          </button>
        </div>
        {myPoints !== null && !result ? <div className="order-note">رصيد نقاطك: {myPoints} نقطة</div> : null}
        {error ? <div className="order-error">{error}</div> : null}
      </div>

      {result ? (
        <div className="modal-backdrop" onClick={() => setResult(null)}>
          <div className="modal success" onClick={(e) => e.stopPropagation()}>
            <div className="success-emoji">🎉</div>
            <h2>تم استلام طلبك!</h2>
            <p>أهلاً <strong>{name.trim()}</strong>، طلبك <strong>{result.product_name}</strong> قيد التحضير.</p>
            <p className="points-line">
              حصلت على <span className="points-big">+{result.points_earned}</span> نقطة
              <br />
              رصيدك الآن: <strong>{result.total_points}</strong> نقطة
            </p>
            <button className="btn btn-primary" onClick={() => setResult(null)}>تم</button>
          </div>
        </div>
      ) : null}

      <footer className="footer">dose © 2026 — كل طلب يقربك من قهوتك المجانية ☕</footer>
    </div>
  )
}
