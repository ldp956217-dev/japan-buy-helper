# 🇯🇵 Japan Buy Helper — 日本代購預定網站

手機優先的輕量代購網站，讓你在日本逛街時可以快速拍照上架、分享給朋友預定。

---

## 專案簡介

- **Admin（代購主）**：快速上架商品（拍照 → 輸入 → 上架），管理庫存與查看預定明細
- **Guest（朋友）**：不需註冊，輸入暱稱即可預定，同裝置記住身份
- **防超賣**：後端 Transaction 確保原子性，絕不超賣
- **Google Sheets 同步**：可選配置，商品/訂單自動同步報表

---

## 技術棧

| 層級 | 技術 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 語言 | TypeScript |
| 樣式 | Tailwind CSS + shadcn/ui |
| ORM  | Prisma |
| 資料庫 | PostgreSQL |
| 驗證 | Zod + React Hook Form |
| 圖片 | 本地 `/public/uploads/`（可擴充至 Cloudinary/Supabase）|
| Auth | JWT (jose) + HttpOnly Cookie |

---

## 安裝步驟

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env`，至少需要填入：

```env
# PostgreSQL 連線字串
DATABASE_URL="postgresql://postgres:password@localhost:5432/japan_buy_helper"

# JWT 密鑰（請自行產生隨機字串）
JWT_SECRET="your-super-secret-jwt-key"

# Admin 帳號密碼（seed 時使用）
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin1234"
```

### 3. 資料庫初始化

```bash
# 建立資料表（開發環境）
npm run db:push

# 或使用 migrate（有版本記錄）
npm run db:migrate
```

### 4. 執行 Seed（初始資料）

```bash
npm run db:seed
```

Seed 會建立：
- Admin 帳號（預設 `admin` / `admin1234`）
- 3 筆示範商品
- 1 位示範 Guest + 2 筆訂單
- 流水號計數器初始化

### 5. 啟動開發伺服器

```bash
npm run dev
```

打開 [http://localhost:3000](http://localhost:3000)

---

## 頁面路由

### 前台（給朋友）

| 路徑 | 說明 |
|------|------|
| `/` | 商品列表 |
| `/product/[id]` | 商品詳情 + 預定 |
| `/me` | 我的預定記錄 |
| `/nickname` | 設定/修改暱稱 |

### 後台（管理員）

| 路徑 | 說明 |
|------|------|
| `/admin/login` | 登入 |
| `/admin` | 商品管理列表 |
| `/admin/products/new` | 新增商品 |
| `/admin/products/[id]/edit` | 編輯商品 |
| `/admin/reservations` | 預定明細 |
| `/admin/buyers` | 購買人總覽 |

---

## Google Sheets 同步設定

### 1. 建立 Google Sheets

在你的 Google Sheets 建立三個分頁（名稱必須完全一致）：
- `商品總表`
- `購買人總表`
- `購買明細`

每個分頁第一列加上標題（系統不會自動建立 header）：

**商品總表**：`商品流水號 / 商品名稱 / 總上架 / 已預定 / 剩餘 / 售價 / 成本 / 狀態 / 最後更新`

**購買人總表**：`暱稱 / guestToken / 預定筆數 / 總件數 / 總代付金額 / 最近預定`

**購買明細**：`訂單號 / 商品流水號 / 商品名稱 / 暱稱 / guestToken / 數量 / 單價 / 小計 / 狀態 / 訂購時間`

### 2. 建立 Service Account

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立專案 → 啟用 Google Sheets API
3. 建立 Service Account → 下載 JSON 金鑰
4. 將 Service Account Email 加入 Google Sheets 的「編輯者」權限

### 3. 設定環境變數

```env
GOOGLE_SHEETS_ENABLED="true"
GOOGLE_SHEETS_ID="你的試算表 ID（從網址取得）"
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...完整 JSON 內容...}'
```

### 4. 同步說明

- Sheets 同步失敗**不影響**主要流程（建立商品/訂單仍會成功）
- 失敗時只記錄 log，不會拋出錯誤給使用者
- 未設定時自動使用 Mock 模式（console.log 輸出）

---

## 圖片上傳擴充

目前預設使用本地 `public/uploads/`，如需替換：

### 切換至 Cloudinary

```env
UPLOAD_PROVIDER="cloudinary"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

修改 `app/api/upload/route.ts`，在驗證後呼叫 Cloudinary SDK 上傳。

### 切換至 Supabase Storage

```env
UPLOAD_PROVIDER="supabase"
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_STORAGE_BUCKET="product-images"
```

---

## 資料庫 Schema 說明

| 資料表 | 說明 |
|--------|------|
| `Product` | 商品，含庫存邏輯（totalStock / reservedStock） |
| `Guest` | 買家身份，以 guestToken（uuid）識別 |
| `Reservation` | 預定記錄，含快照欄位（名稱/單價/暱稱） |
| `AdminUser` | 管理員帳號 |
| `Counter` | 流水號計數器（P00001 / R00001）|

---

## 常用指令

```bash
# 開發
npm run dev

# 資料庫
npm run db:push       # 同步 schema（開發）
npm run db:migrate    # 建立 migration（正式）
npm run db:seed       # 填入種子資料
npm run db:studio     # 開啟 Prisma Studio（視覺化 DB）
npm run db:generate   # 重新產生 Prisma Client

# 建置
npm run build
npm run start
```

---

## 未來可擴充方向

1. **圖片壓縮**：上傳時用 `sharp` 自動縮圖（API 已預留空間）
2. **推播通知**：新預定時透過 LINE Notify / Telegram 通知代購主
3. **訂單管理**：Admin 可標記訂單為「已付款」/「已帶回」
4. **多國貨幣**：加入匯率換算（日幣 → 台幣）
5. **商品分類**：藥妝 / 食品 / 電器等分類篩選
6. **PWA**：加入 Service Worker，讓前台可以「加到主螢幕」
7. **預定期限**：設定商品預定截止時間
8. **重複訂單保護**：同一人對同一商品只能預定一次（可選）

---

## 注意事項

- `JWT_SECRET` 請在正式環境使用強隨機字串（至少 32 字元）
- `public/uploads/` 目錄下的圖片不進 git（已加入 .gitignore）
- 正式部署建議改用 Cloudinary 或 Supabase Storage 儲存圖片
- PostgreSQL 需要先建立資料庫：`CREATE DATABASE japan_buy_helper;`
