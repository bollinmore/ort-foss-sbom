# 001-

## constitution

Create principles focused on code quality, testing standards, user experience consistency, and performance requirements

## specify

建立一個自動化開源軟體合規性檢查工具，整合 OSS Review Toolkit (ORT) 與 Fossology，從本地軟體原始碼產生完整 SBOM 並確認所有第三方套件授權合規。

核心需求：
1. 輸入本地專案路徑，自動執行 ORT Analyzer 解析依賴樹（禁用遠端下載）
2. 執行 ORT Scanner 產生 SPDX SBOM，包含所有第三方套件清單
3. 自動打包掃描結果（source tarball 或 SPDX）上傳至 Fossology API
4. 觸發 Fossology 授權掃描，交叉比對確認無遺漏套件或授權風險
5. 產生整合報告：SBOM + 授權合規狀態 + 風險警示
6. 支援 CI/CD 自動化，單一命令執行完整流程

成功標準：
- SBOM 涵蓋 100% 第三方套件（依賴解析 + 原始碼掃描）
- Fossology 授權辨識準確率 >95%
- 整個流程 <15 分鐘（本地掃描）
- 輸出標準化 SPDX + HTML 報告

## clarify

## plan

技術堆疊：Node.js 18+ + TypeScript + Docker + ORT CLI + Fossology REST API

架構設計：

data-model/
├── ProjectInput (localPath: string, config?: OrtConfig)
├── OrtScanResult (analyzer: yaml, scanner: spdx)
├── FossologyUpload (uploadId: number, scanResult: SPDX)
└── ComplianceReport (sbom: SPDX, licenses: LicenseScan[], risks: Risk[])

contracts/
├── POST /scan - 啟動完整流程
├── GET /status/:jobId - 查詢進度
└── GET /report/:projectId - 下載整合報告

核心模組：
1. OrtRunner: 封裝  ort analyze  +  ort scan ，配置 downloader.enabled=false
2. FossologyClient: REST API 客戶端（upload, schedule scan, download SPDX）
3. ReportMerger: 合併 ORT SBOM + Fossology 授權結果
4. WorkflowOrchestrator: 狀態機管理完整流程（analyze → scan → upload → wait → merge）
部署：
• Docker Compose: ORT CLI + Fossology 本地部署 + Node.js API
• GitHub Actions: CI/CD 範例工作流
Quickstart 測試場景：
1. npm run scan /path/to/project  → 產生 report.html
2. 驗證 SBOM 套件數 >0 且 Fossology license count >0
3. CI 環境端到端測試通過

## checklist

## tasks

## analyze

## implement

---
