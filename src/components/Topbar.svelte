<script lang="ts">
  import { ui } from '../lib/ui.svelte'
  import { kanban } from '../lib/store.svelte'
  import { theme } from '../lib/theme.svelte'
  import { iconStore } from '../lib/icons.svelte'
  import { renameNode } from '../lib/bookmarks'

  let active = $derived(kanban.boards.find((b) => b.id === kanban.activeBoardId) ?? null)

  let editing = $state(false)
  let draft = $state('')
  let inputEl = $state<HTMLInputElement | null>(null)

  // 보드를 전환하면 편집 모드 종료
  $effect(() => {
    active?.id
    editing = false
  })
  // 편집 시작 시 입력에 포커스
  $effect(() => {
    if (editing && inputEl) {
      inputEl.focus()
      inputEl.select()
    }
  })

  function startEdit() {
    if (!active) return
    draft = active.title
    editing = true
  }
  async function commit() {
    if (!editing) return
    editing = false
    const name = draft.trim()
    if (active && name && name !== active.title) await renameNode(active.id, name)
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') commit()
    else if (e.key === 'Escape') editing = false
  }

  function toggleTheme(e: MouseEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    theme.toggle({
      x: e.clientX || r.left + r.width / 2,
      y: e.clientY || r.top + r.height / 2,
    })
  }
</script>

<nav class="bar">
  <button class="tn-icon-btn hamburger" onclick={() => ui.toggleSidebar()}
          aria-label="사이드바 토글" aria-expanded={ui.sidebarOpen}>☰</button>
  <span class="brand"><span class="logo">◧</span> Kanban</span>
  {#if active}
    <span class="sep">/</span>
    <span class="board-name">
      <span class="b-icon">{iconStore.boardIcon(active.id, active.title)}</span>
      {#if editing}
        <input class="name-input" bind:this={inputEl} bind:value={draft}
               onblur={commit} onkeydown={onKey} />
      {:else}
        <button class="name-btn" onclick={startEdit} title="보드 이름 수정">{active.title}</button>
      {/if}
    </span>
  {/if}

  <div class="spacer"></div>

  <button class="theme-toggle" onclick={toggleTheme}
          aria-label="테마 전환" title={theme.isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}>
    <!-- 전환될 상태(반대)를 표시 -->
    <span class="swatch" class:dark={!theme.isDark} class:light={theme.isDark}>
      {theme.isDark ? '☀️' : '🌙'}
    </span>
  </button>
</nav>

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: 60px;
    padding: 0 var(--space-4);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border-subtle);
  }
  .hamburger { font-size: var(--text-lg); width: 34px; height: 34px; }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    color: var(--color-text);
  }
  .logo { color: var(--color-accent); font-size: 1.2em; }
  .sep { color: var(--color-text-muted); }
  .board-name {
    display: inline-flex;
    align-items: center;
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--color-text-secondary);
  }
  .b-icon { font-size: 1.1em; line-height: 1; }
  .name-btn {
    border: 0;
    background: transparent;
    font: inherit;
    color: inherit;
    cursor: text;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    transition: background var(--transition);
  }
  .name-btn:hover { background: var(--color-wash); }
  .name-input {
    font: inherit;
    color: var(--color-text);
    background: var(--color-bg);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-sm);
    padding: 2px 6px;
    outline: none;
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
  .spacer { flex: 1; }

  .theme-toggle {
    display: inline-grid;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    cursor: pointer;
    transition: background var(--transition);
  }
  .theme-toggle:hover { background: var(--color-wash); }
  .swatch {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 12px;
    line-height: 1;
    border: 1px solid var(--color-border);
    box-shadow: var(--shadow-card);
  }
  .swatch.dark { background: #16161e; }
  .swatch.light { background: #ffffff; }
</style>
