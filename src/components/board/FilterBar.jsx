import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function FilterBar({ projectId, filters, onFiltersChange }) {
  const [members, setMembers] = useState([])

  useEffect(() => {
    async function fetchMembers() {
      const { data } = await supabase
        .from('project_members')
        .select('profiles(id, name)')
        .eq('project_id', projectId)
      setMembers(data?.map(m => m.profiles).filter(Boolean) ?? [])
    }
    fetchMembers()
  }, [projectId])

  function toggleAssignee(memberId) {
    const current = filters.assignees ?? []
    const next = current.includes(memberId)
      ? current.filter(id => id !== memberId)
      : [...current, memberId]
    onFiltersChange({ ...filters, assignees: next })
  }

  const initials = (name) => name?.slice(0, 2).toUpperCase() ?? '??'

  const hasFilters = (filters.assignees ?? []).length > 0

  return (
    <div className="flex items-center gap-3 px-6 py-2 border-b border-[#1e1e2e]">
      {members.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Assignee:</span>
          <div className="flex gap-1">
            {members.map(member => {
              const active = (filters.assignees ?? []).includes(member.id)
              return (
                <button
                  key={member.id}
                  onClick={() => toggleAssignee(member.id)}
                  title={member.name}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    transition-all duration-200
                    ${active
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1 ring-offset-[#0a0a0f]'
                      : 'bg-[#1e1e2e] text-slate-400 hover:bg-[#2a2a3d]'
                    }`}
                >
                  {initials(member.name)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {hasFilters && (
        <button
          onClick={() => onFiltersChange({ assignees: [] })}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors ml-auto"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default FilterBar