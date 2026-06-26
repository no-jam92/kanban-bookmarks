// 카드 드래그 중 "시작 컬럼"과 "현재(끝) 컬럼"을 컬럼 간에 공유하기 위한 상태.
// svelte-dnd-action은 마우스가 올라간 zone 하나만 강조하므로, 시작 컬럼을
// 계속 강조하려면 별도 상태가 필요하다.
class CardDrag {
  source = $state<string | null>(null)
  over = $state<string | null>(null)
  active = $derived(this.source !== null)

  start(columnId: string): void {
    this.source = columnId
    this.over = columnId
  }
  enter(columnId: string): void {
    this.over = columnId
  }
  end(): void {
    this.source = null
    this.over = null
  }

  highlights(columnId: string): boolean {
    return this.active && (columnId === this.source || columnId === this.over)
  }
}

export const cardDrag = new CardDrag()
