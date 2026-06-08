import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function Column({ column, onColumnUpdated, onColumnDeleted }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(column.name)
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleRename(e) {
    e.preventDefault()
    if (!name.trim() || name === column.name) { setEditing(false); return }
    setLoading(true)

    const { data, error } = await supabase
      .from('lists')
      .update({ name })
      .eq('id', column.id)
      .select()
      .single()

    setLoading(false)
    if (error) { console.error(error); return }
    onColumnUpdated(data)
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${column.name}"? All items in this list will be unassigned.`)) return

    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', column.id)

    if (error) { console.error(error); return }
    onColumnDeleted(column.id)
  }

  return (
    <div className="flex-shrink-0 w-72 flex flex-col bg-[#11111c] border border-[#1e1e2e] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e2e]">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />

        {editing ? (
          <form onSubmit={handleRename} className="flex-1">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleRename}
              autoFocus
              className="w-full bg-[#13131f] border border-indigo-500 rounded-lg px-2 py-1
                text-sm text-white outline-none"
            />
          </form>
        ) : (
          <span
            className="font-semibold text-sm text-white flex-1 truncate cursor-pointer hover:text-indigo-300 transition-colors"
            onClick={() => setEditing(true)}
          >
            {column.name}
          </span>
        )}

        <span className="text-xs text-slate-500 font-mono">0</span>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(prev => !prev)}
            className="text-slate-500 hover:text-white transition-colors text-lg leading-none px-1"
          >
            ⋯
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 z-10 w-36 bg-[#1a1a2e] border border-[#2a2a3d] rounded-xl shadow-xl overflow-hidden">
              <button
                onClick={() => { setEditing(true); setShowMenu(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#2a2a3d] transition-colors"
              >
                Rename
              </button>
              <button
                onClick={() => { handleDelete(); setShowMenu(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#2a2a3d] transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Items area */}
      <div className="flex-1 p-3 min-h-[200px]">
        <p className="text-xs text-slate-600 text-center mt-4">No items yet</p>
      </div>

      {/* Add item button */}
      <div className="px-3 pb-3">
        <button className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-indigo-400
          border border-dashed border-[#2a2a3d] hover:border-indigo-500/50 transition-all duration-200">
          + Add item
        </button>
      </div>
    </div>
  )
}

export default Column
