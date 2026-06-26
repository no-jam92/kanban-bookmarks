<script lang="ts">
  import type { Card } from '../lib/bookmarks'
  import { removeCard, renameNode } from '../lib/bookmarks'
  import { faviconUrl, initials } from '../lib/favicon'

  let { card }: { card: Card } = $props()
  let imgFailed = $state(false)

  function open() {
    window.location.href = card.url
  }
  async function rename(e: MouseEvent) {
    e.stopPropagation()
    const title = prompt('카드 이름', card.title)
    if (title?.trim() && title !== card.title) await renameNode(card.id, title.trim())
  }
  async function del(e: MouseEvent) {
    e.stopPropagation()
    await removeCard(card.id)
  }
</script>

<div class="card" onclick={open} role="button" tabindex="0"
     onkeydown={(e) => e.key === 'Enter' && open()}>
  {#if imgFailed}
    <span class="fallback">{initials(card.url)}</span>
  {:else}
    <img class="favicon" src={faviconUrl(card.url)} alt=""
         onerror={() => (imgFailed = true)} />
  {/if}
  <span class="title">{card.title || card.url}</span>
  <button class="rename" onclick={rename} aria-label="이름변경">✎</button>
  <button class="del" onclick={del} aria-label="삭제">×</button>
</div>

<style>
  .card {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem; margin: 0.35rem 0; border-radius: 6px;
    background: Canvas; border: 1px solid color-mix(in srgb, CanvasText 15%, transparent);
    cursor: pointer; user-select: none;
  }
  .card:hover { border-color: color-mix(in srgb, CanvasText 35%, transparent); }
  .favicon, .fallback {
    width: 16px; height: 16px; flex: 0 0 16px; border-radius: 3px;
    display: grid; place-items: center; font-size: 10px; font-weight: 700;
    background: color-mix(in srgb, CanvasText 12%, transparent);
  }
  .title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.85rem; }
  .rename, .del { border: 0; background: transparent; cursor: pointer; font-size: 0.9rem; opacity: 0; color: CanvasText; }
  .card:hover .rename, .card:hover .del { opacity: 0.6; }
  .rename:hover, .del:hover { opacity: 1; }
</style>
