import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function InviteMembers({ projectId }) {
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    fetchMembers()
  }, [projectId])

  async function fetchMembers() {
    const { data, error } = await supabase
      .from('project_members')
      .select('user_id, profiles(id, name, avatar_url)')
      .eq('project_id', projectId)

    if (error) { console.error(error); return }
    setMembers(data.map(m => m.profiles).filter(Boolean))
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Find profile by email via auth (we look up the user in profiles via auth.users)
    const { data: users, error: searchError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id',
        // subquery: get user id from auth.users by email
        (await supabase.rpc('get_user_id_by_email', { user_email: email })).data
      )
      .single()

    if (searchError || !users) {
      setLoading(false)
      setError('No user found with that email.')
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId)
      .eq('user_id', users.id)
      .single()

    if (existing) {
      setLoading(false)
      setError('This user is already a member.')
      return
    }

    const { error: insertError } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: users.id })

    setLoading(false)
    if (insertError) { setError(insertError.message); return }

    setSuccess(`${users.name || email} has been added.`)
    setEmail('')
    fetchMembers()
  }

  const initials = (name) => name?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <div className="bg-[#11111c] border border-[#1e1e2e] rounded-2xl p-5">
      <p className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-4">Members</p>

      {/* Members list */}
      <div className="flex flex-wrap gap-3 mb-6">
        {members.map(member => (
          <div key={member.id} className="flex items-center gap-2 bg-[#1a1a2e] rounded-xl px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {initials(member.name)}
            </div>
            <span className="text-sm text-slate-300">{member.name || 'Unknown'}</span>
          </div>
        ))}
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="flex gap-3">
        <input
          type="email"
          placeholder="Invite by email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 bg-[#13131f] border border-[#2a2a3d] rounded-xl px-4 py-2.5 text-sm text-white
            placeholder-slate-500 outline-none transition-all duration-200
            focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500
            text-white transition-all duration-200 disabled:opacity-40 whitespace-nowrap"
        >
          {loading ? 'Adding...' : 'Add member'}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      {success && <p className="text-green-400 text-sm mt-3">{success}</p>}
    </div>
  )
}

export default InviteMembers