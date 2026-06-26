export function faviconUrl(pageUrl: string, size = 32): string {
  const u = new URL(chrome.runtime.getURL('/_favicon/'))
  u.searchParams.set('pageUrl', pageUrl)
  u.searchParams.set('size', String(size))
  return u.toString()
}

export function initials(input: string): string {
  if (!input) return '?'
  let text = input
  try {
    text = new URL(input).hostname.replace(/^www\./, '')
  } catch {
    // not a url; use the raw text
  }
  const first = text.trim()[0]
  return first ? first.toUpperCase() : '?'
}
