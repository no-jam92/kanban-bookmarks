<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { kanban } from '../lib/store.svelte'
  import { createBoard } from '../lib/bookmarks'
  import BoardSelector from '../components/BoardSelector.svelte'
  import BoardView from '../components/Board.svelte'

  onMount(() => { void kanban.init() })
  onDestroy(() => kanban.dispose())

  async function createFirstBoard() {
    if (!kanban.rootId) return
    const id = await createBoard(kanban.rootId, 'My Board')
    await kanban.reload()
    await kanban.selectBoard(id)
  }
</script>

{#if kanban.loading}
  <div class="state"><p class="muted">불러오는 중…</p></div>
{:else}
  <BoardSelector />
  {#if !kanban.board}
    <div class="state">
      <div class="empty-card">
        <span class="icon">◧</span>
        <h2>아직 보드가 없습니다</h2>
        <p class="muted">첫 보드를 만들어 북마크를 칸반으로 정리해 보세요.</p>
        <button class="tn-btn tn-btn--primary" onclick={createFirstBoard}>첫 보드 만들기</button>
      </div>
    </div>
  {:else}
    <BoardView board={kanban.board} />
  {/if}
{/if}

<style>
  .state {
    display: grid;
    place-items: center;
    height: calc(100vh - 60px);
    padding: var(--space-5);
  }
  .empty-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    max-width: 360px;
    text-align: center;
    padding: var(--space-6);
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-pop);
  }
  .icon {
    font-size: 2.5rem;
    color: var(--color-accent);
    line-height: 1;
  }
  h2 {
    margin: 0;
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--color-text);
  }
  .muted { margin: 0; color: var(--color-text-muted); font-size: var(--text-sm); }
  .empty-card .tn-btn { margin-top: var(--space-2); }
</style>
