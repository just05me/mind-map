import { useState, type FormEvent } from 'react'
import { useAuth } from '../store/AuthContext'
import { useApp } from '../store/AppContext'
import { Icon } from './Icon'

type AuthMode = 'login' | 'register'

export function LoadingScreen() {
  return (
    <div className="flex h-full items-center justify-center bg-[var(--bg)] text-[var(--muted)]">
      Загрузка…
    </div>
  )
}

export function AuthScreen() {
  const { login, register } = useAuth()
  const { state, setTheme } = useApp()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="chrome-bar flex h-12 items-center justify-end px-3">
        <button
          type="button"
          className="icon-btn"
          data-tip={state.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          aria-label={state.theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
        >
          <Icon name={state.theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="chrome-heavy w-full max-w-sm space-y-4 rounded-2xl p-6"
        >
          <div>
            <h1 className="display text-xl font-semibold">Доска схем</h1>
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              {mode === 'login' ? 'Войдите, чтобы открыть проекты' : 'Создайте аккаунт, чтобы сохранять схемы'}
            </p>
          </div>
          <label className="block space-y-1 text-[12px] text-[var(--muted)]">
            Почта
            <input
              className="field text-[13px] text-[var(--text)]"
              type="email"
              autoComplete="email"
              required
              value={email}
              aria-label="Почта"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block space-y-1 text-[12px] text-[var(--muted)]">
            Пароль
            <input
              className="field text-[13px] text-[var(--text)]"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              aria-label="Пароль"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="text-[12px] text-red-500">{error}</p> : null}
          <button type="submit" className="btn-primary w-full py-2 text-[13px]" disabled={pending}>
            {pending ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
          <button
            type="button"
            className="btn-ghost w-full justify-center text-[13px]"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError(null)
            }}
          >
            {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
