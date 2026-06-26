<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import type { Board, Column } from '../lib/bookmarks'
  import { moveNode, createColumn } from '../lib/bookmarks'
  import { modal } from '../lib/modal.svelte'
  import ColumnView from './Column.svelte'

  let { board }: { board: Board } = $props()

  const flipDurationMs = 150
  // svelte-ignore state_referenced_locally
  let columns = $state<Column[]>(board.columns)
  let dragging = $state(false)

  $effect(() => {
    const next = board.columns
    if (!dragging) columns = next
  })

  function consider(e: CustomEvent<DndEvent<Column>>) {
    dragging = true
    columns = e.detail.items
  }
  async function finalize(e: CustomEvent<DndEvent<Column>>) {
    columns = e.detail.items
    dragging = false
    const movedId = e.detail.info.id
    const newIndex = columns.findIndex((c) => c.id === movedId)
    if (newIndex >= 0) await moveNode(movedId, board.id, newIndex)
  }

  async function addColumn() {
    const res = await modal.form({
      title: '컬럼 추가',
      fields: [{ name: 'title', label: '컬럼 이름', placeholder: '예: To Do', required: true }],
      confirmText: '추가',
    })
    const title = res?.title.trim()
    if (title) await createColumn(board.id, title)
  }
</script>

<div class="board" use:dndzone={{ items: columns, type: 'column', flipDurationMs }}
     onconsider={consider} onfinalize={finalize}>
  {#each columns as column (column.id)}
    <div class="col-wrap" animate:flip={{ duration: flipDurationMs }}>
      <ColumnView {column} />
    </div>
  {/each}
  <button class="add-col" onclick={addColumn}>
    <span class="plus">＋</span>
    <span>컬럼 추가</span>
  </button>
</div>

<style>
  .board {
    display: flex;
    gap: var(--space-4);
    align-items: flex-start;
    padding: var(--space-5);
    overflow-x: auto;
    height: calc(100vh - 60px);
  }
  .col-wrap { height: 100%; display: flex; }

  .add-col {
    flex: 0 0 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 1px dashed var(--color-border);
    background: transparent;
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    cursor: pointer;
    color: var(--color-text-muted);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    transition: background var(--transition), border-color var(--transition),
      color var(--transition);
  }
  .add-col:hover {
    background: var(--color-accent-soft);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .plus { font-size: var(--text-lg); }
</style>
