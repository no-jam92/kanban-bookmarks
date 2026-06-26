import { tick } from 'svelte'

export type Theme = 'system' | 'dark' | 'light'

type Origin = { x: number; y: number }

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

  async set(t: Theme, origin?: Origin): Promise<void> {
    localStorage.setItem(LS_KEY, t)

    const mutate = async () => {
      this.current = t
      this.#apply()
      await tick() // 스냅샷 전에 Svelte DOM(토글 스와치 등)까지 반영
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    if (origin && typeof document.startViewTransition === 'function' && !reduce) {
      const vt = document.startViewTransition(mutate)
      try {
        await vt.ready
        this.#circleReveal(origin)
      } catch {
        /* 전환이 중단돼도 테마는 이미 적용됨 */
      }
    } else {
      await mutate()
    }

    await chrome.storage.sync.set({ [STORE_KEY]: t })
  }

  /** 상단바 빠른 토글: 현재 보이는 테마의 반대로 (system은 해제하고 명시 선택). */
  toggle(origin?: Origin): void {
    void this.set(this.isDark ? 'light' : 'dark', origin)
  }

  /** origin 지점에서 퍼지는 원형 reveal로 새 테마를 드러낸다. */
  #circleReveal({ x, y }: Origin): void {
    const w = window.innerWidth
    const h = window.innerHeight
    const end = Math.hypot(Math.max(x, w - x), Math.max(y, h - y))
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 450, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
    )
  }
}

export const theme = new ThemeStore()
