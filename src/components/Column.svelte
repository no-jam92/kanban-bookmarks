<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import type { Column, Card } from '../lib/bookmarks'
  import { moveNode, renameNode, removeFolder, createCard } from '../lib/bookmarks'
  import CardView from './Card.svelte'

  let { column }: { column: Column } = $props()

  const flipDurationMs = 150
  // svelte-ignore state_referenced_locally
  let items = $state<Card[]>(column.cards)
  let dragging = $state(false)
  let editing = $state(false)
  // svelte-ignore state_referenced_locally
  let titleDraft = $state(column.title)

  // 외부(스토어 reload)에서 카드가 바뀌면 동기화. 드래그 중에는 덮어쓰지 않음.
  $effect(() => {
    const next = column.cards
    if (!dragging) items = next
  })

  function consider(e: CustomEvent<DndEvent<Card>>) {
    dragging = true
    items = e.detail.items
  }
  async function finalize(e: CustomEvent<DndEvent<Card>>) {
    items = e.detail.items
    dragging = false
    const movedId = e.detail.info.id
    const newIndex = items.findIndex((c) => c.id === movedId)
    if (newIndex >= 0) {
      await moveNode(movedId, column.id, newIndex)
    }
  }

  async function saveTitle() {
    editing = false
    if (titleDraft.trim() && titleDraft !== column.title) {
      await renameNode(column.id, titleDraft.trim())
    } else {
      titleDraft = column.title
    }
  }
  async function del() {
    if (confirm(`컬럼 "${column.title}"을(를) 삭제할까요?`)) await removeFolder(column.id)
  }
  async function addCard() {
    const url = prompt('URL을 입력하세요')
    if (!url) return
    await createCard(column.id, url, url)
  }
</script>

<section class="column">
  <header>
    {#if editing}
      <input bind:value={titleDraft} onblur={saveTitle}
             onkeydown={(e) => e.key === 'Enter' && saveTitle()} />
    {:else}
      <h2 ondblclick={() => { editing = true; titleDraft = column.title }}>{column.title}</h2>
    {/if}
    <button class="del" onclick={del} aria-label="컬럼 삭제">×</button>
  </header>

  <div class="cards" use:dndzone={{ items, type: 'card', flipDurationMs }}
       onconsider={consider} onfinalize={finalize}>
    {#each items as card (card.id)}
      <div animate:flip={{ duration: flipDurationMs }}>
        <CardView {card} />
      </div>
    {/each}
  </div>

  <button class="add" onclick={addCard}>+ 카드 추가</button>
</section>

<style>
  .column {
    display: flex; flex-direction: column; width: 280px; flex: 0 0 280px;
    max-height: 100%; background: color-mix(in srgb, CanvasText 6%, Canvas);
    border-radius: 10px; padding: 0.6rem;
  }
  header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
  h2 { font-size: 0.9rem; margin: 0; flex: 1; cursor: text; }
  header input { flex: 1; font-size: 0.9rem; }
  .del { border: 0; background: transparent; cursor: pointer; opacity: 0.4; color: CanvasText; }
  .del:hover { opacity: 1; }
  .cards { flex: 1; overflow-y: auto; min-height: 40px; }
  .add {
    margin-top: 0.4rem; border: 0; background: transparent; cursor: pointer;
    text-align: left; padding: 0.4rem; border-radius: 6px; color: CanvasText; opacity: 0.7;
  }
  .add:hover { background: color-mix(in srgb, CanvasText 10%, transparent); opacity: 1; }
</style>
