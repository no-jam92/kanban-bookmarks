<script lang="ts">
  import { kanban } from '../lib/store.svelte'
  import { createBoard, removeFolder } from '../lib/bookmarks'
  import { modal } from '../lib/modal.svelte'

  async function onSelect(e: Event) {
    const id = (e.target as HTMLSelectElement).value
    await kanban.selectBoard(id)
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
  async function delBoard() {
    if (!kanban.activeBoardId) return
    const ok = await modal.confirm({
      title: '보드 삭제',
      message: '이 보드를 삭제할까요? 안의 모든 컬럼/카드가 삭제됩니다.',
      confirmText: '삭제',
      danger: true,
    })
    if (ok) await removeFolder(kanban.activeBoardId)
  }
</script>

<nav class="bar">
  <span class="brand"><span class="logo">◧</span> Kanban</span>

  <div class="spacer"></div>

  <select class="tn-select" value={kanban.activeBoardId} onchange={onSelect}>
    {#each kanban.boards as b (b.id)}
      <option value={b.id}>{b.title}</option>
    {/each}
  </select>
  <button class="tn-btn tn-btn--primary" onclick={addBoard}>＋ 보드</button>
  {#if kanban.activeBoardId}
    <button class="tn-icon-btn tn-icon-btn--danger" onclick={delBoard} aria-label="보드 삭제">🗑</button>
  {/if}
</nav>

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: 60px;
    padding: 0 var(--space-5);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border-subtle);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    color: var(--color-text);
    letter-spacing: 0.01em;
  }
  .logo { color: var(--color-accent); font-size: 1.2em; }
  .spacer { flex: 1; }
</style>
