<script lang="ts">
  import { kanban } from '../lib/store.svelte'
  import { createBoard, removeFolder } from '../lib/bookmarks'

  async function onSelect(e: Event) {
    const id = (e.target as HTMLSelectElement).value
    await kanban.selectBoard(id)
  }
  async function addBoard() {
    const title = prompt('새 보드 이름')
    if (!title?.trim() || !kanban.rootId) return
    const id = await createBoard(kanban.rootId, title.trim())
    await kanban.reload()
    await kanban.selectBoard(id)
  }
  async function delBoard() {
    if (!kanban.activeBoardId) return
    if (confirm('이 보드를 삭제할까요? (안의 모든 컬럼/카드 삭제)')) {
      await removeFolder(kanban.activeBoardId)
    }
  }
</script>

<nav class="bar">
  <strong>📋 Kanban</strong>
  <select value={kanban.activeBoardId} onchange={onSelect}>
    {#each kanban.boards as b (b.id)}
      <option value={b.id}>{b.title}</option>
    {/each}
  </select>
  <button onclick={addBoard}>+ 보드</button>
  {#if kanban.activeBoardId}
    <button onclick={delBoard} aria-label="보드 삭제">🗑</button>
  {/if}
</nav>

<style>
  .bar {
    display: flex; align-items: center; gap: 0.6rem; height: 56px;
    padding: 0 1rem; border-bottom: 1px solid color-mix(in srgb, CanvasText 15%, transparent);
  }
  select { font-size: 0.9rem; padding: 0.25rem; }
  button { cursor: pointer; }
</style>
