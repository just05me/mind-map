const UI_KEY = 'mind-map.ui.v1'

export type UiPrefs = {
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  minimapOpen: boolean
}

const DEFAULTS: UiPrefs = { leftPanelOpen: true, rightPanelOpen: true, minimapOpen: false }

export function loadUiPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(UI_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<UiPrefs>
    return {
      leftPanelOpen: typeof parsed.leftPanelOpen === 'boolean' ? parsed.leftPanelOpen : DEFAULTS.leftPanelOpen,
      rightPanelOpen: typeof parsed.rightPanelOpen === 'boolean' ? parsed.rightPanelOpen : DEFAULTS.rightPanelOpen,
      minimapOpen: typeof parsed.minimapOpen === 'boolean' ? parsed.minimapOpen : DEFAULTS.minimapOpen,
    }
  } catch {
    return DEFAULTS
  }
}

export function saveUiPrefs(prefs: UiPrefs): void {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify(prefs))
  } catch {
    // Storage can be unavailable (private mode); panels just reset next time.
  }
}
