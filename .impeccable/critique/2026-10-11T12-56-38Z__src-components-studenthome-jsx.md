---
target: 學生端 StudentHome/Quiz/App
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/wuhaoyu/Documents/程式工具集/my-test-system/src/components/StudentHome.jsx"
target_fingerprint: "sha256:18471c225456f4fcd16280137c8d1cef7d4b4bc49e398a24c9b7d60fc96665b6"
target_path: /Users/wuhaoyu/Documents/程式工具集/my-test-system/src/components/StudentHome.jsx
timestamp: 2026-10-11T12-56-38Z
slug: src-components-studenthome-jsx
---
Method: dual-agent (A: design review subagent · B: detector subagent). Browser visualization skipped: no browser automation available.

## Design Health Score: 20/40 (Acceptable)
1 狀態可見 2｜2 貼近語言 3｜3 控制自由 1｜4 一致性 2｜5 防錯 1｜6 辨識 3｜7 彈性 2｜8 極簡 3｜9 錯誤復原 1｜10 說明 2

## Design Specificity
外殼（像素卡片、硬陰影、tearsfont、金幣、底部分頁）專屬；核心互動（原生 confirm/alert、原生 radio、答題無回饋）通用。看起來像遊戲，玩起來像表單。
Detector: 2 × side-tab — Quiz.jsx:329 explanationBox（真問題），StudentHome.jsx:423 sectionTitle（半誤報）。

## Priority Issues
- [P1] 答題一點即送出且無對錯回饋（Quiz.jsx:229）→ 兩段式確認＋⭕/❌ 印章。harden, animate
- [P1] 結算與購買高峰未設計：金幣字對比 1.6（Quiz.jsx:277）、灰色回首頁、原生 confirm（StudentHome.jsx 購買）→ 像素徽章、去商城主鈕、自製購買對話框、自動裝備。delight, colorize
- [P1] 對學生顯示技術錯誤（StudentHome.jsx:73,76；App.jsx ErrorBoundary stack trace）→ 童趣錯誤卡＋再試一次。clarify, harden
- [P2] 白字對比 2.5–3.7；買不起的商品無區別 → 2px 硬描邊、還差 X 金幣。colorize
- [P2] 手機開始測驗在首屏外（約 760px 內容）→ 縮角色、大切換塊、主按鈕前移。layout, distill

## Persona Red Flags
手機使用者：開始鈕需捲動、中途離開遺失、更新橫幅 3 行無關閉。第一次使用：多一頁說明、不知冷卻可練習、使用中=紅色。國小生：radio 13px、登出無確認、變裝精靈 01–11、冷卻分鐘概念。

## Minor
floating-base 動畫無效；hover 未限 (hover:hover)、無 focus-visible；金幣徽章像按鈕；Quiz 手機無左右留白；選項字母對比 1.9；820px 平板巢狀捲動。

## Questions
存錢進度條？測驗結束直通商城？盲測是否刻意、結算逐題翻牌？
