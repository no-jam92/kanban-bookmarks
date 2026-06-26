<script lang="ts">
  import { kanban } from '../lib/store.svelte'
  import { ui } from '../lib/ui.svelte'
  import { createBoard, removeFolder, renameNode } from '../lib/bookmarks'
  import { modal } from '../lib/modal.svelte'
  import { iconStore } from '../lib/icons.svelte'

  async function addBoard() {
    if (!kanban.rootId) return
    const res = await modal.form({
      title: '새 보드',
      fields: [{ name: 'title', label: '보드 이름', placeholder: '예: 제품 리서치', required: true }],
      confirmText: '만들기',
    })
    const title = res?.title.trim()
    if (!title) return
    const id = await createBoard(kanban.rootId, title)
    await kanban.reload()
    await kanban.selectBoard(id)
  }

  async function editBoard(e: MouseEvent, id: string, name: string) {
    e.stopPropagation()
    const res = await modal.form({
      title: '보드 편집',
      fields: [
        { name: 'name', label: '이름', value: name, required: true },
        { name: 'icon', label: '아이콘 (이모지, 비우면 기본)', value: iconStore.boards[id] ?? '', placeholder: '예: 🎯' },
      ],
      confirmText: '저장',
    })
    if (!res) return
    const newName = res.name.trim()
    if (newName && newName !== name) await renameNode(id, newName)
    await iconStore.setBoardIcon(id, res.icon)
  }

  async function delBoard(id: string, title: string) {
    const ok = await modal.confirm({
      title: '보드 삭제',
      message: `보드 "${title}"을(를) 삭제할까요? 안의 모든 컬럼/카드가 삭제됩니다.`,
      confirmText: '삭제',
      danger: true,
    })
    if (ok) await removeFolder(id)
  }
</script>

<aside class="sidebar" class:closed={!ui.sidebarOpen} aria-hidden={!ui.sidebarOpen}>
  <div class="inner">
    <div class="head">
      <span class="label">보드</span>
      <button class="tn-icon-btn" onclick={addBoard} aria-label="보드 추가">＋</button>
    </div>

    {#if kanban.boards.length === 0}
      <p class="empty">보드가 없습니다. ＋로 추가하세요.</p>
    {:else}
      <ul>
        {#each kanban.boards as b (b.id)}
          <li class:active={b.id === kanban.activeBoardId}>
            <button class="board-btn" onclick={() => kanban.selectBoard(b.id)} title={b.title}>
              <span class="b-icon">{iconStore.boardIcon(b.id, b.title)}</span>
              <span class="b-name">{b.title}</span>
            </button>
            <button class="tn-icon-btn edit" onclick={(e) => editBoard(e, b.id, b.title)}
                    aria-label="보드 편집" title="편집">✎</button>
            <button class="tn-icon-btn tn-icon-btn--danger del" onclick={() => delBoard(b.id, b.title)}
                    aria-label="보드 삭제">×</button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    flex: 0 0 auto;
    width: 260px;
    height: 100%;
    background: var(--color-surface);
    border-right: 1px solid var(--color-border-subtle);
    overflow: hidden;
    transition: width var(--transition), border-right-color var(--transition);
  }
  .sidebar.closed {
    width: 0;
    border-right-color: transparent;
  }
  .inner {
    width: 260px;
    height: 100%;
    padding: var(--space-4);
    overflow-y: auto;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
    padding: 0 var(--space-1);
  }
  .label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
  }

  .empty { font-size: var(--text-sm); color: var(--color-text-muted); padding: var(--space-2); }

  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  li {
    display: flex;
    align-items: center;
    border-radius: var(--radius-sm);
    border-left: 2px solid transparent;
    transition: background var(--transition), border-color var(--transition);
  }
  li:hover { background: var(--color-wash); }
  li.active {
    background: var(--color-accent-soft);
    border-left-color: var(--color-accent);
  }

  .board-btn {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    border: 0;
    background: transparent;
    text-align: left;
    padding: var(--space-2) var(--space-3);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text-secondary);
    cursor: pointer;
  }
  .b-icon { flex: 0 0 auto; font-size: 1.05em; line-height: 1; }
  .b-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  li.active .board-btn { color: var(--color-text); }

  .edit, .del { opacity: 0; }
  .del { margin-right: var(--space-1); }
  li:hover .edit, li:hover .del { opacity: 0.6; }
  .edit:hover, .del:hover { opacity: 1; }
</style>
