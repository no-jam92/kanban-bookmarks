import {
  ensureRootFolder, listBoards, getBoard,
  createBoard, createColumn, createCard,
} from './lib/bookmarks'

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || tab.url.startsWith('chrome')) return

  const rootId = await ensureRootFolder()
  let boards = await listBoards(rootId)
  let boardId = boards[0]?.id
  if (!boardId) boardId = await createBoard(rootId, 'My Board')

  const board = await getBoard(boardId)
  let columnId = board.columns[0]?.id
  if (!columnId) columnId = await createColumn(boardId, 'Inbox')

  await createCard(columnId, tab.title ?? tab.url, tab.url)
})
