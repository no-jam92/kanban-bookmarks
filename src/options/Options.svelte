<script lang="ts">
  import { onMount } from 'svelte'
  import { getSettings, setSettings } from '../lib/settings'

  type FolderOpt = { id: string; label: string }
  let folders = $state<FolderOpt[]>([])
  let selected = $state<string | null>(null)
  let saved = $state(false)

  onMount(async () => {
    const tree = await chrome.bookmarks.getTree()
    const acc: FolderOpt[] = []
    const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[], depth: number) => {
      for (const n of nodes) {
        if (!n.url) {
          if (n.id !== '0') acc.push({ id: n.id, label: `${'　'.repeat(depth)}${n.title || '(루트)'}` })
          if (n.children) walk(n.children, depth + 1)
        }
      }
    }
    walk(tree, 0)
    folders = acc
    selected = (await getSettings()).rootFolderId
  })

  async function save() {
    if (!selected) return
    await setSettings({ rootFolderId: selected })
    saved = true
  }
</script>

<main>
  <header class="head">
    <span class="logo">◧</span>
    <h1>Kanban Bookmarks 설정</h1>
  </header>

  <section class="panel">
    <h2>칸반 루트 폴더</h2>
    <p class="muted">이 폴더의 하위 폴더들이 보드가 됩니다.</p>
    <select class="tn-select full" bind:value={selected} onchange={() => (saved = false)}>
      {#each folders as f (f.id)}
        <option value={f.id}>{f.label}</option>
      {/each}
    </select>
    <div class="row">
      <button class="tn-btn tn-btn--primary" onclick={save}>저장</button>
      {#if saved}<span class="ok">✓ 저장됨. 새 탭을 다시 열어주세요.</span>{/if}
    </div>
  </section>
</main>

<style>
  main {
    max-width: 560px;
    margin: 0 auto;
    padding: var(--space-6) var(--space-5);
  }
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-5);
  }
  .logo { color: var(--color-accent); font-size: 1.6rem; line-height: 1; }
  h1 { font-size: var(--text-xl); font-weight: var(--weight-bold); margin: 0; }

  .panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
  }
  h2 { font-size: var(--text-lg); font-weight: var(--weight-semibold); margin: 0 0 var(--space-1); }
  .muted { color: var(--color-text-muted); font-size: var(--text-sm); margin: 0 0 var(--space-3); }
  .full { width: 100%; height: 38px; }
  .row { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-4); }
  .ok { color: var(--color-success); font-size: var(--text-sm); font-weight: var(--weight-medium); }
</style>
