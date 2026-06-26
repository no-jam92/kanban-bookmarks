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
  <h1>칸반 루트 폴더</h1>
  <p>이 폴더의 하위 폴더들이 보드가 됩니다.</p>
  <select bind:value={selected} onchange={() => (saved = false)}>
    {#each folders as f (f.id)}
      <option value={f.id}>{f.label}</option>
    {/each}
  </select>
  <button onclick={save}>저장</button>
  {#if saved}<p class="ok">저장됨. 새 탭을 다시 열어주세요.</p>{/if}
</main>

<style>
  main { padding: 2rem; max-width: 520px; font-family: system-ui, sans-serif; }
  select { width: 100%; padding: 0.5rem; margin: 0.5rem 0; }
  .ok { color: green; }
</style>
