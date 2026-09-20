import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 🌟 把 public/version.json 裡的版本標記烘進打包後的 JS，讓執行中的網頁知道「自己是哪一版」，
// 之後才能跟輪詢到的最新 version.json 比對，偵測到有新版部署時提示使用者重新整理。
let appVersion = 'dev'
try {
  appVersion = JSON.parse(readFileSync(resolve(__dirname, 'public/version.json'), 'utf-8')).version
} catch {
  // 開發環境或第一次 clone 專案時可能還沒產生過 version.json，用預設值即可，不影響開發
}

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
})