<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import type { Column, Card } from '../lib/bookmarks'
  import { moveNode, renameNode, removeFolder, createCard } from '../lib/bookmarks'
  import { modal } from '../lib/modal.svelte'
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
    const ok = await modal.confirm({
      title: '컬럼 삭제',
      message: `컬럼 "${column.title}"을(를) 삭제할까요? 안의 카드도 모두 삭제됩니다.`,
      confirmText: '삭제',
      danger: true,
    })
    if (ok) await removeFolder(column.id)
  }
  async function addCard() {
    const res = await modal.form({
      title: '카드 추가',
      fields: [
        { name: 'title', label: '제목', placeholder: '예: Svelte 공식 문서' },
        { name: 'url', label: 'URL', type: 'url', placeholder: 'https://...', required: true },
      ],
      confirmText: '추가',
    })
    const url = res?.url.trim()
    if (!url) return
    await createCard(column.id, res!.title.trim() || url, url)
  }
</script>

<section class="column">
  <header>
    {#if editing}
      <input class="tn-input title-input" bind:value={titleDraft} onblur={saveTitle}
             onkeydown={(e) => e.key === 'Enter' && saveTitle()} />
    {:else}
      <h2 ondblclick={() => { editing = true; titleDraft = column.title }}>{column.title}</h2>
      <span class="count">{items.length}</span>
    {/if}
    <button class="tn-icon-btn tn-icon-btn--danger del" onclick={del} aria-label="컬럼 삭제">×</button>
  </header>

  <div class="cards" use:dndzone={{ items, type: 'card', flipDurationMs }}
       onconsider={consider} onfinalize={finalize}>
    {#each items as card (card.id)}
      <div animate:flip={{ duration: flipDurationMs }}>
        <CardView {card} />
      </div>
    {/each}
    {#if items.length === 0}
      <button class="ghost-card" onclick={addCard}>
        <span class="ghost-plus">＋</span>
        <span>링크 추가</span>
      </button>
    {/if}
  </div>

  {#if items.length > 0}
    <button class="add" onclick={addCard}>＋ 카드 추가</button>
  {/if}
</section>

<style>
  .column {
    display: flex;
    flex-direction: column;
    width: 300px;
    flex: 0 0 300px;
    max-height: 100%;
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--space-3);
  }

  header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    padding: 0 var(--space-1);
  }
  h2 {
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    letter-spacing: 0.02em;
    margin: 0;
    color: var(--color-text);
    cursor: text;
  }
  .count {
    display: inline-grid;
    place-items: center;
    min-width: 22px;
    height: 20px;
    padding: 0 var(--space-2);
    border-radius: var(--radius-full);
    background: var(--color-wash);
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
  }
  .title-input { flex: 1; height: 28px; }
  .del { margin-left: auto; opacity: 0; transition: opacity var(--transition); }
  header:hover .del { opacity: 1; }

  .cards {
    flex: 1;
    overflow-y: auto;
    min-height: 48px;
    margin: 0 calc(-1 * var(--space-1));
    padding: 0 var(--space-1);
  }
  .ghost-card {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    margin: var(--space-2) 0;
    padding: var(--space-4);
    border: 1.5px dashed var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-muted);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: background var(--transition), border-color var(--transition),
      color var(--transition);
  }
  .ghost-card:hover {
    background: var(--color-accent-soft);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .ghost-plus { font-size: var(--text-lg); line-height: 1; }

  .add {
    margin-top: var(--space-2);
    width: 100%;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    transition: background var(--transition), color var(--transition);
  }
  .add:hover { background: var(--color-wash); color: var(--color-text); }
</style>
