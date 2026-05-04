import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { meal_key } = req.query

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('meals')
      .select('id, meal_key, name, price, enabled, special, change_reason, effective_from, effective_to, is_current')
      .eq('meal_key', meal_key)
      .order('effective_from', { ascending: true })

    if (error) {
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json(data)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
