<script lang="ts">
  import type { Card } from '../lib/bookmarks'
  import { removeCard, renameNode } from '../lib/bookmarks'
  import { faviconUrl, initials } from '../lib/favicon'
  import { modal } from '../lib/modal.svelte'

  let { card }: { card: Card } = $props()
  let imgFailed = $state(false)

  function open() {
    window.location.href = card.url
  }
  async function rename(e: MouseEvent) {
    e.stopPropagation()
    const res = await modal.form({
      title: '카드 이름 변경',
      fields: [{ name: 'title', label: '이름', value: card.title, required: true }],
      confirmText: '저장',
    })
    const title = res?.title.trim()
    if (title && title !== card.title) await renameNode(card.id, title)
  }
  async function del(e: MouseEvent) {
    e.stopPropagation()
    const ok = await modal.confirm({
      title: '카드 삭제',
      message: `"${card.title || card.url}"을(를) 삭제할까요?`,
      confirmText: '삭제',
      danger: true,
    })
    if (ok) await removeCard(card.id)
  }

  let host = $derived.by(() => {
    try { return new URL(card.url).hostname.replace(/^www\./, '') } catch { return '' }
  })
</script>

<div class="card" onclick={open} role="button" tabindex="0"
     onkeydown={(e) => e.key === 'Enter' && open()}>
  {#if imgFailed}
    <span class="fallback">{initials(card.url)}</span>
  {:else}
    <img class="favicon" src={faviconUrl(card.url)} alt=""
         onerror={() => (imgFailed = true)} />
  {/if}
  <span class="body">
    <span class="title">{card.title || card.url}</span>
    {#if host}<span class="host">{host}</span>{/if}
  </span>
  <span class="actions">
    <button class="tn-icon-btn" onclick={rename} aria-label="이름변경">✎</button>
    <button class="tn-icon-btn tn-icon-btn--danger" onclick={del} aria-label="삭제">×</button>
  </span>
</div>

<style>
  .card {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    margin: var(--space-2) 0;
    border-radius: var(--radius-md);
    background: var(--color-card);
    border: 1px solid var(--color-border-subtle);
    box-shadow: var(--shadow-card);
    cursor: pointer;
    user-select: none;
    transition: background var(--transition), border-color var(--transition),
      transform var(--transition), box-shadow var(--transition);
  }
  .card:hover {
    background: var(--color-card-hover);
    border-color: var(--color-accent);
    transform: translateY(-1px);
    box-shadow: var(--shadow-pop);
  }
  .card:active { transform: translateY(0); }

  .favicon,
  .fallback {
    width: 22px;
    height: 22px;
    flex: 0 0 22px;
    border-radius: var(--radius-sm);
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: var(--weight-bold);
    color: var(--color-accent);
    background: var(--color-accent-soft);
    object-fit: contain;
  }

  .body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
  .host {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .actions {
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity var(--transition);
  }
  .card:hover .actions,
  .card:focus-within .actions { opacity: 1; }
</style>
