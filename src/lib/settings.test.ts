import { describe, it, expect } from 'vitest'
import { getSettings, setSettings } from './settings'

describe('settings', () => {
  it('returns defaults when storage empty', async () => {
    const s = await getSettings()
    expect(s).toEqual({ rootFolderId: null, activeBoardId: null })
  })

  it('persists a partial patch and merges with existing', async () => {
    await setSettings({ rootFolderId: 'root-1' })
    await setSettings({ activeBoardId: 'board-9' })
    const s = await getSettings()
    expect(s).toEqual({ rootFolderId: 'root-1', activeBoardId: 'board-9' })
  })
})
