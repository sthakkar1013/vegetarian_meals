import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'khana123'

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState(false)
  const [tab, setTab] = useState('meals')
  const [meals, setMeals] = useState([])
  const [orders, setOrders] = useState([])
  const [settings, setSettings] = useState({ daily_limit: 4, base_price: 12, currency: '£' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_auth')
    if (saved === 'true') { setLoggedIn(true); fetchAll() }
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [mealsRes, ordersRes, settingsRes] = await Promise.all([
        fetch('/api/meals'),
        fetch('/api/orders'),
        fetch('/api/settings')
      ])
      setMeals(await mealsRes.json())
      setOrders(await ordersRes.json())
      setSettings(await settingsRes.json())
    } catch {
      showToast('Failed to load data.', 'error')
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true)
      setLoginErr(false)
      sessionStorage.setItem('admin_auth', 'true')
      fetchAll()
    } else {
      setLoginErr(true)
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_auth')
    setLoggedIn(false)
    setPassword('')
  }

  // ── MEAL ACTIONS ──────────────────────────────────────────────────────────

  async function saveMeal(meal) {
    setSaving(true)
    try {
      const { id, ...fields } = meal
      const res = await fetch(`/api/meals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      })
      if (!res.ok) throw new Error()
      showToast('Meal saved ✓')
    } catch {
      showToast('Failed to save meal.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMeal(id) {
    if (!confirm('Remove this meal?')) return
    try {
      await fetch(`/api/meals/${id}`, { method: 'DELETE' })
      setMeals(prev => prev.filter(m => m.id !== id))
      showToast('Meal removed ✓')
    } catch {
      showToast('Failed to remove meal.', 'error')
    }
  }

  async function addMeal() {
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Meal',
          type: 'Vegetarian',
          description: 'Describe your meal here.',
          components: ['Rice', 'Sabzi', 'Dal', 'Salad', 'Sweet'],
          price: settings.base_price || 12,
          sold: 0,
          special: false,
          enabled: true
        })
      })
      const newMeal = await res.json()
      setMeals(prev => [...prev, newMeal])
      showToast('New meal added ✓')
    } catch {
      showToast('Failed to add meal.', 'error')
    }
  }

  function updateLocalMeal(id, field, value) {
    setMeals(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  // ── SETTINGS ─────────────────────────────────────────────────────────────

  async function saveSettings() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error()
      showToast('Settings saved ✓')
    } catch {
      showToast('Failed to save settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function resetDay() {
    if (!confirm('Reset all sold counts and orders for a new day? This cannot be undone.')) return
    try {
      await fetch('/api/reset', { method: 'POST' })
      await fetchAll()
      showToast('New day reset complete ✓')
    } catch {
      showToast('Reset failed.', 'error')
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  if (!loggedIn) {
    return (
      <>
        <Head><title>Admin — Ghar Ka Khana</title></Head>
        <div className="login-wrap">
          <div className="login-card">
            <h2>Admin Login</h2>
            <p>Enter your password to manage today's menu.</p>
            {loginErr && <div className="login-err">Incorrect password. Please try again.</div>}
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button className="save-btn orange" style={{ width: '100%', marginTop: 0 }} onClick={handleLogin}>
              Login
            </button>
            <Link href="/" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
              ← Back to menu
            </Link>
          </div>
        </div>
      </>
    )
  }

  const totalRevenue = orders.reduce((sum, o) => {
    const meal = meals.find(m => m.name === o.meal_name)
    return sum + (meal ? meal.price : 0)
  }, 0)

  return (
    <>
      <Head><title>Admin Dashboard — Ghar Ka Khana</title></Head>

      <nav>
        <span className="nav-brand">Ghar Ka <span>Khana</span></span>
        <div className="nav-links">
          <Link href="/" className="nav-btn">View Menu</Link>
          <button className="nav-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main>
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>🍳 Kitchen Dashboard</h2>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{today}</span>
          </div>

          <div className="tab-bar">
            <button className={tab === 'meals' ? 'active' : ''} onClick={() => setTab('meals')}>
              Today's Meals
            </button>
            <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
              Orders & Feedback ({orders.length})
            </button>
            <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
              Settings
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {/* ── MEALS TAB ── */}
              {tab === 'meals' && (
                <div>
                  <div className="admin-section-title">Manage Today's Meals</div>
                  {meals.map(meal => {
                    const components = Array.isArray(meal.components)
                      ? meal.components.join(', ')
                      : meal.components || ''

                    return (
                      <div key={meal.id} className="meal-edit-row">
                        <div className="meal-edit-header">
                          <span>
                            {meal.name}
                            {meal.special && <span className="special-badge">Special</span>}
                          </span>
                          <div className="meal-edit-actions">
                            <label className="toggle-label">
                              <input
                                type="checkbox"
                                checked={!!meal.enabled}
                                onChange={() => {
                                  updateLocalMeal(meal.id, 'enabled', !meal.enabled)
                                  saveMeal({ ...meal, enabled: !meal.enabled })
                                }}
                              />
                              Enabled
                            </label>
                            <button className="del-btn" onClick={() => deleteMeal(meal.id)}>Remove</button>
                          </div>
                        </div>

                        <div className="edit-grid">
                          <div className="edit-field">
                            <label>Meal Name</label>
                            <input
                              type="text"
                              value={meal.name}
                              onChange={e => updateLocalMeal(meal.id, 'name', e.target.value)}
                            />
                          </div>
                          <div className="edit-field">
                            <label>Price ({settings.currency})</label>
                            <input
                              type="number"
                              value={meal.price}
                              min="1"
                              onChange={e => updateLocalMeal(meal.id, 'price', Number(e.target.value))}
                            />
                          </div>
                          <div className="edit-field full">
                            <label>Description</label>
                            <textarea
                              value={meal.description || ''}
                              onChange={e => updateLocalMeal(meal.id, 'description', e.target.value)}
                            />
                          </div>
                          <div className="edit-field full">
                            <label>Components (comma separated)</label>
                            <input
                              type="text"
                              value={components}
                              onChange={e => updateLocalMeal(meal.id, 'components', e.target.value.split(',').map(s => s.trim()))}
                            />
                          </div>
                          <div className="edit-field">
                            <label>Sold Today</label>
                            <input
                              type="number"
                              value={meal.sold || 0}
                              min="0"
                              onChange={e => updateLocalMeal(meal.id, 'sold', Number(e.target.value))}
                            />
                          </div>
                          <div className="edit-field">
                            <label>Meal Type</label>
                            <select
                              value={meal.special ? 'special' : 'regular'}
                              onChange={e => updateLocalMeal(meal.id, 'special', e.target.value === 'special')}
                            >
                              <option value="regular">Regular</option>
                              <option value="special">Weekend Special</option>
                            </select>
                          </div>
                        </div>

                        <button
                          className="save-btn"
                          onClick={() => saveMeal(meal)}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )
                  })}

                  <button className="add-meal-btn" onClick={addMeal}>
                    + Add New Meal
                  </button>
                </div>
              )}

              {/* ── ORDERS TAB ── */}
              {tab === 'orders' && (
                <div>
                  <div className="admin-section-title">Today's Orders</div>
                  {orders.length === 0 ? (
                    <div className="empty">No orders yet today.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Time</th>
                            <th>Meal</th>
                            <th>Customer</th>
                            <th>Phone</th>
                            <th>Notes / Customisation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order, i) => {
                            const meal = meals.find(m => m.name === order.meal_name)
                            const isSpecial = meal?.special
                            const time = new Date(order.created_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit', minute: '2-digit'
                            })
                            return (
                              <tr key={order.id}>
                                <td>{i + 1}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>{time}</td>
                                <td>
                                  <span className={`order-tag ${isSpecial ? 'special' : 'regular'}`}>
                                    {order.meal_name}
                                  </span>
                                </td>
                                <td>{order.customer_name}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>{order.phone}</td>
                                <td className="note-cell">{order.notes || '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="orders-summary">
                    📊 Total orders: <strong style={{ color: 'var(--text)' }}>{orders.length}</strong>
                    &nbsp;·&nbsp;
                    Revenue: <strong style={{ color: 'var(--green)' }}>{settings.currency}{totalRevenue}</strong>
                  </div>
                </div>
              )}

              {/* ── SETTINGS TAB ── */}
              {tab === 'settings' && (
                <div>
                  <div className="admin-section-title">Daily Settings</div>

                  <div className="settings-row">
                    <label>Maximum portions per meal per day</label>
                    <input
                      type="number"
                      value={settings.daily_limit}
                      min="1"
                      max="50"
                      onChange={e => setSettings(s => ({ ...s, daily_limit: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="settings-row">
                    <label>Default meal price ({settings.currency})</label>
                    <input
                      type="number"
                      value={settings.base_price}
                      min="1"
                      onChange={e => setSettings(s => ({ ...s, base_price: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="settings-row">
                    <label>Currency symbol</label>
                    <input
                      type="text"
                      value={settings.currency}
                      maxLength="3"
                      style={{ width: 80, textAlign: 'center' }}
                      onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
                    />
                  </div>

                  <button className="save-btn" onClick={saveSettings} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>

                  <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(196,149,106,0.2)' }}>
                    <div className="admin-section-title">New Day Reset</div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
                      Run this every morning to reset all sold counts to zero and clear yesterday's orders.
                      This allows fresh orders for the new day.
                    </p>
                    <button className="save-btn danger" onClick={resetDay}>
                      🔄 Reset for New Day
                    </button>
                  </div>

                  <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(196,149,106,0.2)' }}>
                    <div className="admin-section-title">Change Admin Password</div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '0.5rem', lineHeight: 1.6 }}>
                      To change your admin password, update the <code>NEXT_PUBLIC_ADMIN_PASSWORD</code> environment
                      variable in your Vercel project settings and redeploy.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  )
}
