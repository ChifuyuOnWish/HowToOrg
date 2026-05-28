import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/projects" element={
              <div className="min-h-screen flex items-center justify-center">
                <p className="text-indigo-400 font-mono text-sm">Projects page — coming soon</p>
              </div>
            } />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App