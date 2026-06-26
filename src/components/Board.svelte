<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import type { Board, Column } from '../lib/bookmarks'
  import { moveNode, createColumn } from '../lib/bookmarks'
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
    const title = prompt('컬럼 이름')
    if (title?.trim()) await createColumn(board.id, title.trim())
  }
</script>

<div class="board" use:dndzone={{ items: columns, type: 'column', flipDurationMs }}
     onconsider={consider} onfinalize={finalize}>
  {#each columns as column (column.id)}
    <div animate:flip={{ duration: flipDurationMs }}>
      <ColumnView {column} />
    </div>
  {/each}
  <button class="add-col" onclick={addColumn}>+ 컬럼 추가</button>
</div>

<style>
  .board {
    display: flex; gap: 0.8rem; align-items: flex-start;
    padding: 1rem; overflow-x: auto; height: calc(100vh - 56px);
  }
  .add-col {
    flex: 0 0 280px; border: 1px dashed color-mix(in srgb, CanvasText 30%, transparent);
    background: transparent; border-radius: 10px; padding: 0.8rem; cursor: pointer;
    color: CanvasText; opacity: 0.7;
  }
  .add-col:hover { opacity: 1; }
</style>
