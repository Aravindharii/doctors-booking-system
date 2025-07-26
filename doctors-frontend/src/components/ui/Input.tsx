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
