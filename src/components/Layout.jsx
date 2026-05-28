import { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function Layout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const initials = user?.user_metadata?.name
    ? user.user_metadata.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2)?.toUpperCase() ?? '??'

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) { console.error('Logout error:', error); return }
    navigate('/login')
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-[#0a0a0f]/80 backdrop-blur border-b border-[#1e1e2e] flex items-center justify-between px-6">
        <Link to="/projects" className="text-sm font-semibold text-white tracking-tight hover:text-indigo-400 transition-colors">
          HowToOrg
        </Link>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            aria-label="Account menu"
            aria-expanded={dropdownOpen}
            className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors
              flex items-center justify-center text-xs font-bold text-white"
          >
            {initials}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#11111c] border border-[#1e1e2e] rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1e1e2e]">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-[#1e1e2e] hover:text-white transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#1e1e2e] transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="pt-12">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout