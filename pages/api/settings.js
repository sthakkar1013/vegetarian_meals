import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()

    // Always return something usable — fall back to defaults if table missing
    if (error || !data) {
      return res.status(200).json({ daily_limit: 4, base_price: 25, currency: '$' })
    }
    return res.status(200).json(data)
  }

  if (req.method === 'PATCH') {
    const updates = req.body

    // Try upsert — insert row id=1 if it doesn't exist, update if it does
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        id: 1,
        daily_limit: updates.daily_limit,
        base_price:  updates.base_price,
        currency:    updates.currency,
        updated_at:  new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()

    if (error) {
      console.error('Settings PATCH error:', error)
      return res.status(500).json({ error: error.message, hint: error.hint || '' })
    }
    return res.status(200).json(data[0])
  }

  res.status(405).json({ error: 'Method not allowed' })
}
