export interface Settings {
  rootFolderId: string | null
  activeBoardId: string | null
}

const DEFAULTS: Settings = { rootFolderId: null, activeBoardId: null }

export async function getSettings(): Promise<Settings> {
  return (await chrome.storage.sync.get(DEFAULTS)) as Settings
}

export async function setSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.sync.set(patch)
}
