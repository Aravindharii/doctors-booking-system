import { useEffect, useState } from 'react'
import { useApi } from '../../contexts/ApiContext'
import Button from '../../components/ui/Button'
import { Doctor, Slot } from '../../types'

export default function PatientBook() {
  const [doctorId, setDoctorId] = useState<number | undefined>()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [selected, setSelected] = useState<number | undefined>()
  const [isFetching, setIsFetching] = useState(false)

  const { getDoctors, getAvailableSlots, bookAppointment } = useApi()

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getDoctors()
        setDoctors(list)
        if (list.length) setDoctorId(list[0].id)
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Failed to load doctors')
      }
    }
    load()
  }, [getDoctors])

  const fetchSlots = async () => {
    if (!doctorId) return
    setIsFetching(true)
    try {
      const data = await getAvailableSlots(doctorId)
      setSlots(data)
      setSelected(undefined)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to load slots')
    } finally {
      setIsFetching(false)
    }
  }

  const handleBook = async () => {
    if (!doctorId || !selected) return
    try {
      await bookAppointment(doctorId, selected)
      alert('Booked!')
      fetchSlots()
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Book an appointment</h1>

      <div className="flex items-center gap-2">
        <label className="text-sm">Doctor</label>
        <select
          className="border rounded px-3 py-2 w-64"
          value={doctorId ?? ''}
          onChange={(e) => setDoctorId(parseInt(e.target.value))}
        >
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <Button onClick={fetchSlots} disabled={!doctorId || isFetching}>
          {isFetching ? 'Loading...' : 'Load slots'}
        </Button>
      </div>

      {slots.length > 0 ? (
        <div className="space-y-2">
          <h2 className="font-medium">
            Available slots for {doctors.find((d) => d.id === doctorId)?.name}
          </h2>
          <select
            className="border rounded px-3 py-2"
            value={selected ?? ''}
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
