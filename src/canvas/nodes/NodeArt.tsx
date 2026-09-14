import type { NodeShape } from '../../model/node-design'

/**
 * The large signature silhouette drawn inside shape nodes (cylinder, rack, …),
 * tinted with the node's accent color. Rendered at a fixed 76×58 box.
 */
export function NodeArt({ shape, color }: { shape: NodeShape; color: string }) {
  const fill = `${color}1f`
  const common = {
    width: 76,
    height: 58,
    viewBox: '0 0 76 58',
    fill: 'none' as const,
    stroke: color,
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (shape) {
    case 'cylinder':
      return (
        <svg {...common} aria-hidden>
          <path d="M14 12v34c0 3.9 10.7 7 24 7s24-3.1 24-7V12" fill={fill} />
          <ellipse cx="38" cy="12" rx="24" ry="7" fill={fill} />
          <path d="M14 24c0 3.9 10.7 7 24 7s24-3.1 24-7M14 35c0 3.9 10.7 7 24 7s24-3.1 24-7" />
        </svg>
      )
    case 'rack':
      return (
        <svg {...common} aria-hidden>
          <rect x="12" y="6" width="52" height="46" rx="6" fill={fill} />
          <path d="M12 21h52M12 37h52" />
          <path d="M44 13.5h10M44 29h10M44 44.5h10" />
          <circle cx="21" cy="13.5" r="1.6" fill={color} stroke="none" />
          <circle cx="21" cy="29" r="1.6" fill={color} stroke="none" />
          <circle cx="21" cy="44.5" r="1.6" fill={color} stroke="none" />
        </svg>
      )
    case 'cloud':
      return (
        <svg {...common} aria-hidden>
          <path
            d="M24 47a13 13 0 010-26 16 16 0 0130.5-4A11 11 0 0154 47z"
            fill={fill}
          />
        </svg>
      )
    case 'circle':
      return (
        <svg {...common} aria-hidden>
          <circle cx="38" cy="29" r="23" fill={fill} />
          <circle cx="38" cy="24" r="6.5" />
          <path d="M27 43a11 11 0 0122 0" />
        </svg>
      )
    case 'pill':
      return (
        <svg {...common} aria-hidden>
          <rect x="8" y="16" width="60" height="26" rx="13" fill={fill} />
          <path d="M30 23l6 6-6 6M36 29H20" />
        </svg>
      )
    case 'stack':
      return (
        <svg {...common} aria-hidden>
          <rect x="14" y="10" width="48" height="12" rx="4" fill={fill} />
          <rect x="14" y="24" width="48" height="12" rx="4" fill={fill} />
          <rect x="14" y="38" width="48" height="12" rx="4" fill={fill} />
        </svg>
      )
    case 'hexagon':
      return (
        <svg {...common} aria-hidden>
          <path d="M38 5l26 12v24L38 53 12 41V17z" fill={fill} />
          <path d="M12 17l26 12 26-12M38 29v24" />
        </svg>
      )
    case 'card':
      return null
    default: {
      const _never: never = shape
      return _never
    }
  }
}
