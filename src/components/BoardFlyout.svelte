<script lang="ts">
  import { kanban } from '../lib/store.svelte'
  import { iconStore } from '../lib/icons.svelte'
  import { ui } from '../lib/ui.svelte'
  import { createBoard } from '../lib/bookmarks'
  import { modal } from '../lib/modal.svelte'

  let open = $state(false)
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  function show() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
    open = true
  }
  function scheduleHide() {
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => (open = false), 220)
  }

  async function pick(id: string) {
    await kanban.selectBoard(id)
    open = false
  }
  async function addBoard() {
    if (!kanban.rootId) return
    const res = await modal.form({
      title: '새 보드',
      fields: [{ name: 'title', label: '보드 이름', placeholder: '예: 제품 리서치', required: true }],
      confirmText: '만들기',
    })
    const title = res?.title.trim()
    if (!title) return
    const id = await createBoard(kanban.rootId, title)
    await kanban.reload()
    await kanban.selectBoard(id)
  }
</script>

<!-- 사이드바가 닫혀 있을 때만, 왼쪽 끝 hover로 보드 목록을 띄운다 -->
{#if !ui.sidebarOpen}
<div class="hotzone" onmouseenter={show} role="presentation"></div>

<aside class="flyout" class:open onmouseenter={show} onmouseleave={scheduleHide}
       aria-hidden={!open}>
  <div class="head">
    <span class="label">보드</span>
    <button class="tn-icon-btn" onclick={addBoard} aria-label="보드 추가">＋</button>
  </div>
  {#if kanban.boards.length === 0}
    <p class="empty">보드가 없습니다.</p>
  {:else}
    <ul>
      {#each kanban.boards as b (b.id)}
        <li class:active={b.id === kanban.activeBoardId}>
          <button class="board-btn" onclick={() => pick(b.id)} title={b.title}>
            <span class="b-icon">{iconStore.boardIcon(b.id, b.title)}</span>
            <span class="b-name">{b.title}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</aside>
{/if}

<style>
  .hotzone {
    position: fixed;
    top: 60px;
    left: 0;
    width: 8px;
    bottom: 0;
    z-index: 50;
  }
  .flyout {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    width: 248px;
    z-index: 51;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border);
    box-shadow: var(--shadow-pop);
    padding: var(--space-4);
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform 180ms ease;
  }
  .flyout.open { transform: translateX(0); }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
    padding: 0 var(--space-1);
  }
  .label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
  }
  .empty { font-size: var(--text-sm); color: var(--color-text-muted); padding: var(--space-2); }

  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  li { border-radius: var(--radius-sm); border-left: 2px solid transparent; }
  li:hover { background: var(--color-wash); }
  li.active { background: var(--color-accent-soft); border-left-color: var(--color-accent); }

  .board-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    border: 0;
    background: transparent;
    text-align: left;
    padding: var(--space-2) var(--space-3);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-secondary);
    cursor: pointer;
  }
  li.active .board-btn { color: var(--color-text); }
  .b-icon { flex: 0 0 auto; font-size: 1.05em; line-height: 1; }
  .b-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
