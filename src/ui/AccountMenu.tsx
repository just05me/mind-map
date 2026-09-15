import { useState } from 'react'
import { useAuth } from '../store/AuthContext'
import { Dropdown } from './Dropdown'
import { Icon } from './Icon'
import { MenuButton } from './MenuButton'

export function AccountMenu() {
  const { user, logout } = useAuth()
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  return (
    <Dropdown
      align="right"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          className={`bar-btn ${open ? 'is-active' : ''}`}
          onClick={() => {
            setError(null)
            toggle()
          }}
          aria-label="Аккаунт"
        >
          <Icon name="user" size={15} />
          <span className="hidden max-w-[160px] truncate md:inline">{user.email}</span>
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-2.5 pb-1 pt-1.5 text-[11px] text-[var(--muted)]">{user.email}</div>
          {error ? <div className="px-2.5 py-1 text-[11px] text-red-500">{error}</div> : null}
          <MenuButton
            icon="logout"
            label="Выйти"
            onClick={() => {
              void logout()
                .then(() => close())
                .catch((err: unknown) => {
                  setError(err instanceof Error ? err.message : 'Не удалось выйти')
                })
            }}
          />
        </>
      )}
    </Dropdown>
  )
}
