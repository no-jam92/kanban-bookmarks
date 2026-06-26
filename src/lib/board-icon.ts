// 보드 이름으로부터 안정적인 기본 이모지를 고른다(저장 불필요).
// 같은 이름이면 항상 같은 이모지가 나온다.
const EMOJIS = [
  '📋', '🗂️', '💼', '📚', '🎯', '🚀', '🧩', '🛠️', '💡', '📦',
  '🔖', '📝', '⭐', '🌱', '🎨', '🔬', '🗺️', '📈', '🧪', '☕',
]

export function boardEmoji(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return EMOJIS[h % EMOJIS.length]
}
