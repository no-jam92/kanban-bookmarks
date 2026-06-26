import { getSettings, setSettings } from './settings'

export interface Card { id: string; title: string; url: string; index: number }
export interface Column { id: string; title: string; index: number; cards: Card[] }
export interface BoardSummary { id: string; title: string; index: number }
export interface Board { id: string; title: string; index: number; columns: Column[] }

const ROOT_TITLE = 'Kanban'
const BOOKMARKS_BAR_ID = '1'

async function nodeExists(id: string): Promise<boolean> {
  try {
    await chrome.bookmarks.get(id)
    return true
  } catch {
    return false
  }
}

export async function ensureRootFolder(): Promise<string> {
  const { rootFolderId } = await getSettings()
  if (rootFolderId && (await nodeExists(rootFolderId))) return rootFolderId
  const created = await chrome.bookmarks.create({
    parentId: BOOKMARKS_BAR_ID,
    title: ROOT_TITLE,
  })
  await setSettings({ rootFolderId: created.id })
  return created.id
}

const isFolder = (n: chrome.bookmarks.BookmarkTreeNode) => !n.url
const isCard = (n: chrome.bookmarks.BookmarkTreeNode) => !!n.url

export async function listBoards(rootId: string): Promise<BoardSummary[]> {
  const children = await chrome.bookmarks.getChildren(rootId)
  return children
    .filter(isFolder)
    .map((n) => ({ id: n.id, title: n.title, index: n.index ?? 0 }))
}

export async function getBoard(boardId: string): Promise<Board> {
  const [tree] = await chrome.bookmarks.getSubTree(boardId)
  const columns: Column[] = (tree.children ?? [])
    .filter(isFolder)
    .map((col) => ({
      id: col.id,
      title: col.title,
      index: col.index ?? 0,
      cards: (col.children ?? [])
        .filter(isCard)
        .map((c) => ({ id: c.id, title: c.title, url: c.url!, index: c.index ?? 0 })),
    }))
  return { id: tree.id, title: tree.title, index: tree.index ?? 0, columns }
}

export async function createBoard(rootId: string, title: string): Promise<string> {
  const n = await chrome.bookmarks.create({ parentId: rootId, title })
  return n.id
}

export async function createColumn(boardId: string, title: string): Promise<string> {
  const n = await chrome.bookmarks.create({ parentId: boardId, title })
  return n.id
}

export async function createCard(columnId: string, title: string, url: string): Promise<string> {
  const n = await chrome.bookmarks.create({ parentId: columnId, title, url })
  return n.id
}

export async function renameNode(id: string, title: string): Promise<void> {
  await chrome.bookmarks.update(id, { title })
}

export async function removeFolder(id: string): Promise<void> {
  await chrome.bookmarks.removeTree(id)
}

export async function removeCard(id: string): Promise<void> {
  await chrome.bookmarks.remove(id)
}

export async function moveNode(id: string, parentId: string, index: number): Promise<void> {
  await chrome.bookmarks.move(id, { parentId, index })
}
