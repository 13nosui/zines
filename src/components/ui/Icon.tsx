import { cn } from '@heroui/theme'

interface IconProps {
  name: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  filled?: boolean
}

const sizeMap = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl'
}

export function Icon({ name, className, size = 'md', filled = false }: IconProps) {
  return (
    <span 
      className={cn(
        'material-symbols-rounded',
        sizeMap[size],
        filled && 'material-symbols-rounded-filled',
        className
      )}
    >
      {name}
    </span>
  )
}