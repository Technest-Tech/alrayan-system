import type { ComponentType, CSSProperties } from 'react'

/**
 * A renderable icon component (e.g. from lucide-react).
 *
 * Use this instead of `React.ElementType` for icon props/maps. Under the React
 * 19 type definitions a bare `React.ElementType` collapses a dynamic JSX tag's
 * props to `never` (TS2745/TS2322), so passing `size`/`className`/`style`
 * fails to type-check. Pinning the accepted props avoids that.
 */
export type IconComponent = ComponentType<{
  size?: number | string
  className?: string
  style?: CSSProperties
}>
