<script lang="ts">
  import type { Card } from '../lib/bookmarks'
  import { removeCard, updateCard } from '../lib/bookmarks'
  import { faviconUrl, initials } from '../lib/favicon'
  import { modal } from '../lib/modal.svelte'
  import { iconStore } from '../lib/icons.svelte'

  let { card }: { card: Card } = $props()
  let imgFailed = $state(false)
  let nonce = $state(0)

  let override = $derived(iconStore.cardIcon(card.id))

  function open() {
    window.location.href = card.url
  }

  async function edit(e: MouseEvent) {
    e.stopPropagation()
    const res = await modal.form({
      title: '카드 편집',
      fields: [
        { name: 'title', label: '이름', value: card.title, required: true },
        { name: 'url', label: 'URL', type: 'url', value: card.url, required: true },
        { name: 'icon', label: '아이콘 (이모지, 비우면 파비콘 사용)', value: override ?? '', placeholder: '예: 📌' },
      ],
      confirmText: '저장',
    })
    if (!res) return
    const url = res.url.trim()
    if (!url) return
    await updateCard(card.id, res.title.trim() || url, url)
    await iconStore.setCardIcon(card.id, res.icon)
    imgFailed = false
    nonce++
  }

  function reloadFavicon(e: MouseEvent) {
    e.stopPropagation()
    imgFailed = false
    nonce++
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
  {#if override}
    <span class="fallback emoji">{override}</span>
  {:else if imgFailed}
    <span class="fallback">{initials(card.url)}</span>
  {:else}
    <img class="favicon" src={faviconUrl(card.url, 32, nonce)} alt=""
         onerror={() => (imgFailed = true)} />
  {/if}
  <span class="body">
    <span class="title">{card.title || card.url}</span>
    {#if host}<span class="host">{host}</span>{/if}
  </span>
  <span class="actions">
    {#if !override}
      <button class="tn-icon-btn" onclick={reloadFavicon} aria-label="파비콘 다시 불러오기" title="파비콘 다시 불러오기">⟳</button>
    {/if}
    <button class="tn-icon-btn" onclick={edit} aria-label="편집" title="편집">✎</button>
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
  .fallback.emoji { background: transparent; font-size: 16px; }

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
