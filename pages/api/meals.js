import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {

  // GET — return only current active versions
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('is_current', true)
      .order('meal_key', { ascending: true })

    if (error) {
      console.error('GET meals error:', error)
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json(data)
  }

  // POST — insert new meal via SCD2 function (generates stable meal_key)
  if (req.method === 'POST') {
    const meal = req.body

    // Ensure components is an array
    let components = meal.components || []
    if (typeof components === 'string') {
      components = components.split(',').map(s => s.trim()).filter(Boolean)
    }

    const { data, error } = await supabase.rpc('scd2_insert_meal', {
      p_name:        meal.name        || 'New Meal',
      p_type:        meal.type        || 'Vegetarian',
      p_description: meal.description || '',
      p_components:  components,
      p_price:       Number(meal.price) || 12,
      p_special:     Boolean(meal.special),
      p_enabled:     meal.enabled !== false,
    })

    if (error) {
      console.error('POST meals (scd2_insert) error:', error)
      return res.status(500).json({ error: error.message, details: error })
    }

    // rpc returns an array — return first row
    return res.status(201).json(Array.isArray(data) ? data[0] : data)
  }

  res.status(405).json({ error: 'Method not allowed' })
}
