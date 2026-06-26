import { describe, it, expect, beforeEach } from 'vitest'
import { createFakeChrome } from '../test/fake-chrome'
import {
  ensureRootFolder, listBoards, getBoard,
  createBoard, createColumn, createCard,
  renameNode, removeFolder, removeCard, moveNode, updateCard,
} from './bookmarks'

beforeEach(() => {
  globalThis.chrome = createFakeChrome([
    { id: '1', title: 'Bookmarks Bar', children: [] },
  ]) as unknown as typeof chrome
})

describe('ensureRootFolder', () => {
  it('creates a Kanban folder and saves its id when none set', async () => {
    const id = await ensureRootFolder()
    const children = await chrome.bookmarks.getChildren('1')
    expect(children[0].title).toBe('Kanban')
    expect(children[0].id).toBe(id)
  })

  it('reuses the saved root folder when still valid', async () => {
    const first = await ensureRootFolder()
    const second = await ensureRootFolder()
    expect(second).toBe(first)
    const children = await chrome.bookmarks.getChildren('1')
    expect(children).toHaveLength(1)
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
