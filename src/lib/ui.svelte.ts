// 사이드바 열림/닫힘 등 UI 상태. 닫은 상태가 새 탭에서도 유지되도록 저장한다.
const LS_KEY = 'kb-sidebar'
const STORE_KEY = 'sidebarOpen'

class UI {
  sidebarOpen = $state(true)

  constructor() {
    // 페인트 전(import 시점) localStorage로 즉시 복원해 깜빡임 방지
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(LS_KEY)
      if (cached !== null) this.sidebarOpen = cached === '1'
    }
  }

  async init(): Promise<void> {
    const r = await chrome.storage.sync.get({ [STORE_KEY]: this.sidebarOpen })
    this.sidebarOpen = !!r[STORE_KEY]
    this.#cache()
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes[STORE_KEY]) {
        this.sidebarOpen = !!changes[STORE_KEY].newValue
        this.#cache()
      }
    })
  }

  setSidebar(open: boolean): void {
    this.sidebarOpen = open
    this.#cache()
    void chrome.storage.sync.set({ [STORE_KEY]: open })
  }

  toggleSidebar(): void {
    this.setSidebar(!this.sidebarOpen)
  }

  #cache(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LS_KEY, this.sidebarOpen ? '1' : '0')
    }
  }
}

export const ui = new UI()
