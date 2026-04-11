import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Reset all sold counts to 0
    const { error: mealsError } = await supabase
      .from('meals')
      .update({ sold: 0 })
      .neq('id', 0)

    if (mealsError) return res.status(500).json({ error: mealsError.message })

    // Delete all orders for the day
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .neq('id', 0)

    if (ordersError) return res.status(500).json({ error: ordersError.message })

    return res.status(200).json({ success: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
