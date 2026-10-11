---
target: 學生端 StudentHome/Quiz/App（複評）
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/wuhaoyu/Documents/程式工具集/my-test-system/src/components/StudentHome.jsx"
target_fingerprint: "sha256:bac6b89b252cef849b995986f3816045a50f92bca50cb359d76f147baccd1726"
target_path: /Users/wuhaoyu/Documents/程式工具集/my-test-system/src/components/StudentHome.jsx
timestamp: 2026-10-11T13-08-27Z
slug: src-components-studenthome-jsx
---
Method: dual-agent (A: design re-review subagent · B: detector subagent). Browser visualization skipped: no browser automation available.

## Design Health Score: 27/40 (Good) — previous 20/40
1 狀態 3｜2 語言 3｜3 控制 3｜4 一致 3｜5 防錯 3｜6 辨識 3｜7 效率 2｜8 極簡 3｜9 復原 2｜10 說明 2

## Design Specificity
有自己的個性：印章、像素進度格、試穿＋剩餘算式、角色跳、白字描邊。Detector: 0 findings（上次 2）。

## Priority Issues
- [P0] Quiz.jsx:194 結算以舊 profile 餘額覆寫 coins（讀取失敗→餘額被覆蓋；多裝置競爭）；寫入失敗仍慶祝 → increment()、存入中狀態、失敗重試；購買用 transaction。harden（既有問題）
- [P1] 印章在題目框底部，手機捲動後看不到；回饋期間選項 :disabled 變灰像全錯 → 印章蓋在選中選項上、鎖定不變灰。adapt, polish
- [P1] 購買離線時 isBuying 卡住、對話框關不掉；toast z-index 2500 < 對話框 3000 → 對話框內顯示錯誤、逾時解鎖。harden
- [P2] 手機商城整面「還差」、無排序；56px 頭像捲走看不到跳 → 固定頭像列、買得起優先、鎖住可試穿。distill, delight
- [P2] 設定讀取失敗永遠載入中；Quiz.jsx:91 原生 alert；更新橫幅蓋住離開鈕。harden, clarify

## Persona Red Flags
手機：測驗進度不保存、中途離開可換考卷不觸發冷卻。新手：金幣用途不明、兩次開始。三年級：「戴著・脫下」難懂、使用中像購買鈕、練習連結 24px、Enter 直接購買。

## Minor
firstTryScore 閉包少 1（既有）；對話框無焦點陷阱／歸還；分頁列焦點框看不見；登出 40px；長名字擠徽章；桌機漂浮動畫換裝後消失；描邊在密集國字糊；單元排序字碼序。

## Questions
目標造型存錢進度？手機角色常駐？最終仍不揭露答案是否合適？
