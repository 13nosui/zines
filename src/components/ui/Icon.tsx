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
        filled && 'filled',
        className
      )}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`
      }}
    >
      {name}
    </span>
  )
}