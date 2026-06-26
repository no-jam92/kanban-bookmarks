import { createBoard, createColumn, createCard } from './bookmarks'

export interface ImportCard { title: string; url: string }
export interface ImportColumn { title: string; cards: ImportCard[] }
export interface ImportBoard { name: string; columns: ImportColumn[] }
export interface ImportSummary { boards: number; columns: number; cards: number }

interface OrderedCollection<T> {
  data?: Record<string, T>
  order?: string[]
}

// {data, order} 컬렉션을 order 순서대로 [key, value] 배열로 변환.
// order에 빠진 항목은 뒤에 덧붙여 누락을 방지한다.
function ordered<T>(coll: OrderedCollection<T> | undefined): Array<[string, T]> {
  const data = coll?.data ?? {}
  const order = coll?.order ?? []
  const seen = new Set<string>()
  const out: Array<[string, T]> = []
  for (const id of order) {
    if (Object.prototype.hasOwnProperty.call(data, id)) {
      out.push([id, data[id]])
      seen.add(id)
    }
  }
  for (const id of Object.keys(data)) {
    if (!seen.has(id)) out.push([id, data[id]])
  }
  return out
}

interface RawBookmark { content?: string; url?: string }
interface RawColumn { title?: string; bookmarks?: OrderedCollection<RawBookmark> }
interface RawSpace { name?: string; columns?: OrderedCollection<RawColumn> }

/**
 * Stackable(Firebase) export JSON을 보드/컬럼/카드 모델로 파싱한다.
 * 순수 함수 — chrome API를 호출하지 않는다.
 */
export function parseStackable(json: unknown): ImportBoard[] {
  const root = json as { spacesList?: OrderedCollection<RawSpace> } | null
  const spaces = root?.spacesList
  if (!spaces || typeof spaces !== 'object' || !spaces.data) {
    throw new Error('Stackable 데이터 형식이 아닙니다 (spacesList.data 없음).')
  }

  const boards: ImportBoard[] = []
  for (const [spaceKey, space] of ordered<RawSpace>(spaces)) {
    const name = space?.name?.trim() || spaceKey
    const columns: ImportColumn[] = []
    for (const [, col] of ordered<RawColumn>(space?.columns)) {
      const title = col?.title?.trim() || '제목 없음'
      const cards: ImportCard[] = []
      for (const [, bm] of ordered<RawBookmark>(col?.bookmarks)) {
        const url = typeof bm?.url === 'string' ? bm.url.trim() : ''
        if (!url) continue
        cards.push({ title: bm?.content?.trim() || url, url })
      }
      columns.push({ title, cards })
    }
    boards.push({ name, columns })
  }
  return boards
}

/**
 * 파싱된 보드들을 루트 폴더 아래에 chrome.bookmarks 폴더/북마크로 생성.
 * 생성 순서가 곧 인덱스 순서이므로 order가 보존된다.
 */
export async function importStackable(rootId: string, boards: ImportBoard[]): Promise<ImportSummary> {
  const summary: ImportSummary = { boards: 0, columns: 0, cards: 0 }
  for (const board of boards) {
    const boardId = await createBoard(rootId, board.name)
    summary.boards++
    for (const col of board.columns) {
      const colId = await createColumn(boardId, col.title)
      summary.columns++
      for (const card of col.cards) {
        await createCard(colId, card.title, card.url)
        summary.cards++
      }
    }
  }
  return summary
}
