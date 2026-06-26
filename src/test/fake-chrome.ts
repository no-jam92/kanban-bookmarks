export interface FakeNode {
  id: string
  parentId?: string
  title: string
  url?: string
  index?: number
  children?: FakeNode[]
}

type Listener<A extends unknown[]> = (...args: A) => void
function makeEvent<A extends unknown[]>() {
  const listeners: Listener<A>[] = []
  return {
    addListener: (cb: Listener<A>) => listeners.push(cb),
    removeListener: (cb: Listener<A>) => {
      const i = listeners.indexOf(cb)
      if (i >= 0) listeners.splice(i, 1)
    },
    _emit: (...args: A) => listeners.forEach((l) => l(...args)),
  }
}

export function createFakeChrome(seed: FakeNode[] = []) {
  const nodes = new Map<string, FakeNode>()
  let counter = 1
  const newId = () => `id-${counter++}`

  function ingest(list: FakeNode[], parentId?: string) {
    list.forEach((n, i) => {
      const id = n.id ?? newId()
      const stored: FakeNode = { ...n, id, parentId, index: i, children: undefined }
      nodes.set(id, stored)
      if (n.children) ingest(n.children, id)
    })
  }
  ingest(seed)

  const onCreated = makeEvent<[string, FakeNode]>()
  const onRemoved = makeEvent<[string, { parentId: string; index: number }]>()
  const onChanged = makeEvent<[string, { title: string; url?: string }]>()
  const onMoved = makeEvent<[string, { parentId: string; index: number }]>()

  const childrenOf = (parentId: string) =>
    [...nodes.values()]
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))

  const reindex = (parentId: string) =>
    childrenOf(parentId).forEach((n, i) => (n.index = i))

  const clone = (n: FakeNode): FakeNode => ({ ...n })

  const bookmarks = {
    get: async (id: string) => {
      const n = nodes.get(id)
      if (!n) throw new Error(`Can't find bookmark for id: ${id}`)
      return [clone(n)]
    },
    getChildren: async (parentId: string) => childrenOf(parentId).map(clone),
    getSubTree: async (id: string) => {
      const build = (nid: string): FakeNode => ({
        ...nodes.get(nid)!,
        children: childrenOf(nid).map((c) => build(c.id)),
      })
      return [build(id)]
    },
    create: async (arg: { parentId?: string; title?: string; url?: string; index?: number }) => {
      const id = newId()
      const parentId = arg.parentId ?? '1'
      const index = arg.index ?? childrenOf(parentId).length
      const node: FakeNode = { id, parentId, title: arg.title ?? '', url: arg.url, index }
      childrenOf(parentId).forEach((c) => { if ((c.index ?? 0) >= index) c.index = (c.index ?? 0) + 1 })
      nodes.set(id, node)
      onCreated._emit(id, clone(node))
      return clone(node)
    },
    move: async (id: string, dest: { parentId?: string; index?: number }) => {
      const node = nodes.get(id)!
      const oldParent = node.parentId!
      const newParent = dest.parentId ?? oldParent
      const siblings = childrenOf(newParent).filter((n) => n.id !== id)
      const index = dest.index ?? siblings.length
      node.parentId = newParent
      siblings.splice(index, 0, node)
      siblings.forEach((n, i) => (n.index = i))
      if (oldParent !== newParent) reindex(oldParent)
      onMoved._emit(id, { parentId: newParent, index: node.index! })
      return clone(node)
    },
    update: async (id: string, changes: { title?: string; url?: string }) => {
      const node = nodes.get(id)!
      if (changes.title !== undefined) node.title = changes.title
      if (changes.url !== undefined) node.url = changes.url
      onChanged._emit(id, { title: node.title, url: node.url })
      return clone(node)
    },
    remove: async (id: string) => {
      const node = nodes.get(id)!
      nodes.delete(id)
      reindex(node.parentId!)
      onRemoved._emit(id, { parentId: node.parentId!, index: node.index! })
    },
    removeTree: async (id: string) => {
      const collect = (nid: string): string[] =>
        [nid, ...childrenOf(nid).flatMap((c) => collect(c.id))]
      const node = nodes.get(id)!
      collect(id).forEach((d) => nodes.delete(d))
      reindex(node.parentId!)
      onRemoved._emit(id, { parentId: node.parentId!, index: node.index! })
    },
    onCreated, onRemoved, onChanged, onMoved,
  }

  let store: Record<string, unknown> = {}
  const sync = {
    get: async (defaults: Record<string, unknown>) => {
      const out: Record<string, unknown> = { ...defaults }
      for (const k of Object.keys(defaults)) if (k in store) out[k] = store[k]
      return out
    },
    set: async (items: Record<string, unknown>) => { store = { ...store, ...items } },
  }

  return {
    bookmarks,
    storage: { sync },
    runtime: { getURL: (p: string) => `chrome-extension://fake${p}` },
  }
}
