# 001-ort-fossology-compliance

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

# 002-

## constitution

## specify

增加另一種掃描目標 - 採用 Inno Setup 打包的安裝檔，具體需求是要詳細描述安裝在系統中的每個實體檔案，包括來自安裝包的資源、配置、以及各檔案的授權和類型資訊。因此，需要一套工具能自動解析 Inno Setup 安裝檔（Setup.exe），並将其內部包含的所有檔案完整還原，並根據檔案名稱、描述資源、二進制元資料（如版本資訊、資源描述）和 README/License 檔案等判斷每個檔案的屬性和授權狀況。
此方案的核心目的是：產生一份詳細的 SBOM，反映每一個安裝到用戶端的實體檔案的資訊，支持針對 Windows 安裝程式的供應鏈安全、法律遵從與資產管理。

## clarify

## plan

技術方案
- 解包工具：採用專門針對 Inno Setup 的解包工具，如  Innounp 、 InnoExtractor 或  InnoUnpacker ，提取安裝包內所有檔案與資料。
- 檔案類型判斷：針對解包出的檔案，進行多維度判斷：
  - 依照檔案名稱規則（副檔名、版本字串）。
  - 解析資源文件（如資源描述、ICON、META資源）。
  - 提取可執行檔中的資訊（版本、描述、內嵌資源）。
  - 搜尋 License 文件或 README 文件，導出授權條款與說明。
- 自動化流程：建立一個 CLI 介面，允許使用者指定 Inno Setup 安裝包路徑和輸出 SBOM 的位置。
- SBOM 格式：輸出符合 CyCloneDX 1.6 & SPDX 2.3 標準的 JSON 或 YAML，可以包括：
  - 每個解包出的檔案名稱、路徑。
  - 檔案類型與狀態描述（例如：執行檔、DLL、資源、配置檔等）。
  - 相關授權資訊（若解析到 License/README）。
- 驗證與測試：建立測試範例，驗證工具對多種不同版本 Inno Setup 打包安裝檔的兼容性與準確性。
流程步驟
- 輸入 Inno Setup 安裝檔（Setup.exe）。
- 使用 InnoUnpacker 或 Innounp 解析還原內容。
- 遍歷所有提取檔案，依循規則辨識檔案類型及元資料。
- 搜集可能的授權、描述資源、內部資訊，生成詳細 SBOM。
- 輸出標準化符合 SPDX 格式的 SBOM 文件。
- （可選）針對重要檔案進行安全或授權風險評估。
此規格確保針對 Inno Setup 打包格式提供一個完整可靠的解決方案，能讓用戶所有安裝在目標系統中的實體檔案都能被詳細描述並進行合規風險管控。

## checklist

## tasks

## analyze

## implement

---
