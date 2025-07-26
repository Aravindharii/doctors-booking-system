#!/usr/bin/env python3
import sys
import subprocess
from pathlib import Path
import textwrap
import json
import uuid

def sh(cmd, cwd=None):
    print(f"→ {cmd}")
    subprocess.run(cmd, shell=True, check=True, cwd=cwd)

def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip("\n"), encoding="utf-8")
    print(f"  wrote {path}")

def ensure_tools():
    try:
        subprocess.run("node -v", shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        subprocess.run("npm -v", shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        subprocess.run("npx -v", shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError:
        print("❌ You need Node.js, npm, and npx installed in your PATH.")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scaffold_frontend_context.py <project-name>")
        sys.exit(1)

    project_name = sys.argv[1]
    project_dir = Path(project_name).resolve()

    ensure_tools()

    if project_dir.exists():
        print(f"⚠️  Directory {project_dir} already exists. Proceeding, but files may be overwritten.")
    else:
        sh(f"npm create vite@latest {project_name} -- --template react-ts")

    # Install dependencies
    sh("npm i react-router-dom axios zod react-hook-form classnames clsx", cwd=project_dir)
    sh("npm i -D tailwindcss@latest @tailwindcss/postcss autoprefixer", cwd=project_dir)

    # ---------- CONFIG FILES ----------
    write(project_dir / ".env", """
    VITE_BACKEND_URL=http://localhost:3000
    """)

    # Tailwind/PostCSS configs
    write(project_dir / "postcss.config.js", """
    export default {
      plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {},
      },
    }
    """)

    write(project_dir / "tailwind.config.js", """
    /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
      theme: {
        extend: {},
      },
      plugins: [],
    };
    """)

    # src/index.css
    write(project_dir / "src/index.css", """
    @import "tailwindcss";

    html, body, #root {
      height: 100%;
    }
    """)

    # Update package.json scripts for Cypress
    pkg_path = project_dir / "package.json"
    pkg = json.loads(pkg_path.read_text())
    pkg["scripts"]["cy:open"] = "cypress open"
    pkg["scripts"]["cy:run"] = "cypress run"
    pkg_path.write_text(json.dumps(pkg, indent=2))

    # ---------- SRC STRUCTURE ----------
    # main.tsx
    write(project_dir / "src/main.tsx", """
    import React from 'react'
    import ReactDOM from 'react-dom/client'
    import { BrowserRouter } from 'react-router-dom'
    import App from './App'
    import './index.css'
    import { AuthProvider } from './contexts/AuthContext'
    import { ApiProvider } from './contexts/ApiContext'

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <AuthProvider>
          <ApiProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ApiProvider>
        </AuthProvider>
      </React.StrictMode>,
    )
    """)

    # App.tsx
    write(project_dir / "src/App.tsx", """
    import { Navigate, Route, Routes } from 'react-router-dom'
    import Login from './pages/auth/Login'
    import Register from './pages/auth/Register'
    import Protected from './components/Protected'
    import RoleGuard from './components/RoleGuard'
    import { Role } from './types'
    import PatientLayout from './layouts/PatientLayout'
    import DoctorLayout from './layouts/DoctorLayout'
    import PatientBook from './pages/patient/BookAppointment'
    import PatientMyAppointments from './pages/patient/MyAppointments'
    import DoctorSlots from './pages/doctor/Slots'
    import DoctorAppointments from './pages/doctor/Appointments'
    import NotFound from './pages/NotFound'

    export default function App() {
      return (
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* PATIENT DASHBOARD */}
          <Route element={<Protected />}>
            <Route element={<RoleGuard allowed={[Role.PATIENT]} />}>
              <Route path="/patient" element={<PatientLayout />}>
                <Route index element={<Navigate to="book" replace />} />
                <Route path="book" element={<PatientBook />} />
                <Route path="appointments" element={<PatientMyAppointments />} />
              </Route>
            </Route>

            {/* DOCTOR DASHBOARD */}
            <Route element={<RoleGuard allowed={[Role.DOCTOR]} />}>
              <Route path="/doctor" element={<DoctorLayout />}>
                <Route index element={<Navigate to="slots" replace />} />
                <Route path="slots" element={<DoctorSlots />} />
                <Route path="appointments" element={<DoctorAppointments />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      )
    }
    """)

    # types.ts
    write(project_dir / "src/types.ts", """
    export enum Role {
      DOCTOR = 'DOCTOR',
      PATIENT = 'PATIENT'
    }

    export interface User {
      id: number
      name: string
      email: string
      role: Role
    }

    export interface AuthResponse {
      token: string
      user: User
    }

    export interface Slot {
      id: number
      doctorId: number
      start: string
      end: string
      isBooked: boolean
    }

    export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

    export interface Appointment {
      id: number
      patientId: number
      doctorId: number
      slotId: number
      status: AppointmentStatus
      patient?: User
      doctor?: User
      slot?: Slot
    }
    """)

    # utils/config.ts
    write(project_dir / "src/utils/config.ts", """
    export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
    """)

    # contexts/AuthContext.tsx
    write(project_dir / "src/contexts/AuthContext.tsx", """
    import { createContext, useContext, useState, PropsWithChildren } from 'react'
    import { User } from '../types'

    interface AuthContextType {
      token: string | null
      user: User | null
      setCredentials: (token: string, user: User) => void
      logout: () => void
    }

    const AuthContext = createContext<AuthContextType | undefined>(undefined)

    export function AuthProvider({ children }: PropsWithChildren) {
      const [token, setToken] = useState<string | null>(null)
      const [user, setUser] = useState<User | null>(null)

      const setCredentials = (token: string, user: User) => {
        setToken(token)
        setUser(user)
      }

      const logout = () => {
        setToken(null)
        setUser(null)
      }

      return (
        <AuthContext.Provider value={{ token, user, setCredentials, logout }}>
          {children}
        </AuthContext.Provider>
      )
    }

    export function useAuth() {
      const context = useContext(AuthContext)
      if (!context) throw new Error('useAuth must be used within an AuthProvider')
      return context
    }
    """)

    # contexts/ApiContext.tsx
    write(project_dir / "src/contexts/ApiContext.tsx", """
    import { createContext, useContext, PropsWithChildren } from 'react'
    import axios, { AxiosInstance } from 'axios'
    import { BACKEND_URL } from '../utils/config'
    import { useAuth } from './AuthContext'
    import { Appointment, AppointmentStatus, AuthResponse, Role, Slot, User } from '../types'

    interface ApiContextType {
      api: AxiosInstance
      login: (email: string, password: string) => Promise<AuthResponse>
      register: (name: string, email: string, password: string, role: Role) => Promise<AuthResponse>
      getMe: () => Promise<User>
      createSlot: (start: string, end: string) => Promise<Slot>
      getMySlots: () => Promise<Slot[]>
      updateSlot: (id: number, start?: string, end?: string, isBooked?: boolean) => Promise<Slot>
      deleteSlot: (id: number) => Promise<{ ok: true }>
      getAvailableSlots: (doctorId: number) => Promise<Slot[]>
      getPatientAppointments: () => Promise<Appointment[]>
      getDoctorAppointments: () => Promise<Appointment[]>
      bookAppointment: (doctorId: number, slotId: number) => Promise<Appointment>
      updateAppointmentStatus: (id: number, status: AppointmentStatus) => Promise<Appointment>
      rescheduleAppointment: (id: number, newSlotId: number) => Promise<Appointment>
    }

    const ApiContext = createContext<ApiContextType | undefined>(undefined)

    export function ApiProvider({ children }: PropsWithChildren) {
      const { token } = useAuth()

      const api = axios.create({
        baseURL: BACKEND_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const login = async (email: string, password: string) => {
        const response = await api.post<AuthResponse>('/auth/login', { email, password })
        return response.data
      }

      const register = async (name: string, email: string, password: string, role: Role) => {
        const response = await api.post<AuthResponse>('/auth/register', { name, email, password, role })
        return response.data
      }

      const getMe = async () => {
        const response = await api.get<User>('/auth/me')
        return response.data
      }

      const createSlot = async (start: string, end: string) => {
        const response = await api.post<Slot>('/slots', { start, end })
        return response.data
      }

      const getMySlots = async () => {
        const response = await api.get<Slot[]>('/slots/me')
        return response.data
      }

      const updateSlot = async (id: number, start?: string, end?: string, isBooked?: boolean) => {
        const response = await api.patch<Slot>(`/slots/${id}`, { start, end, isBooked })
        return response.data
      }

      const deleteSlot = async (id: number) => {
        const response = await api.delete<{ ok: true }>(`/slots/${id}`)
        return response.data
      }

      const getAvailableSlots = async (doctorId: number) => {
        const response = await api.get<Slot[]>(`/slots/doctor/${doctorId}`)
        return response.data
      }

      const getPatientAppointments = async () => {
        const response = await api.get<Appointment[]>('/appointments/me')
        return response.data
      }

      const getDoctorAppointments = async () => {
        const response = await api.get<Appointment[]>('/appointments/doctor/me')
        return response.data
      }

      const bookAppointment = async (doctorId: number, slotId: number) => {
        const response = await api.post<Appointment>('/appointments/book', { doctorId, slotId })
        return response.data
      }

      const updateAppointmentStatus = async (id: number, status: AppointmentStatus) => {
        const response = await api.patch<Appointment>(`/appointments/${id}/status`, { status })
        return response.data
      }

      const rescheduleAppointment = async (id: number, newSlotId: number) => {
        const response = await api.patch<Appointment>(`/appointments/${id}/reschedule`, { newSlotId })
        return response.data
      }

      return (
        <ApiContext.Provider
          value={{
            api,
            login,
            register,
            getMe,
            createSlot,
            getMySlots,
            updateSlot,
            deleteSlot,
            getAvailableSlots,
            getPatientAppointments,
            getDoctorAppointments,
            bookAppointment,
            updateAppointmentStatus,
            rescheduleAppointment,
          }}
        >
          {children}
        </ApiContext.Provider>
      )
    }

    export function useApi() {
      const context = useContext(ApiContext)
      if (!context) throw new Error('useApi must be used within an ApiProvider')
      return context
    }
    """)

    # components/Protected.tsx
    write(project_dir / "src/components/Protected.tsx", """
    import { Navigate, Outlet } from 'react-router-dom'
    import { useAuth } from '../contexts/AuthContext'

    export default function Protected() {
      const { token } = useAuth()
      if (!token) return <Navigate to="/login" replace />
      return <Outlet />
    }
    """)

    # components/RoleGuard.tsx
    write(project_dir / "src/components/RoleGuard.tsx", """
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
    """)

    # components/ui/Button.tsx
    write(project_dir / "src/components/ui/Button.tsx", """
    import { ButtonHTMLAttributes } from 'react'
    import clsx from 'classnames'

    export default function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
      return (
        <button
          className={clsx('px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60', className)}
          {...props}
        />
      )
    }
    """)

    # components/ui/Card.tsx
    write(project_dir / "src/components/ui/Card.tsx", """
    import { PropsWithChildren } from 'react'
    import clsx from 'classnames'

    export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
      return <div className={clsx('bg-white shadow rounded p-4', className)}>{children}</div>
    }
    """)

    # components/ui/Input.tsx
    write(project_dir / "src/components/ui/Input.tsx", """
    import { InputHTMLAttributes } from 'react'
    import clsx from 'classnames'

    export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
      return (
        <input
          className={clsx(
            'border rounded px-3 py-2 w-full outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            className
          )}
          {...props}
        />
      )
    }
    """)

    # layouts/BaseLayout.tsx
    write(project_dir / "src/layouts/BaseLayout.tsx", """
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
    """)

    # layouts/PatientLayout.tsx
    write(project_dir / "src/layouts/PatientLayout.tsx", """
    import { Link, Outlet, useLocation } from 'react-router-dom'
    import BaseLayout from './BaseLayout'
    import clsx from 'classnames'

    const menu = [
      { to: '/patient/book', label: 'Book appointment' },
      { to: '/patient/appointments', label: 'My appointments' },
    ]

    export default function PatientLayout() {
      const { pathname } = useLocation()

      return (
        <BaseLayout>
          <div className="flex">
            <aside className="w-56 bg-white shadow h-[calc(100vh-3.5rem)]">
              <nav className="p-4 space-y-2">
                {menu.map((m) => (
                  <Link
                    key={m.to}
                    to={m.to}
                    className={clsx(
                      'block px-3 py-2 rounded hover:bg-gray-100',
                      pathname.startsWith(m.to) && 'bg-gray-200 font-semibold'
                    )}
                  >
                    {m.label}
                  </Link>
                ))}
              </nav>
            </aside>
            <section className="flex-1 p-6">
              <Outlet />
            </section>
          </div>
        </BaseLayout>
      )
    }
    """)

    # layouts/DoctorLayout.tsx
    write(project_dir / "src/layouts/DoctorLayout.tsx", """
    import { Link, Outlet, useLocation } from 'react-router-dom'
    import BaseLayout from './BaseLayout'
    import clsx from 'classnames'

    const menu = [
      { to: '/doctor/slots', label: 'My time slots' },
      { to: '/doctor/appointments', label: 'Appointments' },
    ]

    export default function DoctorLayout() {
      const { pathname } = useLocation()

      return (
        <BaseLayout>
          <div className="flex">
            <aside className="w-56 bg-white shadow h-[calc(100vh-3.5rem)]">
              <nav className="p-4 space-y-2">
                {menu.map((m) => (
                  <Link
                    key={m.to}
                    to={m.to}
                    className={clsx(
                      'block px-3 py-2 rounded hover:bg-gray-100',
                      pathname.startsWith(m.to) && 'bg-gray-200 font-semibold'
                    )}
                  >
                    {m.label}
                  </Link>
                ))}
              </nav>
            </aside>
            <section className="flex-1 p-6">
              <Outlet />
            </section>
          </div>
        </BaseLayout>
      )
    }
    """)

    # pages/auth/Login.tsx
    write(project_dir / "src/pages/auth/Login.tsx", """
    import { useForm } from 'react-hook-form'
    import { z } from 'zod'
    import { zodResolver } from '@hookform/resolvers/zod'
    import { useAuth } from '../../contexts/AuthContext'
    import { useApi } from '../../contexts/ApiContext'
    import { Link, Navigate } from 'react-router-dom'
    import { Role } from '../../types'
    import Input from '../../components/ui/Input'
    import Button from '../../components/ui/Button'

    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })

    type FormData = z.infer<typeof schema>

    export default function Login() {
      const { token, user, setCredentials } = useAuth()
      const { login } = useApi()
      const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
      })

      if (token && user) {
        return <Navigate to={user.role === Role.DOCTOR ? '/doctor' : '/patient'} replace />
      }

      const onSubmit = async (data: FormData) => {
        try {
          const resp = await login(data.email, data.password)
          setCredentials(resp.token, resp.user)
        } catch (e: any) {
          alert(e?.response?.data?.message || 'Login failed')
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded shadow w-full max-w-md space-y-4">
            <h1 className="text-xl font-semibold">Login</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input placeholder="Email" type="email" {...register('email')} />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>

              <div>
                <Input placeholder="Password" type="password" {...register('password')} />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
              </div>

              <Button type="submit">
                Login
              </Button>
            </form>

            <p className="text-sm text-gray-600">
              New here? <Link to="/register" className="text-blue-600">Register</Link>
            </p>
          </div>
        </div>
      )
    }
    """)

    # pages/auth/Register.tsx
    write(project_dir / "src/pages/auth/Register.tsx", """
    import { useForm } from 'react-hook-form'
    import { z } from 'zod'
    import { zodResolver } from '@hookform/resolvers/zod'
    import { useAuth } from '../../contexts/AuthContext'
    import { useApi } from '../../contexts/ApiContext'
    import { Link, Navigate } from 'react-router-dom'
    import { Role } from '../../types'
    import Input from '../../components/ui/Input'
    import Button from '../../components/ui/Button'

    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.nativeEnum(Role),
    })

    type FormData = z.infer<typeof schema>

    export default function Register() {
      const { token, user, setCredentials } = useAuth()
      const { register: registerUser } = useApi()
      const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { role: Role.PATIENT }
      })

      if (token && user) {
        return <Navigate to={user.role === Role.DOCTOR ? '/doctor' : '/patient'} replace />
      }

      const onSubmit = async (data: FormData) => {
        try {
          const resp = await registerUser(data.name, data.email, data.password, data.role)
          setCredentials(resp.token, resp.user)
        } catch (e: any) {
          alert(e?.response?.data?.message || 'Register failed')
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded shadow w-full max-w-md space-y-4">
            <h1 className="text-xl font-semibold">Register</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input placeholder="Name" {...register('name')} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              <div>
                <Input placeholder="Email" type="email" {...register('email')} />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>
              <div>
                <Input placeholder="Password" type="password" {...register('password')} />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Role</label>
                <select
                  className="border rounded px-3 py-2 w-full outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  {...register('role')}
                >
                  <option value={Role.PATIENT}>PATIENT</option>
                  <option value={Role.DOCTOR}>DOCTOR</option>
                </select>
              </div>

              <Button type="submit">
                Register
              </Button>
            </form>

            <p className="text-sm text-gray-600">
              Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
            </p>
          </div>
        </div>
      )
    }
    """)

    # pages/patient/BookAppointment.tsx
    write(project_dir / "src/pages/patient/BookAppointment.tsx", """
    import { useState, useEffect } from 'react'
    import { useApi } from '../../contexts/ApiContext'
    import Button from '../../components/ui/Button'
    import Input from '../../components/ui/Input'

    export default function PatientBook() {
      const [doctorId, setDoctorId] = useState<number>(1)
      const [slots, setSlots] = useState<any[]>([])
      const [selected, setSelected] = useState<number>()
      const [isFetching, setIsFetching] = useState(false)
      const { getAvailableSlots, bookAppointment } = useApi()

      const fetchSlots = async () => {
        if (!doctorId) return
        setIsFetching(true)
        try {
          const data = await getAvailableSlots(doctorId)
          setSlots(data)
        } catch (e: any) {
          alert(e?.response?.data?.message || 'Failed to load slots')
        } finally {
          setIsFetching(false)
        }
      }

      const handleBook = async () => {
        if (!selected) return
        try {
          await bookAppointment(doctorId, selected)
          alert('Booked!')
          fetchSlots()
        } catch (e: any) {
          alert(e?.response?.data?.message || 'Failed')
        }
      }

      return (
        <div className="space-y-6">
          <h1 className="text-xl font-semibold">Book an appointment</h1>

          <div className="flex items-center gap-2">
            <label className="text-sm">Doctor ID</label>
            <Input
              type="number"
              value={doctorId}
              onChange={(e) => setDoctorId(parseInt(e.target.value || '0'))}
              className="w-32"
            />
            <Button onClick={fetchSlots} disabled={!doctorId || isFetching}>
              {isFetching ? 'Loading...' : 'Load slots'}
            </Button>
          </div>

          {slots.length > 0 ? (
            <div className="space-y-2">
              <h2 className="font-medium">Available slots for doctor #{doctorId}</h2>
              <select
                className="border rounded px-3 py-2"
                value={selected}
                onChange={(e) => setSelected(parseInt(e.target.value))}
              >
                <option value="">Select a slot</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} — {new Date(s.start).toLocaleString()} → {new Date(s.end).toLocaleString()}
                  </option>
                ))}
              </select>

              <div>
                <Button onClick={handleBook} disabled={!selected}>
                  Book
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No slots loaded / available</p>
          )}
        </div>
      )
    }
    """)

    # pages/patient/MyAppointments.tsx
    write(project_dir / "src/pages/patient/MyAppointments.tsx", """
    import { useState, useEffect } from 'react'
    import { useApi } from '../../contexts/ApiContext'

    export default function PatientMyAppointments() {
      const [appointments, setAppointments] = useState<any[]>([])
      const [isFetching, setIsFetching] = useState(false)
      const { getPatientAppointments } = useApi()

      const fetchAppointments = async () => {
        setIsFetching(true)
        try {
          const data = await getPatientAppointments()
          setAppointments(data)
        } catch (e: any) {
          alert(e?.response?.data?.message || 'Failed to load appointments')
        } finally {
          setIsFetching(false)
        }
      }

      useEffect(() => {
        fetchAppointments()
      }, [])

      return (
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">My Appointments</h1>
          <button className="text-blue-600 text-sm" onClick={fetchAppointments}>
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>

          {!appointments.length && <p className="text-gray-600">No appointments.</p>}
          <div className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="bg-white rounded shadow p-3">
                <div><strong>#{a.id}</strong> • Status: {a.status}</div>
                <div>Doctor: {a.doctor?.name} (#{a.doctorId})</div>
                <div>Slot: {new Date(a.slot!.start).toLocaleString()} → {new Date(a.slot!.end).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    """)

    # pages/doctor/Slots.tsx
    write(project_dir / "src/pages/doctor/Slots.tsx", """
    import { useState, useEffect } from 'react'
    import { useApi } from '../../contexts/ApiContext'
    import Button from '../../components/ui/Button'
    import Input from '../../components/ui/Input'

    export default function DoctorSlots() {
      const [slots, setSlots] = useState<any[]>([])
      const [isFetching, setIsFetching] = useState(false)
      const [start, setStart] = useState<string>(new Date(Date.now() + 3600_000).toISOString().slice(0, 16))
      const [end, setEnd] = useState<string>(new Date(Date.now() + 5400_000).toISOString().slice(0, 16))
      const { createSlot, getMySlots, updateSlot, deleteSlot } = useApi()

      const fetchSlots = async () => {
        setIsFetching(true)
        try {
          const data = await getMySlots()
          setSlots(data)
        } catch (e: any) {
          alert(e?.response?.data?.message || 'Failed to load slots')
        } finally {
          setIsFetching(false)
        }
      }

      useEffect(() => {
        fetchSlots()
      }, [])

      const handleCreate = async () => {
        try {
          await createSlot(new Date(start).toISOString(), new Date(end).toISOString())
          setStart(new Date(Date.now() + 3600_000).toISOString().slice(0, 16))
          setEnd(new Date(Date.now() + 5400_000).toISOString().slice(0, 16))
          fetchSlots()
        } catch (e: any) {
          alert(e?.response?.data?.message || 'Failed')
        }
      }

      return (
        <div className="space-y-6">
          <h1 className="text-xl font-semibold">My Time Slots</h1>

          <div className="bg-white p-4 rounded shadow space-y-4">
            <h2 className="font-medium">Create a slot</h2>
            <div className="flex flex-wrap items-center gap-2">
              <label>Start</label>
              <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="w-60" />

              <label>End</label>
              <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="w-60" />

              <Button onClick={handleCreate}>
                Create
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="text-blue-600 text-sm" onClick={fetchSlots}>
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="space-y-2">
            {!slots.length && <p className="text-gray-600">No slots.</p>}
            {slots.map((s) => (
              <div key={s.id} className="bg-white p-4 rounded shadow space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="text-sm text-gray-600">#{s.id}</div>
                  <div className="flex items-center gap-2">
                    <span>start</span>
                    <Input
                      type="datetime-local"
                      defaultValue={new Date(s.start).toISOString().slice(0, 16)}
                      onChange={(e) => (s.start = new Date(e.target.value).toISOString())}
                      className="w-56"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>end</span>
                    <Input
                      type="datetime-local"
                      defaultValue={new Date(s.end).toISOString().slice(0, 16)}
                      onChange={(e) => (s.end = new Date(e.target.value).toISOString())}
                      className="w-56"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      defaultChecked={s.isBooked}
                      onChange={(e) => (s.isBooked = e.target.checked)}
                    />
                    <span>booked</span>
                  </div>

                  <Button
                    className="ml-auto"
                    onClick={async () => {
                      try {
                        await updateSlot(s.id, s.start, s.end, s.isBooked)
                        fetchSlots()
                      } catch (e: any) {
                        alert(e?.response?.data?.message || 'Update failed')
                      }
                    }}
                  >
                    Save
                  </Button>

                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={async () => {
                      try {
                        await deleteSlot(s.id)
                        fetchSlots()
                      } catch (e: any) {
                        alert(e?.response?.data?.message || 'Delete failed')
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    """)

    # pages/doctor/Appointments.tsx
    write(project_dir / "src/pages/doctor/Appointments.tsx", """
    import { useState, useEffect } from 'react'
    import { useApi } from '../../contexts/ApiContext'
    import { AppointmentStatus } from '../../types'
    import Button from '../../components/ui/Button'
    import Input from '../../components/ui/Input'

    export default function DoctorAppointments() {
      const [appointments, setAppointments] = useState<any[]>([])
      const [isFetching, setIsFetching] = useState(false)
      const { getDoctorAppointments, updateAppointmentStatus, rescheduleAppointment } = useApi()

      const fetchAppointments = async () => {
        setIsFetching(true)
        try {
          const data = await getDoctorAppointments()
          setAppointments(data)
        } catch (e: any) {
          alert(e?.response?.data?.message || 'Failed to load appointments')
        } finally {
          setIsFetching(false)
        }
      }

      useEffect(() => {
        fetchAppointments()
      }, [])

      return (
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Appointments</h1>
          <button className="text-blue-600 text-sm" onClick={fetchAppointments}>
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>

          {!appointments.length && <p className="text-gray-600">No appointments.</p>}
          <div className="space-y-2">
            {appointments.map((a) => (
              <div key={a.id} className="bg-white rounded shadow p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div><strong>#{a.id}</strong> • Status: <span className="font-semibold">{a.status}</span></div>
                    <div>Patient: {a.patient?.name} (#{a.patientId})</div>
                    <div>Slot: {new Date(a.slot!.start).toLocaleString()} → {new Date(a.slot!.end).toLocaleString()}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          await updateAppointmentStatus(a.id, 'CONFIRMED')
                          fetchAppointments()
                        } catch (e: any) {
                          alert(e?.response?.data?.message || 'Failed')
                        }
                      }}
                    >
                      Confirm
                    </Button>

                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={async () => {
                        try {
                          await updateAppointmentStatus(a.id, 'CANCELLED')
                          fetchAppointments()
                        } catch (e: any) {
                          alert(e?.response?.data?.message || 'Failed')
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-2">
                  <RescheduleForm
                    id={a.id}
                    onReschedule={async (slotId) => {
                      try {
                        await rescheduleAppointment(a.id, slotId)
                        fetchAppointments()
                      } catch (e: any) {
                        alert(e?.response?.data?.message || 'Failed')
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    function RescheduleForm({ id, onReschedule }: { id: number; onReschedule: (slotId: number) => Promise<void> }) {
      const [slotId, setSlotId] = useState<number>(0)

      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Reschedule to slotId</span>
          <Input
            type="number"
            value={slotId}
            onChange={(e) => setSlotId(parseInt(e.target.value || '0'))}
            className="w-32"
          />
          <Button onClick={() => onReschedule(slotId)} disabled={!slotId}>
            Reschedule
          </Button>
        </div>
      )
    }
    """)

    # pages/NotFound.tsx
    write(project_dir / "src/pages/NotFound.tsx", """
    import { Link } from 'react-router-dom'

    export default function NotFound() {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">404</h1>
            <p className="text-gray-600">Page not found</p>
            <Link to="/" className="text-blue-600">Go Home</Link>
          </div>
        </div>
      )
    }
    """)

    # Cypress
    write(project_dir / "cypress.config.ts", """
    import { defineConfig } from "cypress";

    export default defineConfig({
      e2e: {
        baseUrl: "http://localhost:5173",
      },
    });
    """)

    write(project_dir / "cypress/e2e/smoke.cy.ts", """
    describe('Smoke', () => {
      it('shows login page', () => {
        cy.visit('/login')
        cy.contains('Login')
      })
    })
    """)

    print("\n✅ Frontend scaffolded with Context API!")

    print(f"""
Next steps:

  cd {project_name}
  npm install
  npm run dev

Environment:
  - Set your backend URL in .env: VITE_BACKEND_URL=http://localhost:3000

Available routes:

  /login, /register

  Patient:
    /patient/book
    /patient/appointments

  Doctor:
    /doctor/slots
    /doctor/appointments

Cypress:
  npm run cy:open

Have fun!
""")

if __name__ == "__main__":
    main()