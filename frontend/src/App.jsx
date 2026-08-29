import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DemoExperience from './pages/DemoExperience.jsx'

function RequireAuth({ children }) {
  const token = localStorage.getItem('locateme_token')
  if (!token) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demo" element={<DemoExperience />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
