import { boardEmoji } from './board-icon'

// 보드/카드의 커스텀 아이콘(이모지) 오버라이드를 chrome.storage.sync에 id별로 저장.
// 북마크 폴더/제목은 건드리지 않는다.
class IconStore {
  boards = $state<Record<string, string>>({})
  cards = $state<Record<string, string>>({})

  async load(): Promise<void> {
    const r = await chrome.storage.sync.get({ boardIcons: {}, cardIcons: {} })
    this.boards = (r.boardIcons as Record<string, string>) ?? {}
    this.cards = (r.cardIcons as Record<string, string>) ?? {}
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return
      if (changes.boardIcons) this.boards = (changes.boardIcons.newValue as Record<string, string>) ?? {}
      if (changes.cardIcons) this.cards = (changes.cardIcons.newValue as Record<string, string>) ?? {}
    })
  }

  /** 보드 아이콘: 오버라이드가 있으면 그것, 없으면 이름 기반 기본 이모지. */
  boardIcon(id: string, name: string): string {
    return this.boards[id]?.trim() || boardEmoji(name)
  }

  /** 카드 커스텀 아이콘: 설정돼 있으면 이모지, 없으면 null(파비콘 사용). */
  cardIcon(id: string): string | null {
    return this.cards[id]?.trim() || null
  }

  async setBoardIcon(id: string, emoji: string): Promise<void> {
    const next = { ...this.boards }
    const e = emoji.trim()
    if (e) next[id] = e
    else delete next[id]
    this.boards = next
    await chrome.storage.sync.set({ boardIcons: next })
  }

  async setCardIcon(id: string, emoji: string): Promise<void> {
    const next = { ...this.cards }
    const e = emoji.trim()
    if (e) next[id] = e
    else delete next[id]
    this.cards = next
    await chrome.storage.sync.set({ cardIcons: next })
  }
}

export const iconStore = new IconStore()
