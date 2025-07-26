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
