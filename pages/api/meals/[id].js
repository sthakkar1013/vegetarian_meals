import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  // id here is the physical row id — we need to resolve meal_key from it
  const { id } = req.query

  // PATCH — close current version, insert new version with updated fields
  if (req.method === 'PATCH') {
    const updates = req.body

    // Step 1: Get the meal_key for this row id
    const { data: existing, error: fetchError } = await supabase
      .from('meals')
      .select('meal_key, sold')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Meal not found', details: fetchError })
    }

    // Step 2: Ensure components is an array
    let components = updates.components || []
    if (typeof components === 'string') {
      components = components.split(',').map(s => s.trim()).filter(Boolean)
    }

    // Step 3: Call SCD2 update function
    // This closes the current version and creates a new one atomically
    const { data, error } = await supabase.rpc('scd2_update_meal', {
      p_meal_key:    existing.meal_key,
      p_name:        updates.name,
      p_type:        updates.type        || 'Vegetarian',
      p_description: updates.description || '',
      p_components:  components,
      p_price:       Number(updates.price),
      p_sold:        Number(updates.sold ?? existing.sold ?? 0),
      p_special:     Boolean(updates.special),
      p_enabled:     updates.enabled !== false,
    })

    if (error) {
      console.error('PATCH meal (scd2_update) error:', error)
      return res.status(500).json({ error: error.message, details: error })
    }

    return res.status(200).json(Array.isArray(data) ? data[0] : data)
  }

  // DELETE — close current version with change_reason='delete', never physically deletes
  if (req.method === 'DELETE') {
    // Step 1: Get meal_key
    const { data: existing, error: fetchError } = await supabase
      .from('meals')
      .select('meal_key')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Meal not found', details: fetchError })
    }

    // Step 2: Call SCD2 delete function
    // Sets effective_to = now(), is_current = false, change_reason = 'delete'
    const { error } = await supabase.rpc('scd2_delete_meal', {
      p_meal_key: existing.meal_key,
    })

    if (error) {
      console.error('DELETE meal (scd2_delete) error:', error)
      return res.status(500).json({ error: error.message, details: error })
    }

    return res.status(200).json({
      success: true,
      message: `Meal version closed. History preserved for meal_key ${existing.meal_key}.`
    })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
