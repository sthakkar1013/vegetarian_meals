import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      // Return defaults if settings table doesn't exist yet
      return res.status(200).json({ daily_limit: 4, base_price: 12, currency: '£' })
    }
    return res.status(200).json(data)
  }

  if (req.method === 'PATCH') {
    const updates = req.body
    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...updates })
      .select()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data[0])
  }

  res.status(405).json({ error: 'Method not allowed' })
}
