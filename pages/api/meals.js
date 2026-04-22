import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('GET meals error:', error)
      return res.status(500).json({ error: error.message, details: error })
    }
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const meal = req.body

    // Ensure components is an array — convert if it arrived as a comma string
    if (typeof meal.components === 'string') {
      meal.components = meal.components.split(',').map(s => s.trim()).filter(Boolean)
    }

    // Remove undefined fields that can cause Supabase insert issues
    const cleanMeal = Object.fromEntries(
      Object.entries(meal).filter(([_, v]) => v !== undefined)
    )

    const { data, error } = await supabase
      .from('meals')
      .insert([cleanMeal])
      .select()

    if (error) {
      console.error('POST meals error:', error)
      return res.status(500).json({ error: error.message, details: error, attempted: cleanMeal })
    }
    return res.status(201).json(data[0])
  }

  res.status(405).json({ error: 'Method not allowed' })
}
