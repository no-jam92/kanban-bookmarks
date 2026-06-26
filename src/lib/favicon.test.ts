import { describe, it, expect, beforeEach } from 'vitest'
import { createFakeChrome } from '../test/fake-chrome'
import { faviconUrl, initials } from './favicon'

beforeEach(() => {
  globalThis.chrome = createFakeChrome() as unknown as typeof chrome
})

describe('favicon', () => {
  it('builds an encoded _favicon url with size', () => {
    const url = faviconUrl('https://svelte.dev/docs', 32)
    expect(url).toBe(
      'chrome-extension://fake/_favicon/?pageUrl=https%3A%2F%2Fsvelte.dev%2Fdocs&size=32',
    )
  })

  it('derives initials from a url host', () => {
    expect(initials('https://svelte.dev')).toBe('S')
  })

  it('derives initials from plain text and handles empty', () => {
    expect(initials('todo')).toBe('T')
    expect(initials('')).toBe('?')
  })
})
