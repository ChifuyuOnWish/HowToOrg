import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import InviteMembers from '../components/InviteMembers'

function Project() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs font-mono tracking-widest text-indigo-400 uppercase mb-2">Project</p>
        <h1 className="text-3xl font-bold text-white">{project.name}</h1>
        {project.description && (
          <p className="text-slate-400 mt-2 text-sm">{project.description}</p>
        )}
      </div>

      <InviteMembers projectId={projectId} />
    </div>
  )
}

export default Project
