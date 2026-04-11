import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('id', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const meal = req.body
    const { data, error } = await supabase
      .from('meals')
      .insert([meal])
      .select()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data[0])
  }

  res.status(405).json({ error: 'Method not allowed' })
}
