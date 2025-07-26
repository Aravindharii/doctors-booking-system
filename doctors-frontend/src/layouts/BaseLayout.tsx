import { PropsWithChildren } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function BaseLayout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow h-14 flex items-center justify-between px-6">
        <Link to="/" className="font-semibold">Doctor Appointment System</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name} ({user?.role})</span>
          <button
            className="text-sm text-red-600"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
