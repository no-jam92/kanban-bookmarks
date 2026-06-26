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
  <p class="state">불러오는 중…</p>
{:else}
  <BoardSelector />
  {#if !kanban.board}
    <div class="state">
      <p>보드가 없습니다.</p>
      <button onclick={createFirstBoard}>첫 보드 만들기</button>
    </div>
  {:else}
    <BoardView board={kanban.board} />
  {/if}
{/if}

<style>
  .state { padding: 2rem; text-align: center; }
</style>
