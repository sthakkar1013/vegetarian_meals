import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const ADMIN_PASSWORD    = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Calcutta@78'
const SESSION_TIMEOUT_MS = 15 * 60 * 1000  // 15 min inactivity → auto logout
const SESSION_WARNING_MS = 13 * 60 * 1000  // warn 2 min before expiry

export default function Admin() {
  const [loggedIn, setLoggedIn]         = useState(false)
  const [password, setPassword]         = useState('')
  const [loginErr, setLoginErr]         = useState(false)
  const [tab, setTab]                   = useState('meals')
  const [meals, setMeals]               = useState([])
  const [orders, setOrders]             = useState([])
  const [settings, setSettings]         = useState({ daily_limit: 4, base_price: 12, currency: '£' })
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [addingMeal, setAddingMeal]     = useState(false)
  const [toast, setToast]               = useState(null)
  const [sessionWarning, setSessionWarning] = useState(false)
  const timeoutRef  = useRef(null)
  const warningRef  = useRef(null)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // ── SESSION TIMEOUT ───────────────────────────────────────────────────────

  const doLogout = useCallback((reason) => {
    clearTimeout(timeoutRef.current)
    clearTimeout(warningRef.current)
    sessionStorage.removeItem('admin_auth')
    sessionStorage.removeItem('admin_login_time')
    setLoggedIn(false)
    setPassword('')
    setSessionWarning(false)
    if (reason === 'timeout') showToast('Session expired — please log in again.', 'error', 6000)
  }, [])

  const resetSessionTimer = useCallback(() => {
    clearTimeout(timeoutRef.current)
    clearTimeout(warningRef.current)
    setSessionWarning(false)
    sessionStorage.setItem('admin_login_time', Date.now().toString())
    warningRef.current = setTimeout(() => setSessionWarning(true), SESSION_WARNING_MS)
    timeoutRef.current = setTimeout(() => doLogout('timeout'), SESSION_TIMEOUT_MS)
  }, [doLogout])

  useEffect(() => {
    if (!loggedIn) return
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetSessionTimer))
    resetSessionTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetSessionTimer))
      clearTimeout(timeoutRef.current)
      clearTimeout(warningRef.current)
    }
  }, [loggedIn, resetSessionTimer])

  // On mount — restore session only if not expired
  useEffect(() => {
    const saved     = sessionStorage.getItem('admin_auth')
    const loginTime = parseInt(sessionStorage.getItem('admin_login_time') || '0')
    if (saved === 'true' && Date.now() - loginTime < SESSION_TIMEOUT_MS) {
      setLoggedIn(true)
      fetchAll()
    } else {
      sessionStorage.removeItem('admin_auth')
      sessionStorage.removeItem('admin_login_time')
      setLoading(false)
    }
  }, [])

  // ── TOAST ─────────────────────────────────────────────────────────────────

  function showToast(msg, type = 'success', duration = 4000) {
    setToast({ msg, type })
    setTimeout(() => setToast(null), duration)
  }

  // ── AUTH ──────────────────────────────────────────────────────────────────

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true')
      sessionStorage.setItem('admin_login_time', Date.now().toString())
      setLoggedIn(true)
      setLoginErr(false)
      fetchAll()
    } else {
      setLoginErr(true)
    }
  }

  // ── DATA ──────────────────────────────────────────────────────────────────

  async function fetchAll() {
    setLoading(true)
    try {
      const [mr, or, sr] = await Promise.all([
        fetch('/api/meals'),
        fetch('/api/orders'),
        fetch('/api/settings'),
      ])
      const [md, od, sd] = await Promise.all([mr.json(), or.json(), sr.json()])

      if (!mr.ok) { showToast('Meals error: ' + (md.error || mr.status), 'error', 8000); return }
      if (!or.ok) { showToast('Orders error: ' + (od.error || or.status), 'error', 8000); return }

      setMeals(Array.isArray(md) ? md : [])
      setOrders(Array.isArray(od) ? od : [])
      if (sd && !sd.error) setSettings(sd)
    } catch (err) {
      showToast('Network error loading data: ' + err.message, 'error', 8000)
    } finally {
      setLoading(false)
    }
  }

  // ── MEAL ACTIONS ──────────────────────────────────────────────────────────

  async function addMeal() {
    if (addingMeal) return
    setAddingMeal(true)
    try {
      const res = await fetch('/api/meals', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        'New Meal — click Save Changes to edit',
          type:        'Vegetarian',
          description: 'Add your meal description here.',
          components:  ['Rice', 'Sabzi', 'Dal', 'Salad', 'Sweet'],
          price:       Number(settings.base_price) || 12,
          sold:        0,
          special:     false,
          enabled:     true,
        }),
      })
      let data = {}
      try { data = await res.json() } catch {}

      if (!res.ok) {
        const msg = data.error || data.message || ('HTTP ' + res.status)
        showToast('Add meal failed: ' + msg, 'error', 10000)
        console.error('addMeal error', res.status, data)
        return
      }
      setMeals(prev => [...prev, data])
      showToast('New meal added — edit and save it below ✓', 'success', 5000)
    } catch (err) {
      showToast('Network error: ' + err.message, 'error', 10000)
      console.error('addMeal exception', err)
    } finally {
      setAddingMeal(false)
    }
  }

  async function saveMeal(meal) {
    setSaving(true)
    try {
      const { id, created_at, ...fields } = meal
      if (typeof fields.components === 'string') {
        fields.components = fields.components.split(',').map(s => s.trim()).filter(Boolean)
      }
      const res = await fetch('/api/meals/' + id, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(fields),
      })
      let data = {}
      try { data = await res.json() } catch {}
      if (!res.ok) {
        showToast('Save failed: ' + (data.error || res.status), 'error', 8000)
        return
      }
      showToast('Saved ✓')
    } catch (err) {
      showToast('Network error saving: ' + err.message, 'error', 8000)
    } finally {
      setSaving(false)
    }
  }

  async function deleteMeal(id) {
    if (!confirm('Remove this meal from the menu?')) return
    try {
      const res = await fetch('/api/meals/' + id, { method: 'DELETE' })
      if (!res.ok) { showToast('Failed to remove meal.', 'error'); return }
      setMeals(prev => prev.filter(m => m.id !== id))
      showToast('Meal removed ✓')
    } catch (err) {
      showToast('Network error: ' + err.message, 'error')
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
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      })
      let data = {}
      try { data = await res.json() } catch {}
      if (!res.ok) {
        showToast('Settings error: ' + (data.error || res.status), 'error', 8000)
        return
      }
      showToast('Settings saved ✓')
    } catch (err) {
      showToast('Network error saving settings: ' + err.message, 'error', 8000)
    } finally {
      setSaving(false)
    }
  }

  async function resetDay() {
    if (!confirm('Reset all sold counts and clear all orders for a new day?\nThis cannot be undone.')) return
    try {
      const res = await fetch('/api/reset', { method: 'POST' })
      if (!res.ok) { showToast('Reset failed.', 'error'); return }
      await fetchAll()
      showToast('New day reset complete ✓')
    } catch (err) {
      showToast('Network error: ' + err.message, 'error')
    }
  }

  // ── LOGIN PAGE ────────────────────────────────────────────────────────────

  if (!loggedIn) {
    return (
      <>
        <Head><title>Admin Login — Ghar Ka Khana</title></Head>
        <div className="login-wrap">
          <div className="login-card">
            <h2>Admin Login</h2>
            <p>Session auto-expires after 15 minutes of inactivity.</p>
            {loginErr && <div className="login-err">Incorrect password. Please try again.</div>}
            {toast    && <div className="login-err" style={{ background: 'rgba(192,57,43,0.06)' }}>{toast.msg}</div>}
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                autoFocus
                onChange={e => { setPassword(e.target.value); setLoginErr(false) }}
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

  // ── ADMIN DASHBOARD ───────────────────────────────────────────────────────

  const totalRevenue = orders.reduce((sum, o) => {
    const m = meals.find(m => m.name === o.meal_name)
    return sum + (m ? Number(m.price) : 0)
  }, 0)

  return (
    <>
      <Head><title>Admin Dashboard — Ghar Ka Khana</title></Head>

      <nav>
        <span className="nav-brand">Ghar Ka <span>Khana</span></span>
        <div className="nav-links">
          <Link href="/" className="nav-btn">View Menu</Link>
          <button className="nav-btn" onClick={() => doLogout('manual')}>Logout</button>
        </div>
      </nav>

      {/* SESSION WARNING */}
      {sessionWarning && (
        <div style={{
          background: '#FAEEDA', borderBottom: '2px solid #EF9F27',
          padding: '10px 2rem', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', fontSize: 13, color: '#633806',
        }}>
          <span>⏱ Your session expires in 2 minutes due to inactivity.</span>
          <button onClick={resetSessionTimer} style={{
            background: 'var(--saffron)', color: 'white', border: 'none',
            padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
          }}>
            Stay logged in
          </button>
        </div>
      )}

      <main>
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>🍳 Kitchen Dashboard</h2>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{today}</span>
          </div>

          <div className="tab-bar">
            <button className={tab === 'meals'    ? 'active' : ''} onClick={() => setTab('meals')}>Today's Meals</button>
            <button className={tab === 'orders'   ? 'active' : ''} onClick={() => setTab('orders')}>Orders ({orders.length})</button>
            <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</button>
          </div>

          {loading ? <div className="loading">Loading kitchen data...</div> : (<>

            {/* ── MEALS ── */}
            {tab === 'meals' && (
              <div>
                <div className="admin-section-title">Manage Today's Meals</div>

                {meals.length === 0 && (
                  <div className="empty" style={{ marginBottom: '1rem' }}>
                    No meals yet. Click <strong>+ Add New Meal</strong> below to start.
                  </div>
                )}

                {meals.map(meal => {
                  const comps = Array.isArray(meal.components)
                    ? meal.components.join(', ')
                    : (meal.components || '')
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
                                const updated = { ...meal, enabled: !meal.enabled }
                                updateLocalMeal(meal.id, 'enabled', !meal.enabled)
                                saveMeal(updated)
                              }}
                            /> Enabled
                          </label>
                          <button className="del-btn" onClick={() => deleteMeal(meal.id)}>Remove</button>
                        </div>
                      </div>

                      <div className="edit-grid">
                        <div className="edit-field">
                          <label>Meal Name</label>
                          <input type="text" value={meal.name || ''} onChange={e => updateLocalMeal(meal.id, 'name', e.target.value)} />
                        </div>
                        <div className="edit-field">
                          <label>Price ({settings.currency})</label>
                          <input type="number" value={meal.price || ''} min="1" onChange={e => updateLocalMeal(meal.id, 'price', Number(e.target.value))} />
                        </div>
                        <div className="edit-field full">
                          <label>Description</label>
                          <textarea value={meal.description || ''} onChange={e => updateLocalMeal(meal.id, 'description', e.target.value)} />
                        </div>
                        <div className="edit-field full">
                          <label>Components (comma separated)</label>
                          <input type="text" value={comps} onChange={e => updateLocalMeal(meal.id, 'components', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                        </div>
                        <div className="edit-field">
                          <label>Sold Today</label>
                          <input type="number" value={meal.sold || 0} min="0" onChange={e => updateLocalMeal(meal.id, 'sold', Number(e.target.value))} />
                        </div>
                        <div className="edit-field">
                          <label>Meal Type</label>
                          <select value={meal.special ? 'special' : 'regular'} onChange={e => updateLocalMeal(meal.id, 'special', e.target.value === 'special')}>
                            <option value="regular">Regular</option>
                            <option value="special">Weekend Special</option>
                          </select>
                        </div>
                      </div>

                      <button className="save-btn" onClick={() => saveMeal(meal)} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )
                })}

                <button className="add-meal-btn" onClick={addMeal} disabled={addingMeal}>
                  {addingMeal ? '⏳ Adding meal...' : '+ Add New Meal'}
                </button>
                {addingMeal && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 6 }}>
                    Saving to database — please wait...
                  </p>
                )}
              </div>
            )}

            {/* ── ORDERS ── */}
            {tab === 'orders' && (
              <div>
                <div className="admin-section-title">Today's Orders</div>
                {orders.length === 0
                  ? <div className="empty">No orders yet today.</div>
                  : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="orders-table">
                        <thead><tr><th>#</th><th>Time</th><th>Meal</th><th>Customer</th><th>Phone</th><th>Notes</th></tr></thead>
                        <tbody>
                          {orders.map((o, i) => {
                            const m = meals.find(m => m.name === o.meal_name)
                            return (
                              <tr key={o.id}>
                                <td>{i + 1}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>
                                  {new Date(o.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td><span className={`order-tag ${m?.special ? 'special' : 'regular'}`}>{o.meal_name}</span></td>
                                <td>{o.customer_name}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>{o.phone}</td>
                                <td className="note-cell">{o.notes || '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                }
                <div className="orders-summary">
                  📊 Total orders: <strong style={{ color: 'var(--text)' }}>{orders.length}</strong>
                  &nbsp;·&nbsp;
                  Revenue: <strong style={{ color: 'var(--green)' }}>{settings.currency}{totalRevenue.toFixed(2)}</strong>
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab === 'settings' && (
              <div>
                <div className="admin-section-title">Daily Settings</div>
                <div className="settings-row">
                  <label>Maximum portions per meal per day</label>
                  <input type="number" value={settings.daily_limit} min="1" max="50"
                    onChange={e => setSettings(s => ({ ...s, daily_limit: Number(e.target.value) }))} />
                </div>
                <div className="settings-row">
                  <label>Default meal price ({settings.currency})</label>
                  <input type="number" value={settings.base_price} min="1"
                    onChange={e => setSettings(s => ({ ...s, base_price: Number(e.target.value) }))} />
                </div>
                <div className="settings-row">
                  <label>Currency symbol</label>
                  <input type="text" value={settings.currency} maxLength="3"
                    style={{ width: 80, textAlign: 'center' }}
                    onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))} />
                </div>
                <button className="save-btn" onClick={saveSettings} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(196,149,106,0.2)' }}>
                  <div className="admin-section-title">New Day Reset</div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
                    Run every morning to reset sold counts to zero and clear yesterday's orders.
                  </p>
                  <button className="save-btn danger" onClick={resetDay}>🔄 Reset for New Day</button>
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(196,149,106,0.2)' }}>
                  <div className="admin-section-title">Session Security</div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                    Admin sessions automatically expire after <strong>15 minutes of inactivity</strong>.
                    A warning appears 2 minutes before expiry. Any mouse movement, typing, or scrolling resets the timer.
                    To change your admin password, update <code>NEXT_PUBLIC_ADMIN_PASSWORD</code> in your Vercel environment variables.
                  </p>
                </div>
              </div>
            )}

          </>)}
        </div>
      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  )
}
