import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

function ItemDetail({ item, projectId, onClose, onItemUpdated }) {
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? '')
  const [dueDate, setDueDate] = useState(item.due_date ?? '')
  const [members, setMembers] = useState([])
  const [assignees, setAssignees] = useState([])
  const [labels, setLabels] = useState([])
  const [itemLabels, setItemLabels] = useState([])
  const [saving, setSaving] = useState(false)
  const backdropRef = useRef(null)

  useEffect(() => {
    fetchMembers()
    fetchAssignees()
    fetchLabels()
    fetchItemLabels()
  }, [projectId, item.id])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function fetchMembers() {
    const { data } = await supabase
      .from('project_members')
      .select('profiles(id, name)')
      .eq('project_id', projectId)
    setMembers(data?.map(m => m.profiles).filter(Boolean) ?? [])
  }

  async function fetchAssignees() {
    const { data } = await supabase
      .from('item_assignees')
      .select('profiles(id, name)')
      .eq('item_id', item.id)
    setAssignees(data?.map(a => a.profiles).filter(Boolean) ?? [])
  }

  async function fetchLabels() {
    const { data } = await supabase
      .from('labels')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true })
    setLabels(data ?? [])
  }

  async function fetchItemLabels() {
    const { data } = await supabase
      .from('item_labels')
      .select('label_id')
      .eq('item_id', item.id)
    setItemLabels(data?.map(l => l.label_id) ?? [])
  }

  async function handleSave() {
    setSaving(true)

    const { error } = await supabase
      .from('items')
      .update({
        title,
        description: description || null,
        due_date: dueDate || null,
      })
      .eq('id', item.id)

    if (error) {
      setSaving(false)
      console.error(error)
      return
    }

    // Re-fetch avec tout
    const { data } = await supabase
      .from('items')
      .select('*, item_assignees(user_id), item_labels(label_id)')
      .eq('id', item.id)
      .single()

    setSaving(false)
    if (data) onItemUpdated(data)
  }

  async function toggleAssignee(member) {
    const isAssigned = assignees.some(a => a.id === member.id)

    if (isAssigned) {
      await supabase
        .from('item_assignees')
        .delete()
        .eq('item_id', item.id)
        .eq('user_id', member.id)
      setAssignees(prev => prev.filter(a => a.id !== member.id))
    } else {
      await supabase
        .from('item_assignees')
        .insert({ item_id: item.id, user_id: member.id })
      setAssignees(prev => [...prev, member])
    }

    const { data } = await supabase
      .from('items')
      .select('*, item_assignees(user_id)')
      .eq('id', item.id)
      .single()

    if (data) onItemUpdated(data, false)
  }

  async function toggleLabel(labelId) {
    const isAttached = itemLabels.includes(labelId)

    if (isAttached) {
      await supabase
        .from('item_labels')
        .delete()
        .eq('item_id', item.id)
        .eq('label_id', labelId)
      setItemLabels(prev => prev.filter(id => id !== labelId))
    } else {
      await supabase
        .from('item_labels')
        .insert({ item_id: item.id, label_id: labelId })
      setItemLabels(prev => [...prev, labelId])
    }

    const { data } = await supabase
      .from('items')
      .select('*, item_assignees(user_id), item_labels(label_id)')
      .eq('id', item.id)
      .single()

    if (data) onItemUpdated(data, false)
  }

  const initials = (name) => name?.slice(0, 2).toUpperCase() ?? '??'

  const inputClass = `w-full bg-[#13131f] border border-[#2a2a3d] rounded-xl px-4 py-3 text-sm text-white
    placeholder-slate-500 outline-none transition-all duration-200
    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50`

  return (
    <div
      ref={backdropRef}
      onClick={e => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-[#11111c] border border-[#1e1e2e] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e]">
          <p className="text-xs font-mono tracking-widest text-slate-500 uppercase">Item detail</p>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Labels + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Labels</label>
              {labels.length === 0 ? (
                <p className="text-xs text-slate-600">No labels in this project yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {labels.map(label => {
                    const isAttached = itemLabels.includes(label.id)
                    return (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200"
                        style={{
                          backgroundColor: isAttached ? label.color + '33' : '#13131f',
                          border: `1px solid ${isAttached ? label.color : '#2a2a3d'}`,
                          color: isAttached ? label.color : '#64748b',
                        }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Assignees */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Assignees</label>
            <div className="flex flex-wrap gap-2">
              {members.map(member => {
                const isAssigned = assignees.some(a => a.id === member.id)
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleAssignee(member)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all duration-200
                      ${isAssigned
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-300'
                        : 'bg-[#13131f] border border-[#2a2a3d] text-slate-400 hover:border-slate-500'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                      ${isAssigned ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                      {initials(member.name)}
                    </div>
                    {member.name ?? 'Unknown'}
                  </button>
                )
              })}
              {members.length === 0 && (
                <p className="text-xs text-slate-600">No members in this project yet.</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-slate-600 font-mono">
            Created {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1e1e2e] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white
              border border-[#2a2a3d] hover:border-slate-500 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500
              text-white transition-all duration-200 disabled:opacity-40
              shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ItemDetail