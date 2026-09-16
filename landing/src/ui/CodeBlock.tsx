import { useEffect, useState } from 'react'
import { Icon } from './Icon'

export function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = () => {
    setError(null)
    if (!navigator.clipboard) {
      setError('Буфер обмена недоступен')
      return
    }
    void navigator.clipboard
      .writeText(code)
      .then(() => setCopied(true))
      .catch(() => setError('Не удалось скопировать'))
  }

  return (
    <div className="code-block relative min-w-0 max-w-full overflow-hidden rounded-frame border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-[11.5px] text-white/60">
        <span className="flex items-center gap-1.5">
          <Icon name="terminal" size={13} />
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Скопировать: ${label}`}
          className="pressable inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Icon name={copied ? 'check' : 'copy'} size={13} />
          {error ?? (copied ? 'Скопировано' : 'Скопировать')}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto px-4 py-3">
        <code>{code}</code>
      </pre>
    </div>
  )
}
