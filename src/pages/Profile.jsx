import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function Profile() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) setName(user.user_metadata?.name || '')
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { error: authError } = await supabase.auth.updateUser({
      data: { name }
    })

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, name })

    setLoading(false)
    if (profileError) { setError(profileError.message); return }
    setSuccess(true)
  }

  const inputClass = `w-full bg-[#13131f] border border-[#2a2a3d] rounded-xl px-4 py-3 text-sm text-white
    placeholder-slate-500 outline-none transition-all duration-200
    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50`

  const initials = name
    ? name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2)?.toUpperCase() ?? '??'

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-widest text-indigo-400 uppercase mb-2">Account</p>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-white font-medium">{name || 'No name set'}</p>
          <p className="text-slate-500 text-sm">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="display-name" className="text-xs text-slate-400 font-medium">Display name</label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs text-slate-400 font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={user?.email || ''}
            className={inputClass + ' opacity-50 cursor-not-allowed'}
            disabled
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">Profile updated.</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200
            bg-indigo-600 hover:bg-indigo-500 text-white
            shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

export default Profile