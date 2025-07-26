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
