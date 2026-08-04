import { getSettings, setSettings } from './settings'

export interface Card { id: string; title: string; url: string; index: number }
export interface Column { id: string; title: string; index: number; cards: Card[] }
export interface BoardSummary { id: string; title: string; index: number }
export interface Board { id: string; title: string; index: number; columns: Column[] }

const ROOT_TITLE = 'Kanban'
// 예전 크롬에서 북마크바에 쓰던 고정 id. 이제는 힌트로만 쓴다.
const LEGACY_BAR_ID = '1'

// folderType은 Chrome 134+에서 추가됐고 @types/chrome에는 아직 없다.
type Node = chrome.bookmarks.BookmarkTreeNode & { folderType?: string }

async function isFolderId(id: string): Promise<boolean> {
  try {
    const [n] = await chrome.bookmarks.get(id)
    return !n.url
  } catch {
    return false
  }
}

/**
 * 북마크바 노드를 런타임에 찾는다.
 * 계정 북마크(bookmarks in your Google Account)를 쓰는 프로필에서는
 * 최상위 폴더 id가 '1'/'2'/'3'으로 고정되지 않으므로 하드코딩하면 안 된다.
 */
function pickBookmarksBar(tops: Node[]): Node {
  const folders = tops.filter((n) => !n.url && n.folderType !== 'managed')
  const bar =
    folders.find((n) => n.folderType === 'bookmarks-bar') ??
    folders.find((n) => n.id === LEGACY_BAR_ID) ??
    folders[0]
  if (!bar) {
    throw new Error('북마크바 폴더를 찾을 수 없습니다. 설정에서 칸반 루트 폴더를 직접 지정해 주세요.')
  }
  return bar
}

// 트리를 훑어 해당 제목의 폴더를 찾는다(선순회, 첫 일치).
function findFolderByTitle(nodes: Node[] | undefined, title: string): string | null {
  for (const n of nodes ?? []) {
    if (n.url) continue
    if (n.title === title) return n.id
    const hit = findFolderByTitle(n.children, title)
    if (hit) return hit
  }
  return null
}

export async function ensureRootFolder(): Promise<string> {
  const { rootFolderId } = await getSettings()
  if (rootFolderId && (await isFolderId(rootFolderId))) return rootFolderId

  const [root] = await chrome.bookmarks.getTree()
  const tops = (root.children ?? []) as Node[]
  const bar = pickBookmarksBar(tops)

  // 저장된 id가 없거나 무효해도, 이미 있는 Kanban 폴더가 있으면 그것을 이어서 쓴다.
  // 북마크바 안쪽을 먼저 보고, 없으면 트리 전체에서 찾는다.
  const existing =
    findFolderByTitle(bar.children, ROOT_TITLE) ?? findFolderByTitle(tops, ROOT_TITLE)

  const id =
    existing ?? (await chrome.bookmarks.create({ parentId: bar.id, title: ROOT_TITLE })).id
  await setSettings({ rootFolderId: id })
  return id
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

export async function updateCard(id: string, title: string, url: string): Promise<void> {
  await chrome.bookmarks.update(id, { title, url })
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
