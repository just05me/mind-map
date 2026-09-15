import type { Project } from '../model/types'
import { hydrateProject, isProject } from './storage'

export type AuthUser = {
  id: string
  email: string
  createdAt: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'include',
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new Error('Сервер недоступен')
  }

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : 'Ошибка запроса'
    throw new Error(error)
  }
  return data as T
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await request<{ user: AuthUser }>('/auth/me')
    return data.user
  } catch {
    return null
  }
}

export async function registerUser(email: string, password: string): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return data.user
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return data.user
}

export async function logoutUser(): Promise<void> {
  await request<{ ok: true }>('/auth/logout', { method: 'POST' })
}

function readProjects(data: { projects: unknown }): Project[] {
  return Array.isArray(data.projects) ? data.projects.filter(isProject).map(hydrateProject) : []
}

export async function listRemoteProjects(): Promise<Project[]> {
  return readProjects(await request<{ projects: unknown }>('/projects'))
}

export async function upsertRemoteProject(project: Project): Promise<Project> {
  const data = await request<{ project: unknown }>(`/projects/${project.id}`, {
    method: 'PUT',
    body: JSON.stringify({ project }),
  })
  if (!isProject(data.project)) {
    throw new Error('Сервер вернул некорректный проект')
  }
  return hydrateProject(data.project)
}

export async function deleteRemoteProject(id: string): Promise<void> {
  await request<{ ok: true }>(`/projects/${id}`, { method: 'DELETE' })
}
