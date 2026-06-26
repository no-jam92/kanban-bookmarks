export type Theme = 'system' | 'dark' | 'light'

const LS_KEY = 'kb-theme' // flash 방지용 로컬 미러 (동기 읽기)
const STORE_KEY = 'theme' // chrome.storage.sync (영속/동기화)

function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
}
function resolve(t: Theme): 'dark' | 'light' {
  return t === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : t
}

class ThemeStore {
  current = $state<Theme>('system')
  isDark = $state(true)

  #apply(): void {
    const dark = resolve(this.current) === 'dark'
    this.isDark = dark
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }

  /** 동기 실행: localStorage 캐시로 즉시 적용해 깜빡임을 막는다. */
  #applyFromCache(): void {
    const cached = (localStorage.getItem(LS_KEY) as Theme | null) ?? 'system'
    this.current = cached
    this.#apply()
  }

  /** main에서 mount 전에 호출. 첫 부분은 동기적으로 실행되어 페인트 전에 테마를 건다. */
  async init(): Promise<void> {
    this.#applyFromCache()

    const stored = await chrome.storage.sync.get({ [STORE_KEY]: this.current })
    this.current = (stored[STORE_KEY] as Theme) ?? 'system'
    localStorage.setItem(LS_KEY, this.current)
    this.#apply()

    window
      .matchMedia?.('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (this.current === 'system') this.#apply()
      })

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes[STORE_KEY]) {
        this.current = (changes[STORE_KEY].newValue as Theme) ?? 'system'
        localStorage.setItem(LS_KEY, this.current)
        this.#apply()
      }
    })
  }

  async set(t: Theme): Promise<void> {
    this.current = t
    localStorage.setItem(LS_KEY, t)
    this.#apply()
    await chrome.storage.sync.set({ [STORE_KEY]: t })
  }

  /** 상단바 빠른 토글: 현재 보이는 테마의 반대로 (system은 해제하고 명시 선택). */
  toggle(): void {
    void this.set(this.isDark ? 'light' : 'dark')
  }
}

export const theme = new ThemeStore()
