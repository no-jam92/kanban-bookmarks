import { describe, it, expect, beforeEach } from 'vitest'
import { createFakeChrome } from '../test/fake-chrome'
import { parseStackable, importStackable } from './import'
import { ensureRootFolder, listBoards, getBoard } from './bookmarks'

const sample = {
  spacesList: {
    data: {
      'space-2': {
        name: 'Work',
        columns: {
          data: {
            c1: {
              title: 'Kurly',
              bookmarks: {
                data: {
                  t1: { content: 'A', url: 'https://a.com' },
                  t2: { content: 'B', url: 'https://b.com' },
                  t3: { content: 'NoUrl' }, // url 없음 → 스킵
                },
                order: ['t2', 't1', 't3'],
              },
            },
            c2: { title: 'Empty' }, // bookmarks 없음 → 빈 컬럼
          },
          order: ['c2', 'c1'],
        },
      },
      'space-x': {
        // name 없음 → key로 폴백
        columns: { data: { cc: { title: 'Reading' } }, order: ['cc'] },
      },
    },
    order: ['space-2', 'space-x'],
  },
}

describe('parseStackable', () => {
  it('maps spaces→boards, columns, bookmarks→cards in order', () => {
    const boards = parseStackable(sample)
    expect(boards.map((b) => b.name)).toEqual(['Work', 'space-x'])
    expect(boards[0].columns.map((c) => c.title)).toEqual(['Empty', 'Kurly'])
    expect(boards[0].columns[1].cards.map((c) => c.title)).toEqual(['B', 'A'])
    expect(boards[0].columns[1].cards[0].url).toBe('https://b.com')
  })

  it('skips bookmarks without a url and keeps columns with no bookmarks empty', () => {
    const boards = parseStackable(sample)
    expect(boards[0].columns[1].cards).toHaveLength(2) // t3 skipped
    expect(boards[0].columns[0].cards).toEqual([]) // Empty column
    expect(boards[1].columns.map((c) => c.title)).toEqual(['Reading'])
  })

  it('throws on non-Stackable input', () => {
    expect(() => parseStackable({})).toThrow()
    expect(() => parseStackable(null)).toThrow()
  })
})

describe('importStackable', () => {
  beforeEach(() => {
    globalThis.chrome = createFakeChrome([
      { id: '1', title: 'Bookmarks Bar', children: [] },
    ]) as unknown as typeof chrome
  })

  it('creates boards/columns/cards under the root and reports counts', async () => {
    const root = await ensureRootFolder()
    const boards = parseStackable(sample)
    const summary = await importStackable(root, boards)
    expect(summary).toEqual({ boards: 2, columns: 3, cards: 2 })

    const list = await listBoards(root)
    expect(list.map((b) => b.title)).toEqual(['Work', 'space-x'])

    const work = await getBoard(list[0].id)
    expect(work.columns.map((c) => c.title)).toEqual(['Empty', 'Kurly'])
    expect(work.columns[1].cards.map((c) => c.title)).toEqual(['B', 'A'])
  })
})
