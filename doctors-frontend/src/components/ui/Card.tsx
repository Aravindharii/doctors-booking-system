import { PropsWithChildren } from 'react'
import clsx from 'classnames'

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx('bg-white shadow rounded p-4', className)}>{children}</div>
}
