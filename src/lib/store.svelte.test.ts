import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeChrome } from '../test/fake-chrome'
import { KanbanStore } from './store.svelte'
import { ensureRootFolder, createBoard, createColumn, createCard } from './bookmarks'

beforeEach(() => {
  globalThis.chrome = createFakeChrome([
    { id: '1', title: 'Bookmarks Bar', children: [] },
  ]) as unknown as typeof chrome
})

describe('KanbanStore', () => {
  it('init creates root, loads boards, selects first board', async () => {
    const root = await ensureRootFolder()
    const b = await createBoard(root, 'Work')
    await createColumn(b, 'To Do')

    const store = new KanbanStore()
    await store.init()
    expect(store.rootId).toBe(root)
    expect(store.boards.map((x) => x.title)).toEqual(['Work'])
    expect(store.activeBoardId).toBe(b)
    expect(store.board?.columns.map((c) => c.title)).toEqual(['To Do'])
  })

  it('reload picks up externally created cards', async () => {
    const root = await ensureRootFolder()
    const b = await createBoard(root, 'B')
    const col = await createColumn(b, 'C')
    const store = new KanbanStore()
    await store.init()
    await createCard(col, 'New', 'https://n.com')
    await store.reload()
    expect(store.board?.columns[0].cards.map((c) => c.title)).toEqual(['New'])
  })

  it('init surfaces an error instead of hanging when no bookmark folder resolves', async () => {
    globalThis.chrome = createFakeChrome([]) as unknown as typeof chrome
    const store = new KanbanStore()
    await store.init()
    expect(store.loading).toBe(false)
    expect(store.error).toContain('북마크바 폴더를 찾을 수 없습니다')
    expect(store.board).toBeNull()
  })

  it('bookmark events trigger a debounced reload', async () => {
    vi.useFakeTimers()
    const root = await ensureRootFolder()
    const b = await createBoard(root, 'B')
    const col = await createColumn(b, 'C')
    const store = new KanbanStore()
    await store.init()

    await createCard(col, 'Async', 'https://a.com') // fires onCreated
    await vi.advanceTimersByTimeAsync(100)
    expect(store.board?.columns[0].cards.map((c) => c.title)).toEqual(['Async'])
    vi.useRealTimers()
  })
})
