<script lang="ts">
  import { ui } from '../lib/ui.svelte'
  import { kanban } from '../lib/store.svelte'

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
    <span class="board-name">{activeTitle}</span>
  {/if}
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
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--color-text-secondary);
  }
</style>
