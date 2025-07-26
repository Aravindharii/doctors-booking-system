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