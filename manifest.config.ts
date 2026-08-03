import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzeGwTEcwWvOnf8CrJeCquLaf2WcmLmoVAlXRbWWfmD9djjKff324J9DFnSOWLjvhnmFyT3nrkmvWki4fdGRYhh2xI2VcPYHwI1nymOewCeVilqFnCS5rSDRWbKHr8MrN0mMYg3e7sWns82iZCQ1eA+9/rNMLySku0Qz9QUMOtVNPWFNfPz1MTTqEwBOzyY1LCThLb33J1qxjQRtVYQJ/DSCj2RJFe2ilIJPuENI/ZLOhcEzrvDjQDXY4t+/xwO4sZfa6IVcYkIpKRrLl/0wulWZWDjMrJYt9u15+Y8uyDceWa2REmdgX2Aru+NHP3odhLDy0tkOVQE88iXiAvlB48QIDAQAB',
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
