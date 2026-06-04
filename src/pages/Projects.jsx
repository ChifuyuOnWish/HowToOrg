import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function Projects() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        created_at,
        project_members(count)
      `)
      .order('created_at', { ascending: false })

    setLoading(false)
    if (error) { console.error(error); return }
    setProjects(data ?? [])
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)

    const { error } = await supabase
      .from('projects')
      .insert({ name, description, created_by: user.id })

    if (error) {
      setCreating(false)
      setError(error.message)
      return
    }

    // Re-fetch all projects after creation so RLS has time to apply
    await fetchProjects()
    setCreating(false)
    setName('')
    setDescription('')
    setShowForm(false)
  }

  const inputClass = `w-full bg-[#13131f] border border-[#2a2a3d] rounded-xl px-4 py-3 text-sm text-white
    placeholder-slate-500 outline-none transition-all duration-200
    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50`

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs font-mono tracking-widest text-indigo-400 uppercase mb-2">Workspace</p>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
        </div>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white
            transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.3)]
            hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
        >
          + New project
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 bg-[#11111c] border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs font-mono tracking-widest text-slate-500 uppercase">New project</p>
          <input
            type="text"
            placeholder="Project name *"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputClass}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={inputClass + ' resize-none'}
            rows={2}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-500
                text-white transition-all duration-200 disabled:opacity-40"
            >
              {creating ? 'Creating...' : 'Create project'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 rounded-xl text-sm text-slate-400 hover:text-white
                border border-[#2a2a3d] hover:border-slate-500 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Projects list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 text-sm">No projects yet.</p>
          <p className="text-slate-600 text-xs mt-1">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="group text-left bg-[#11111c] border border-[#1e1e2e] hover:border-indigo-500/40
                rounded-2xl p-5 transition-all duration-200
                hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]"
            >
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{project.description}</p>
              )}
              <p className="text-xs text-slate-600 font-mono">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Projects