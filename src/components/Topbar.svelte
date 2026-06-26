<script lang="ts">
  import { ui } from '../lib/ui.svelte'
  import { kanban } from '../lib/store.svelte'
  import { theme } from '../lib/theme.svelte'
  import { boardEmoji } from '../lib/board-icon'

  let activeTitle = $derived(
    kanban.boards.find((b) => b.id === kanban.activeBoardId)?.title ?? '',
  )
</script>

<nav class="bar">
  <button class="tn-icon-btn hamburger" onclick={() => ui.toggleSidebar()}
          aria-label="사이드바 토글" aria-expanded={ui.sidebarOpen}>☰</button>
  <span class="brand"><span class="logo">◧</span> Kanban</span>
  {#if activeTitle}
    <span class="sep">/</span>
    <span class="board-name"><span class="b-icon">{boardEmoji(activeTitle)}</span>{activeTitle}</span>
  {/if}

  <div class="spacer"></div>

  <button class="theme-toggle" onclick={() => theme.toggle()}
          aria-label="테마 전환" title={theme.isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}>
    <span class="swatch" class:dark={theme.isDark} class:light={!theme.isDark}>
      {theme.isDark ? '🌙' : '☀️'}
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
    gap: var(--space-2);
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--color-text-secondary);
  }
  .b-icon { font-size: 1.1em; line-height: 1; }
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
