import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Kanban Bookmarks',
  version: pkg.version,
  description: 'Chrome 북마크 폴더를 칸반 보드로 관리합니다.',
  permissions: ['bookmarks', 'favicon', 'storage', 'activeTab'],
  action: { default_title: '현재 탭을 칸반에 담기' },
  background: { service_worker: 'src/background.ts', type: 'module' },
  options_page: 'src/options/index.html',
  chrome_url_overrides: {
    newtab: 'src/newtab/index.html',
  },
})
