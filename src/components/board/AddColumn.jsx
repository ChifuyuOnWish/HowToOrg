import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const COLORS = [
  '#6366f1', '#f59e0b', '#22c55e', '#ef4444',
  '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'
]

const STATUSES = [
  { value: '', label: 'No status' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

function AddColumn({ projectId, onColumnAdded }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const { data: existing } = await supabase
      .from('lists')
      .select('position')
      .eq('project_id', projectId)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = existing ? existing.position + 1 : 0

    const { data, error } = await supabase
      .from('lists')
      .insert({
        project_id: projectId,
        name,
        color,
        position: nextPosition,
        status: status || null
      })
      .select()
      .single()

    setLoading(false)
    if (error) { console.error(error); return }

    onColumnAdded(data)
    setName('')
    setColor(COLORS[0])
    setStatus('')
    setOpen(false)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex-shrink-0 w-72 h-fit flex items-center gap-2 px-4 py-3 rounded-2xl
        border border-dashed border-[#2a2a3d] text-slate-500 hover:text-indigo-400
        hover:border-indigo-500/50 transition-all duration-200 text-sm"
    >
      <span className="text-lg leading-none">+</span>
      Add list
    </button>
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-shrink-0 w-72 bg-[#11111c] border border-[#1e1e2e] rounded-2xl p-4 flex flex-col gap-3 h-fit"
    >
      <p className="text-xs font-mono tracking-widest text-slate-500 uppercase">New list</p>
      <input
        type="text"
        placeholder="List name *"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full bg-[#13131f] border border-[#2a2a3d] rounded-xl px-3 py-2.5 text-sm text-white
          placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
        autoFocus
        required
      />

      <select
        value={status}
        onChange={e => setStatus(e.target.value)}
        className="w-full bg-[#13131f] border border-[#2a2a3d] rounded-xl px-3 py-2.5 text-sm text-white
          outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
      >
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500
            text-white transition-all duration-200 disabled:opacity-40"
        >
          {loading ? 'Adding...' : 'Add list'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white
            border border-[#2a2a3d] hover:border-slate-500 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default AddColumn