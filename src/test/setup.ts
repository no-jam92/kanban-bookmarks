// Vitest 전역 setup. 각 테스트 파일이 직접 createFakeChrome로 교체하므로
// 여기서는 안전한 기본 stub만 둔다.
import { beforeEach } from 'vitest'
import { createFakeChrome } from './fake-chrome'

beforeEach(() => {
  globalThis.chrome = createFakeChrome([
    { id: '1', title: 'Bookmarks Bar', children: [] },
  ]) as unknown as typeof chrome
})
