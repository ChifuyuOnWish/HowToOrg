import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Board from '../components/board/Board'
import FilterBar from '../components/board/FilterBar'
import Roadmap from '../components/roadmap/Roadmap'
import InviteMembers from '../components/InviteMembers'

function Project() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('board')
  const [filters, setFilters] = useState({ assignees: [] })

  useEffect(() => {
    async function fetchProject() {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', projectId)
        .single()

      setLoading(false)
      if (error) { navigate('/projects'); return }
      setProject(data)
    }
    fetchProject()
  }, [projectId, navigate])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 pt-8 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-mono tracking-widest text-indigo-400 uppercase mb-1">Project</p>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          </div>
        </div>

        <div className="flex gap-1 border-b border-[#1e1e2e]">
          {['board', 'roadmap', 'members'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors duration-200
                border-b-2 -mb-px ${tab === t
                  ? 'text-indigo-400 border-indigo-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'board' && (
        <>
          <FilterBar
            projectId={projectId}
            filters={filters}
            onFiltersChange={setFilters}
          />
          <Board projectId={projectId} filters={filters} />
        </>
      )}

      {tab === 'roadmap' && <Roadmap projectId={projectId} />}

      {tab === 'members' && (
        <div className="max-w-xl mx-auto w-full px-6 py-8">
          <InviteMembers projectId={projectId} />
        </div>
      )}
    </div>
  )
}

export default Project