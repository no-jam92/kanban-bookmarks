import { describe, it, expect } from 'vitest'
import { boardEmoji } from './board-icon'

describe('boardEmoji', () => {
  it('is deterministic for the same name', () => {
    expect(boardEmoji('Work')).toBe(boardEmoji('Work'))
  })

  it('returns an emoji from the palette', () => {
    const palette = ['📋','🗂️','💼','📚','🎯','🚀','🧩','🛠️','💡','📦','🔖','📝','⭐','🌱','🎨','🔬','🗺️','📈','🧪','☕']
    expect(palette).toContain(boardEmoji('Books'))
    expect(palette).toContain(boardEmoji(''))
  })
})
