import { describe, it, expect, beforeEach } from 'vitest'
import { createFakeChrome } from './fake-chrome'

describe('fake-chrome bookmarks', () => {
  beforeEach(() => {
    globalThis.chrome = createFakeChrome([
      { id: '1', title: 'Bookmarks Bar', children: [] },
    ]) as unknown as typeof chrome
  })

  it('creates a folder under a parent and returns it with an id', async () => {
    const node = await chrome.bookmarks.create({ parentId: '1', title: 'Board A' })
    expect(node.id).toBeTruthy()
    expect(node.parentId).toBe('1')
    const children = await chrome.bookmarks.getChildren('1')
    expect(children.map((c) => c.title)).toEqual(['Board A'])
  })

  it('fires onCreated when a node is created', async () => {
    let firedId = ''
    chrome.bookmarks.onCreated.addListener((id) => { firedId = id })
    const node = await chrome.bookmarks.create({ parentId: '1', title: 'X' })
    expect(firedId).toBe(node.id)
  })

  it('moves a node to a new parent and index', async () => {
    const a = await chrome.bookmarks.create({ parentId: '1', title: 'A' })
    const b = await chrome.bookmarks.create({ parentId: '1', title: 'B' })
    await chrome.bookmarks.move(b.id, { parentId: '1', index: 0 })
    const children = await chrome.bookmarks.getChildren('1')
    expect(children.map((c) => c.id)).toEqual([b.id, a.id])
  })

  it('stores and reads chrome.storage.sync', async () => {
    await chrome.storage.sync.set({ rootFolderId: 'abc' })
    const got = await chrome.storage.sync.get({ rootFolderId: null })
    expect(got.rootFolderId).toBe('abc')
  })
})
