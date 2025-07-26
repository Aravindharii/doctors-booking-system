import { createContext, useContext, PropsWithChildren } from 'react'
import axios, { AxiosInstance } from 'axios'
import { BACKEND_URL } from '../utils/config'
import { useAuth } from './AuthContext'
import {
  Appointment,
  AppointmentStatus,
  Role,
  Slot,
  User,
  Doctor, // 👈 add this to your src/types.ts and import it
} from '../types'

interface ApiContextType {
  api: AxiosInstance
  login: (email: string, password: string) => Promise<AuthResponse>
  register: (name: string, email: string, password: string, role: Role) => Promise<AuthResponse>
  getMe: () => Promise<User>
  /** 👇 NEW */
  getDoctors: () => Promise<Doctor[]>
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

  /** 👇 NEW */
  const getDoctors = async () => {
    const response = await api.get<Doctor[]>('/doctors')
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
        getDoctors, // 👈 expose it
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
