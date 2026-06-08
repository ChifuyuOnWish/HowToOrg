import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

function AddItem({ column, onItemAdded }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    const { data: existing } = await supabase
      .from('items')
      .select('position')
      .eq('list_id', column.id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = existing ? existing.position + 1 : 0

    const { data, error } = await supabase
      .from('items')
      .insert({
        title,
        list_id: column.id,
        project_id: column.project_id,
        position: nextPosition,
        created_by: user.id,
      })
      .select()
      .single()

    setLoading(false)
    if (error) { console.error(error); return }

    onItemAdded(data)
    setTitle('')
    setOpen(false)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-indigo-400
        border border-dashed border-[#2a2a3d] hover:border-indigo-500/50 transition-all duration-200"
    >
      + Add item
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Item title *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Escape' && setOpen(false)}
        autoFocus
        className="w-full bg-[#13131f] border border-indigo-500 rounded-xl px-3 py-2 text-sm text-white
          placeholder-slate-500 outline-none"
        required
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500
            text-white transition-all duration-200 disabled:opacity-40"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white
            border border-[#2a2a3d] transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default AddItem