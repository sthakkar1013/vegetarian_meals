import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

const ADMIN_PASSWORD     = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
const SESSION_TIMEOUT_MS = 15 * 60 * 1000
const SESSION_WARNING_MS = 13 * 60 * 1000

export default function Admin() {
  const [loggedIn, setLoggedIn]         = useState(false)
  const [password, setPassword]         = useState('')
  const [loginErr, setLoginErr]         = useState(false)
  const [tab, setTab]                   = useState('meals')
  const [meals, setMeals]               = useState([])
  const [orders, setOrders]             = useState([])
  const [settings, setSettings]         = useState({ daily_limit: 4, base_price: 25, currency: '$' })
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [addingMeal, setAddingMeal]     = useState(false)
  const [toast, setToast]               = useState(null)
  const [sessionWarning, setSessionWarning] = useState(false)
  const [historyMeal, setHistoryMeal]   = useState(null)  // meal_key being viewed
  const [historyData, setHistoryData]   = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const timeoutRef = useRef(null)
  const warningRef = useRef(null)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // ── SESSION ───────────────────────────────────────────────────────────────

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
      showToast('Network error: ' + err.message, 'error', 8000)
    } finally {
      setLoading(false)
    }
  }

  async function fetchHistory(meal_key, mealName) {
    setHistoryMeal(mealName)
    setHistoryLoading(true)
    setTab('history')
    try {
      const res  = await fetch(`/api/meals/history?meal_key=${meal_key}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || res.status)
      setHistoryData(data)
    } catch (err) {
      showToast('Failed to load history: ' + err.message, 'error')
    } finally {
      setHistoryLoading(false)
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
          name:        'New Meal — edit me',
          type:        'Vegetarian',
          description: 'Add your meal description here.',
          components:  ['Rice', 'Sabzi', 'Dal', 'Salad', 'Sweet'],
          price:       Number(settings.base_price) || 25,
          special:     false,
          enabled:     true,
        }),
      })
      let data = {}
      try { data = await res.json() } catch {}
      if (!res.ok) {
        showToast('Add meal failed: ' + (data.error || 'HTTP ' + res.status), 'error', 10000)
        return
      }
      setMeals(prev => [...prev, data])
      showToast('New meal added — scroll down to edit ✓', 'success', 5000)
    } catch (err) {
      showToast('Network error: ' + err.message, 'error', 10000)
    } finally {
      setAddingMeal(false)
    }
  }

  async function saveMeal(meal) {
    setSaving(true)
    try {
      let components = meal.components || []
      if (typeof components === 'string') {
        components = components.split(',').map(s => s.trim()).filter(Boolean)
      }
      // Use the physical row id — API resolves meal_key internally
      const res = await fetch(`/api/meals/${meal.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...meal, components }),
      })
      let data = {}
      try { data = await res.json() } catch {}
      if (!res.ok) {
        showToast('Save failed: ' + (data.error || res.status), 'error', 8000)
        return
      }
      // Replace old row with new version row in local state
      setMeals(prev => prev.map(m => m.id === meal.id ? data : m))
      showToast('Saved — new version created ✓')
    } catch (err) {
      showToast('Network error saving: ' + err.message, 'error', 8000)
    } finally {
      setSaving(false)
    }
  }

  async function deleteMeal(meal) {
    if (!confirm(`Remove "${meal.name}" from the menu?\n\nThe meal history will be preserved in the database.`)) return
    try {
      const res = await fetch(`/api/meals/${meal.id}`, { method: 'DELETE' })
      let data = {}
      try { data = await res.json() } catch {}
      if (!res.ok) {
        showToast('Failed to remove meal: ' + (data.error || res.status), 'error')
        return
      }
      setMeals(prev => prev.filter(m => m.id !== meal.id))
      showToast('Meal removed — history preserved ✓')
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
    if (!confirm('Reset all sold counts and clear all orders for a new day?\nMeal history is always preserved.')) return
    try {
      const res = await fetch('/api/reset', { method: 'POST' })
      if (!res.ok) { showToast('Reset failed.', 'error'); return }
      await fetchAll()
      showToast('New day reset complete ✓')
    } catch (err) {
      showToast('Network error: ' + err.message, 'error')
    }
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────

  function formatTs(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function changeReasonBadge(reason) {
    const map = {
      insert:  { bg: '#EAF3DE', color: '#27500A', label: 'Created' },
      update:  { bg: '#E6F1FB', color: '#0C447C', label: 'Updated' },
      delete:  { bg: '#FCEBEB', color: '#791F1F', label: 'Deleted' },
    }
    const style = map[reason] || { bg: '#F1EFE8', color: '#5F5E5A', label: reason }
    return (
      <span style={{
        background: style.bg, color: style.color,
        padding: '2px 8px', borderRadius: 3,
        fontSize: 11, fontWeight: 600,
      }}>
        {style.label}
      </span>
    )
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────

  if (!loggedIn) {
    return (
      <>
        <Head><title>Admin Login — Ghar Ka Khana</title></Head>
        <div className="login-wrap">
          <div className="login-card">
            <h2>Admin Login</h2>
            <p>Session expires after 15 minutes of inactivity.</p>
            {loginErr && <div className="login-err">Incorrect password.</div>}
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} autoFocus
                onChange={e => { setPassword(e.target.value); setLoginErr(false) }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
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

  // ── DASHBOARD ─────────────────────────────────────────────────────────────

  const totalRevenue = orders.reduce((sum, o) => {
    const m = meals.find(m => m.name === o.meal_name)
    return sum + (m ? Number(m.price) : 0)
  }, 0)

  return (
    <>
      <Head><title>Admin — Ghar Ka Khana</title></Head>

      <nav>
        <span className="nav-brand">Ghar Ka <span>Khana</span></span>
        <div className="nav-links">
          <Link href="/" className="nav-btn">View Menu</Link>
          <button className="nav-btn" onClick={() => doLogout('manual')}>Logout</button>
        </div>
      </nav>

      {sessionWarning && (
        <div style={{ background: '#FAEEDA', borderBottom: '2px solid #EF9F27', padding: '10px 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#633806' }}>
          <span>⏱ Session expires in 2 minutes.</span>
          <button onClick={resetSessionTimer} style={{ background: 'var(--saffron)', color: 'white', border: 'none', padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
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
            <button className={tab === 'history'  ? 'active' : ''} onClick={() => setTab('history')}>Meal History</button>
            <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</button>
          </div>

          {loading ? <div className="loading">Loading kitchen data...</div> : (<>

            {/* ── MEALS TAB ── */}
            {tab === 'meals' && (
              <div>
                <div className="admin-section-title">Manage Today's Meals</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '1rem', padding: '8px 12px', background: '#E6F1FB', borderRadius: 6, borderLeft: '3px solid #85B7EB' }}>
                  📋 SCD Type 2 enabled — every save creates a new version. History is never deleted. Click <strong>View History</strong> on any meal to see all past versions.
                </div>

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
                          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8, fontFamily: 'var(--font-mono)' }}>
                            key:{meal.meal_key}
                          </span>
                        </span>
                        <div className="meal-edit-actions">
                          <button
                            style={{ background: 'none', border: '1px solid rgba(196,149,106,0.4)', color: 'var(--muted)', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                            onClick={() => fetchHistory(meal.meal_key, meal.name)}
                          >
                            View History
                          </button>
                          <label className="toggle-label">
                            <input type="checkbox" checked={!!meal.enabled}
                              onChange={() => {
                                const updated = { ...meal, enabled: !meal.enabled }
                                updateLocalMeal(meal.id, 'enabled', !meal.enabled)
                                saveMeal(updated)
                              }} /> Enabled
                          </label>
                          <button className="del-btn" onClick={() => deleteMeal(meal)}>Remove</button>
                        </div>
                      </div>

                      <div className="edit-grid">
                        <div className="edit-field">
                          <label>Meal Name</label>
                          <input type="text" value={meal.name || ''}
                            onChange={e => updateLocalMeal(meal.id, 'name', e.target.value)} />
                        </div>
                        <div className="edit-field">
                          <label>Price ({settings.currency})</label>
                          <input type="number" value={meal.price || ''} min="1"
                            onChange={e => updateLocalMeal(meal.id, 'price', Number(e.target.value))} />
                        </div>
                        <div className="edit-field full">
                          <label>Description (one item per line)</label>
                          <textarea value={meal.description || ''}
                            onChange={e => updateLocalMeal(meal.id, 'description', e.target.value)} />
                        </div>
                        <div className="edit-field full">
                          <label>Components (comma separated)</label>
                          <input type="text" value={comps}
                            onChange={e => updateLocalMeal(meal.id, 'components',
                              e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                        </div>
                        <div className="edit-field">
                          <label>Sold Today</label>
                          <input type="number" value={meal.sold || 0} min="0"
                            onChange={e => updateLocalMeal(meal.id, 'sold', Number(e.target.value))} />
                        </div>
                        <div className="edit-field">
                          <label>Meal Type</label>
                          <select value={meal.special ? 'special' : 'regular'}
                            onChange={e => updateLocalMeal(meal.id, 'special', e.target.value === 'special')}>
                            <option value="regular">Regular</option>
                            <option value="special">Weekend Special</option>
                          </select>
                        </div>
                      </div>

                      <button className="save-btn" onClick={() => saveMeal(meal)} disabled={saving}>
                        {saving ? 'Saving new version...' : 'Save Changes'}
                      </button>
                    </div>
                  )
                })}

                <button className="add-meal-btn" onClick={addMeal} disabled={addingMeal}>
                  {addingMeal ? '⏳ Adding meal...' : '+ Add New Meal'}
                </button>
              </div>
            )}

            {/* ── ORDERS TAB ── */}
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
                  📊 Total: <strong style={{ color: 'var(--text)' }}>{orders.length}</strong> &nbsp;·&nbsp;
                  Revenue: <strong style={{ color: 'var(--green)' }}>{settings.currency}{totalRevenue.toFixed(2)}</strong>
                </div>
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {tab === 'history' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div className="admin-section-title" style={{ marginBottom: 0 }}>
                    Version History {historyMeal ? `— ${historyMeal}` : ''}
                  </div>
                  <button
                    onClick={() => setTab('meals')}
                    style={{ background: 'none', border: '1px solid rgba(196,149,106,0.4)', color: 'var(--muted)', padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                  >
                    ← Back to Meals
                  </button>
                </div>

                {historyLoading ? (
                  <div className="loading">Loading history...</div>
                ) : historyData.length === 0 ? (
                  <div className="empty">
                    No history found. Click <strong>View History</strong> on a meal to see its versions.
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: '1rem', padding: '8px 12px', background: '#EAF3DE', borderRadius: 6, borderLeft: '3px solid #97C459' }}>
                      📋 Showing all {historyData.length} version{historyData.length !== 1 ? 's' : ''} for this meal.
                      Versions are ordered oldest → newest. The current active version is highlighted.
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>Version</th>
                            <th>Change</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Enabled</th>
                            <th>Effective From</th>
                            <th>Effective To</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyData.map((v, i) => (
                            <tr key={v.id} style={{ background: v.is_current ? 'rgba(234,243,222,0.5)' : 'transparent' }}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>v{i + 1}</td>
                              <td>{changeReasonBadge(v.change_reason)}</td>
                              <td style={{ fontWeight: v.is_current ? 500 : 400 }}>{v.name}</td>
                              <td>{settings.currency}{v.price}</td>
                              <td>{v.enabled ? '✓' : '✗'}</td>
                              <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{formatTs(v.effective_from)}</td>
                              <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: v.effective_to ? 'var(--muted)' : 'var(--green)' }}>
                                {v.effective_to ? formatTs(v.effective_to) : 'Active'}
                              </td>
                              <td>
                                {v.is_current
                                  ? <span style={{ background: '#EAF3DE', color: '#27500A', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 600 }}>Current</span>
                                  : <span style={{ color: 'var(--muted)', fontSize: 11 }}>Superseded</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── SETTINGS TAB ── */}
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
                    Resets all sold counts to zero and clears today's orders. Meal versions and history are never deleted.
                  </p>
                  <button className="save-btn danger" onClick={resetDay}>🔄 Reset for New Day</button>
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(196,149,106,0.2)' }}>
                  <div className="admin-section-title">SCD Type 2 — Meal Versioning</div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                    Every time you save or remove a meal, the previous version is preserved with an end date. No meal data is ever permanently deleted. View the full version history for any meal by clicking <strong>View History</strong> on the Today's Meals tab.
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
