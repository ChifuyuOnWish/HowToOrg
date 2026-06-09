import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const COLORS = [
  '#6366f1', '#f59e0b', '#22c55e', '#ef4444',
  '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
  '#06b6d4', '#84cc16', '#a855f7', '#f43f5e'
]

function Labels({ projectId }) {
  const [labels, setLabels] = useState([])
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLabels()
  }, [projectId])

  async function fetchLabels() {
    const { data } = await supabase
      .from('labels')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true })
    setLabels(data ?? [])
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('labels')
      .insert({ project_id: projectId, name, color })
      .select()
      .single()

    setLoading(false)
    if (error) { setError(error.message); return }

    setLabels(prev => [...prev, data])
    setName('')
    setColor(COLORS[0])
  }

  async function handleDelete(labelId) {
    await supabase.from('labels').delete().eq('id', labelId)
    setLabels(prev => prev.filter(l => l.id !== labelId))
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <p className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-6">Labels</p>

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-[#11111c] border border-[#1e1e2e] rounded-2xl p-4 flex flex-col gap-3 mb-6">
        <input
          type="text"
          placeholder="Label name *"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-[#13131f] border border-[#2a2a3d] rounded-xl px-3 py-2.5 text-sm text-white
            placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
          required
        />
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full transition-all duration-150"
              style={{
                backgroundColor: c,
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: '2px'
              }}
            />
          ))}
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500
            text-white transition-all duration-200 disabled:opacity-40"
        >
          {loading ? 'Creating...' : '+ Create label'}
        </button>
      </form>

      {/* Labels list */}
      {labels.length === 0 ? (
        <p className="text-slate-600 text-sm text-center py-8">No labels yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {labels.map(label => (
            <div
              key={label.id}
              className="flex items-center justify-between bg-[#11111c] border border-[#1e1e2e] rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                <span className="text-sm text-slate-200">{label.name}</span>
              </div>
              <button
                onClick={() => handleDelete(label.id)}
                className="text-slate-600 hover:text-red-400 transition-colors text-xs"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Labels