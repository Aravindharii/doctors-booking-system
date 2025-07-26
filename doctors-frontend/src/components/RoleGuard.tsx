import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Role } from '../types'

export default function RoleGuard({ allowed }: { allowed: Role[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!allowed.includes(user.role)) {
    return <Navigate to={user.role === Role.DOCTOR ? '/doctor' : '/patient'} replace />
  }
  return <Outlet />
}
