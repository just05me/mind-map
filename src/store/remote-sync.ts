import type { Project } from '../model/types'
import { deleteRemoteProject, upsertRemoteProject } from './api'
import { toPersistedProject } from './storage'

export function createRemoteSync() {
  const knownIds = new Set<string>()
  const lastJson = new Map<string, string>()

  return {
    mark(projects: Project[]) {
      knownIds.clear()
      lastJson.clear()
      for (const project of projects) {
        const persisted = toPersistedProject(project)
        knownIds.add(project.id)
        lastJson.set(project.id, JSON.stringify(persisted))
      }
    },
    async flush(projects: Project[]): Promise<void> {
      const localIds = new Set(projects.map((project) => project.id))
      for (const id of [...knownIds]) {
        if (localIds.has(id)) continue
        await deleteRemoteProject(id)
        knownIds.delete(id)
        lastJson.delete(id)
      }
      for (const project of projects) {
        const persisted = toPersistedProject(project)
        const json = JSON.stringify(persisted)
        if (lastJson.get(project.id) === json) continue
        await upsertRemoteProject(persisted)
        knownIds.add(project.id)
        lastJson.set(project.id, json)
      }
    },
  }
}
