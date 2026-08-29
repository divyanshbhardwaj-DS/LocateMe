import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { adminLogin } from '../services/locationApi.js'
import BackgroundFX from '../components/BackgroundFX.jsx'
import { PinMark } from '../components/Nav.jsx'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await adminLogin(username, password)
      localStorage.setItem('locateme_token', data.access_token)
      navigate('/admin/dashboard')
    } catch {
      setError('Incorrect username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night px-5 py-12">
      <BackgroundFX />
      <div className="relative w-full max-w-md">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="overflow-hidden rounded-3xl border border-line bg-panel/80 shadow-card backdrop-blur-xl"
        >
          <div className="border-b border-line bg-gradient-to-br from-mint/10 to-transparent px-8 py-8">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-panel2 ring-1 ring-line">
                <PinMark className="h-6 w-6" />
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-mint">Owner access</p>
              </div>
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold text-snow">Sign in to your dashboard</h1>
            <p className="mt-1 text-sm text-fog">Private location records, for authorized owners only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-fog">Username</span>
              <input
                className="w-full rounded-xl border border-line bg-night2 px-4 py-3 font-body text-sm text-snow outline-none transition-colors focus:border-mint/60"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-fog">Password</span>
              <input
                type="password"
                className="w-full rounded-xl border border-line bg-night2 px-4 py-3 font-body text-sm text-snow outline-none transition-colors focus:border-mint/60"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            {error && (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-2.5 text-sm text-danger"
              >
                Incorrect username or password.
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3.5"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-night/25 border-t-night" />
                  Verifying…
                </>
              ) : (
                'Sign in securely'
              )}
            </button>

            <p className="pt-1 text-center text-xs text-fog/70">
              <Link to="/" className="transition-colors hover:text-mint">
                &larr; Back to Orbit
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
