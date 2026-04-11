import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const order = req.body
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select()

    if (error) return res.status(500).json({ error: error.message })

    // Increment sold count on the meal
    await supabase.rpc('increment_sold', { meal_id: order.meal_id })

    return res.status(201).json(data[0])
  }

  res.status(405).json({ error: 'Method not allowed' })
}
