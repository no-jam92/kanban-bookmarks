import {
  ensureRootFolder, listBoards, getBoard,
  type Board, type BoardSummary,
} from './bookmarks'
import { getSettings, setSettings } from './settings'

export class KanbanStore {
  rootId = $state<string | null>(null)
  boards = $state<BoardSummary[]>([])
  activeBoardId = $state<string | null>(null)
  board = $state<Board | null>(null)
  loading = $state(true)

  #debounce: ReturnType<typeof setTimeout> | null = null
  #onChange = () => this.#scheduleReload()

  async init(): Promise<void> {
    this.loading = true
    this.rootId = await ensureRootFolder()
    this.boards = await listBoards(this.rootId)
    const { activeBoardId } = await getSettings()
    const valid = activeBoardId && this.boards.some((b) => b.id === activeBoardId)
    const next = valid ? activeBoardId! : this.boards[0]?.id ?? null
    await this.selectBoard(next)
    this.#subscribe()
    this.loading = false
  }

  async selectBoard(id: string | null): Promise<void> {
    this.activeBoardId = id
    await setSettings({ activeBoardId: id })
    this.board = id ? await getBoard(id) : null
  }

  async reload(): Promise<void> {
    if (!this.rootId) return
    this.boards = await listBoards(this.rootId)
    if (this.activeBoardId && this.boards.some((b) => b.id === this.activeBoardId)) {
      this.board = await getBoard(this.activeBoardId)
    } else {
      await this.selectBoard(this.boards[0]?.id ?? null)
    }
  }

  #scheduleReload(): void {
    if (this.#debounce) clearTimeout(this.#debounce)
    this.#debounce = setTimeout(() => { void this.reload() }, 50)
  }

  #subscribe(): void {
    chrome.bookmarks.onCreated.addListener(this.#onChange)
    chrome.bookmarks.onRemoved.addListener(this.#onChange)
    chrome.bookmarks.onChanged.addListener(this.#onChange)
    chrome.bookmarks.onMoved.addListener(this.#onChange)
  }

  dispose(): void {
    chrome.bookmarks.onCreated.removeListener(this.#onChange)
    chrome.bookmarks.onRemoved.removeListener(this.#onChange)
    chrome.bookmarks.onChanged.removeListener(this.#onChange)
    chrome.bookmarks.onMoved.removeListener(this.#onChange)
  }
}

export const kanban = new KanbanStore()
