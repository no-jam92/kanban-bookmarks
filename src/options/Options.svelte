<script lang="ts">
  import { onMount } from 'svelte'
  import { getSettings, setSettings } from '../lib/settings'
  import { ensureRootFolder } from '../lib/bookmarks'
  import { parseStackable, importStackable } from '../lib/import'

  type FolderOpt = { id: string; label: string }
  let folders = $state<FolderOpt[]>([])
  let selected = $state<string | null>(null)
  let saved = $state(false)

  // import 상태
  let importText = $state('')
  let importing = $state(false)
  let importMsg = $state('')
  let importError = $state(false)

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

  async function runImport() {
    importing = true
    importMsg = ''
    importError = false
    try {
      const json = JSON.parse(importText)
      const boards = parseStackable(json)
      if (boards.length === 0) throw new Error('가져올 보드가 없습니다.')
      const rootId = await ensureRootFolder()
      const r = await importStackable(rootId, boards)
      importMsg = `✓ 보드 ${r.boards} · 컬럼 ${r.columns} · 카드 ${r.cards}개를 가져왔습니다. 새 탭을 다시 열어보세요.`
      importText = ''
    } catch (e) {
      importError = true
      importMsg = `가져오기 실패: ${e instanceof Error ? e.message : String(e)}`
    } finally {
      importing = false
    }
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

  <section class="panel">
    <h2>Stackable 가져오기</h2>
    <p class="muted">
      Stackable의 데이터(JSON)를 붙여넣어 보드·컬럼·카드로 한 번에 가져옵니다.
      현재 칸반 루트 아래에 <strong>추가</strong>되며 기존 보드는 지우지 않습니다.
    </p>
    <textarea class="tn-input area" bind:value={importText} spellcheck="false"
      placeholder={'{ "spacesList": { "data": { ... }, "order": [ ... ] } }'}></textarea>
    <div class="row">
      <button class="tn-btn tn-btn--primary" onclick={runImport}
              disabled={importing || !importText.trim()}>
        {importing ? '가져오는 중…' : '가져오기'}
      </button>
      {#if importMsg}<span class="msg" class:err={importError} class:ok={!importError}>{importMsg}</span>{/if}
    </div>
  </section>
</main>

<style>
  main { max-width: 640px; margin: 0 auto; padding: var(--space-6) var(--space-5); }
  .head { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-5); }
  .logo { color: var(--color-accent); font-size: 1.6rem; line-height: 1; }
  h1 { font-size: var(--text-xl); font-weight: var(--weight-bold); margin: 0; }

  .panel {
    background: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    margin-bottom: var(--space-4);
  }
  h2 { font-size: var(--text-lg); font-weight: var(--weight-semibold); margin: 0 0 var(--space-1); }
  .muted { color: var(--color-text-muted); font-size: var(--text-sm); margin: 0 0 var(--space-3); line-height: 1.5; }
  .muted strong { color: var(--color-text-secondary); }
  .full { width: 100%; height: 38px; }

  .area {
    width: 100%;
    height: 180px;
    padding: var(--space-3);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: var(--text-xs);
    line-height: 1.5;
    resize: vertical;
  }

  .row { display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-4); flex-wrap: wrap; }
  .ok { color: var(--color-success); font-size: var(--text-sm); font-weight: var(--weight-medium); }
  .msg { font-size: var(--text-sm); font-weight: var(--weight-medium); }
  .msg.ok { color: var(--color-success); }
  .msg.err { color: var(--color-danger); }
</style>
