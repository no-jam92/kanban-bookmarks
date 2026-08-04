import { describe, it, expect, beforeEach } from 'vitest'
import { createFakeChrome, type FakeNode } from '../test/fake-chrome'
import {
  ensureRootFolder, listBoards, getBoard,
  createBoard, createColumn, createCard,
  renameNode, removeFolder, removeCard, moveNode, updateCard,
} from './bookmarks'
import { getSettings, setSettings } from './settings'

const seed = (nodes: FakeNode[]) => {
  globalThis.chrome = createFakeChrome(nodes) as unknown as typeof chrome
}

beforeEach(() => {
  seed([{ id: '1', title: 'Bookmarks Bar', children: [] }])
})

describe('ensureRootFolder', () => {
  it('creates a Kanban folder and saves its id when none set', async () => {
    const id = await ensureRootFolder()
    const children = await chrome.bookmarks.getChildren('1')
    expect(children[0].title).toBe('Kanban')
    expect(children[0].id).toBe(id)
    expect((await getSettings()).rootFolderId).toBe(id)
  })

  it('reuses the saved root folder when still valid', async () => {
    const first = await ensureRootFolder()
    const second = await ensureRootFolder()
    expect(second).toBe(first)
    const children = await chrome.bookmarks.getChildren('1')
    expect(children).toHaveLength(1)
  })

  // 계정 북마크(bookmarks in your Google Account)를 쓰는 프로필에서는
  // 북마크바 id가 '1'이 아니다 → 하드코딩하면 "Can't find parent bookmark for id."
  it('resolves the bookmarks bar by folderType when its id is not "1"', async () => {
    seed([
      { id: '7', title: 'Bookmarks bar', folderType: 'bookmarks-bar', children: [] },
      { id: '8', title: 'Other bookmarks', folderType: 'other', children: [] },
    ])
    const id = await ensureRootFolder()
    const children = await chrome.bookmarks.getChildren('7')
    expect(children.map((c) => c.title)).toEqual(['Kanban'])
    expect(children[0].id).toBe(id)
  })

  it('adopts an existing Kanban folder in the bar instead of creating a duplicate', async () => {
    seed([
      {
        id: '1', title: 'Bookmarks Bar', folderType: 'bookmarks-bar',
        children: [{ id: '11', title: 'Kanban', children: [{ id: '12', title: 'Work', children: [] }] }],
      },
    ])
    const id = await ensureRootFolder()
    expect(id).toBe('11')
    expect(await chrome.bookmarks.getChildren('1')).toHaveLength(1)
    expect((await getSettings()).rootFolderId).toBe('11')
    expect((await listBoards(id)).map((b) => b.title)).toEqual(['Work'])
  })

  it('adopts a Kanban folder that lives outside the bookmarks bar', async () => {
    seed([
      { id: '1', title: 'Bookmarks Bar', folderType: 'bookmarks-bar', children: [] },
      {
        id: '2', title: 'Other bookmarks', folderType: 'other',
        children: [{ id: '21', title: 'Kanban', children: [] }],
      },
    ])
    expect(await ensureRootFolder()).toBe('21')
    expect(await chrome.bookmarks.getChildren('1')).toHaveLength(0)
  })

  it('ignores a saved rootFolderId that points to a bookmark instead of a folder', async () => {
    seed([
      {
        id: '1', title: 'Bookmarks Bar', folderType: 'bookmarks-bar',
        children: [{ id: '11', title: 'Not a folder', url: 'https://a.com' }],
      },
    ])
    await setSettings({ rootFolderId: '11' })
    const id = await ensureRootFolder()
    expect(id).not.toBe('11')
    const created = (await chrome.bookmarks.getChildren('1')).find((n) => n.id === id)
    expect(created?.title).toBe('Kanban')
  })

  it('throws a readable error when no bookmark folder can be resolved', async () => {
    seed([])
    await expect(ensureRootFolder()).rejects.toThrow('북마크바 폴더를 찾을 수 없습니다')
  })
})

describe('board/column/card model', () => {
  it('builds a board tree, treating url nodes as cards and folders as columns', async () => {
    const root = await ensureRootFolder()
    const board = await createBoard(root, 'Work')
    const todo = await createColumn(board, 'To Do')
    await createCard(todo, 'Svelte', 'https://svelte.dev')
    await createCard(todo, 'Vite', 'https://vite.dev')

    const boards = await listBoards(root)
    expect(boards.map((b) => b.title)).toEqual(['Work'])

    const built = await getBoard(board)
    expect(built.columns.map((c) => c.title)).toEqual(['To Do'])
    expect(built.columns[0].cards.map((c) => c.title)).toEqual(['Svelte', 'Vite'])
    expect(built.columns[0].cards[0].url).toBe('https://svelte.dev')
  })

  it('ignores non-url child folders inside a column', async () => {
    const root = await ensureRootFolder()
    const board = await createBoard(root, 'B')
    const col = await createColumn(board, 'C')
    await createCard(col, 'Card', 'https://a.com')
    await chrome.bookmarks.create({ parentId: col, title: 'stray folder' }) // no url
    const built = await getBoard(board)
    expect(built.columns[0].cards.map((c) => c.title)).toEqual(['Card'])
  })

  it('renames, removes, and moves nodes', async () => {
    const root = await ensureRootFolder()
    const board = await createBoard(root, 'B')
    const a = await createColumn(board, 'A')
    const b = await createColumn(board, 'B2')
    const card = await createCard(a, 'X', 'https://x.com')

    await renameNode(card, 'X2')
    await moveNode(card, b, 0)
    let built = await getBoard(board)
    expect(built.columns.find((c) => c.id === b)!.cards[0].title).toBe('X2')

    await removeCard(card)
    await removeFolder(a)
    built = await getBoard(board)
    expect(built.columns.map((c) => c.title)).toEqual(['B2'])
  })

  it('updateCard changes both title and url', async () => {
    const root = await ensureRootFolder()
    const board = await createBoard(root, 'B')
    const col = await createColumn(board, 'C')
    const card = await createCard(col, 'Old', 'https://old.com')
    await updateCard(card, 'New', 'https://new.com')
    const built = await getBoard(board)
    expect(built.columns[0].cards[0]).toMatchObject({ title: 'New', url: 'https://new.com' })
  })
})
