import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const [meals, setMeals] = useState([])
  const [settings, setSettings] = useState({ daily_limit: 4, base_price: 25, currency: '$' })
  const [loading, setLoading] = useState(true)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', notes: '' })

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [mealsRes, settingsRes] = await Promise.all([
        fetch('/api/meals'),
        fetch('/api/settings')
      ])
      const mealsData = await mealsRes.json()
      const settingsData = await settingsRes.json()
      setMeals(mealsData)
      setSettings(settingsData)
    } catch (e) {
      showToast('Failed to load meals. Please refresh.', 'error')
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function submitOrder() {
    if (!form.name.trim() || !form.phone.trim()) {
      showToast('Please enter your name and phone number.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_id: selectedMeal.id,
          meal_name: selectedMeal.name,
          customer_name: form.name.trim(),
          phone: form.phone.trim(),
          notes: form.notes.trim()
        })
      })
      if (!res.ok) throw new Error()
      setSelectedMeal(null)
      setShowSuccess(true)
      setForm({ name: '', phone: '', notes: '' })
      fetchData()
    } catch {
      showToast('Order failed. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const enabledMeals = meals.filter(m => m.enabled)
  const minPrice = enabledMeals.length ? Math.min(...enabledMeals.map(m => m.price)) : settings.base_price

  return (
    <>
      <Head>
        <title>Ghar Ka Khana — Fresh Indian Meals</title>
        <meta name="description" content="Fresh home-cooked Indian vegetarian meals. Limited portions daily." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav>
        <span className="nav-brand">Ghar Ka <span>Khana</span></span>
        <div className="nav-links">
          <Link href="/" className="nav-btn active">Today's Menu</Link>
          <Link href="/admin" className="nav-btn">Admin</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-tag">🍛 Fresh Every Day</div>
          <h1>Home-cooked <em>Indian meals</em>,<br />made with love</h1>
          <p>Each meal is freshly prepared daily. Limited portions — order early to avoid disappointment.</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-num">{enabledMeals.length}</span>
              <span className="stat-label">Meals Today</span>
            </div>
            <div className="stat">
              <span className="stat-num">{settings.daily_limit}</span>
              <span className="stat-label">Per Meal</span>
            </div>
            <div className="stat">
              <span className="stat-num">{settings.currency}{minPrice}</span>
              <span className="stat-label">From</span>
            </div>
          </div>
        </div>
      </div>

      <main>
        <div className="section-header">
          <div className="date-badge">📅 {today}</div>
          <h2>Today's Menu</h2>
          <p>All meals include rice, sabzi, dal or curry, a side of salad or raita, and a small sweet or snack.</p>
        </div>

        {loading ? (
          <div className="loading">Loading today's menu...</div>
        ) : enabledMeals.length === 0 ? (
          <div className="empty">No meals available today. Check back soon! 🙏</div>
        ) : (
          <div className="meals-grid">
            {enabledMeals.map(meal => {
              const remaining = settings.daily_limit - (meal.sold || 0)
              const soldOut = remaining <= 0
              const low = remaining === 1 && !soldOut
              const components = Array.isArray(meal.components)
                ? meal.components
                : (meal.components || '').split(',').map(s => s.trim())

              return (
                <div key={meal.id} className="meal-card">
                  <div className="meal-card-header">
                    <div className="meal-type">{meal.type || 'Vegetarian'}</div>
                    <div className="meal-name">
                      {meal.name}
                      {meal.special && <span className="special-badge">Special</span>}
                    </div>
                    <div className="meal-price">{settings.currency}{meal.price}</div>
                  </div>
                  <div className="meal-body">
                    <p className="meal-desc">{meal.description}</p>
                    <div className="meal-components">
                      {components.map((c, i) => (
                        <span key={i} className="component-tag">{c}</span>
                      ))}
                    </div>
                    <div className="availability">
                      <span className={`avail-count ${low ? 'low' : ''} ${soldOut ? 'sold' : ''}`}>
                        {soldOut
                          ? <strong>Sold out</strong>
                          : low
                          ? <strong>Only 1 left!</strong>
                          : <strong>{remaining} available</strong>
                        }
                      </span>
                      <button
                        className="order-btn"
                        disabled={soldOut}
                        onClick={() => {
                          setSelectedMeal(meal)
                          setForm({ name: '', phone: '', notes: '' })
                        }}
                      >
                        {soldOut ? 'Sold Out' : 'Order Now'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="footer-note">
          🌿 All meals are freshly prepared at home with quality ingredients. Vegetarian.<br />
          Allergen information available on request. Collection or local delivery — contact to arrange.
        </div>
      </main>

      {/* ORDER MODAL */}
      {selectedMeal && (
        <div className="modal-overlay" onClick={e => { if (e.target.classList.contains('modal-overlay')) setSelectedMeal(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order — {selectedMeal.name}</h3>
              <button className="modal-close" onClick={() => setSelectedMeal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-meal-info">
                {settings.currency}{selectedMeal.price} ·{' '}
                {(Array.isArray(selectedMeal.components)
                  ? selectedMeal.components
                  : (selectedMeal.components || '').split(',').map(s => s.trim())
                ).join(' · ')}
              </div>
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="07700 000 000"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Customisation Notes</label>
                <textarea
                  placeholder="e.g. less spicy, no onion, extra raita..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setSelectedMeal(null)}>Cancel</button>
              <button className="btn-submit" onClick={submitOrder} disabled={submitting}>
                {submitting ? 'Placing order...' : `Confirm Order — ${settings.currency}${selectedMeal.price}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {showSuccess && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="success-msg">
              <div className="success-icon">🎉</div>
              <h3>Order Placed!</h3>
              <p>Thank you! Your order has been received. We'll be in touch to confirm collection or delivery details.</p>
              <button className="btn-submit" style={{ width: '100%' }} onClick={() => setShowSuccess(false)}>
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </>
  )
}
