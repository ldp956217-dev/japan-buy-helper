/**
 * Google Sheets Sync Service
 *
 * 環境變數需求:
 *   GOOGLE_SHEETS_ENABLED=true
 *   GOOGLE_SHEETS_ID=your-sheet-id
 *   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
 *
 * Sheet 分頁名稱:
 *   Sheet A: "商品總表"
 *   Sheet B: "購買人總表"
 *   Sheet C: "購買明細"
 */
import type {
  SyncService,
  ProductSummaryRow,
  BuyerSummaryRow,
  ReservationDetailRow,
} from "./types";

const SHEET_HEADERS = {
  商品總表: [
    "商品流水號", "商品名稱", "總上架數量", "總預定數量", "剩餘數量",
    "單價(TWD)", "成本(JPY)", "狀態", "最後更新時間",
  ],
  購買人總表: [
    "暱稱", "Guest Token", "預定筆數", "已預定商品數", "總代付金額(TWD)", "最近預定時間",
  ],
  購買明細: [
    "訂單編號", "商品流水號", "商品名稱", "訂購人暱稱", "Guest Token",
    "數量", "單價(TWD)", "金額(TWD)", "訂單狀態", "訂購時間",
  ],
} as const;

export class GoogleSheetsSyncService implements SyncService {
  private sheetsId: string;
  private auth: unknown = null;
  private headersInitialized = new Set<string>();

  constructor() {
    this.sheetsId = process.env.GOOGLE_SHEETS_ID || "";
  }

  /** 初始化 Google Auth（lazy init） */
  private async getAuth() {
    if (this.auth) return this.auth;

    const { google } = await import("googleapis");

    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON 未設定");
    }

    const credentials = JSON.parse(serviceAccountJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.auth = auth;
    return auth;
  }

  private async getSheetsClient() {
    const { google } = await import("googleapis");
    const auth = await this.getAuth();
    return google.sheets({ version: "v4", auth: auth as Parameters<typeof google.sheets>[0]["auth"] });
  }

  /**
   * 確保 Sheet 第一列是表頭（只在同 process 內初始化一次）
   */
  private async ensureHeaders(sheetName: keyof typeof SHEET_HEADERS): Promise<void> {
    if (this.headersInitialized.has(sheetName)) return;

    const sheets = await this.getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetsId,
      range: `${sheetName}!A1:Z1`,
    });

    const firstRow = res.data.values?.[0];
    if (!firstRow || firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetsId,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [SHEET_HEADERS[sheetName]] },
      });
      console.log(`[GoogleSheets] 初始化表頭: ${sheetName}`);
    }

    this.headersInitialized.add(sheetName);
  }

  /**
   * 同步商品總表 (Sheet A)
   * 策略: 搜尋 serialNo，若存在則更新，否則 append
   */
  async syncProductSummary(product: ProductSummaryRow): Promise<void> {
    await this.ensureHeaders("商品總表");
    const sheets = await this.getSheetsClient();
    const sheetName = "商品總表";

    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetsId,
      range: `${sheetName}!A:A`,
    });

    const rows = readRes.data.values || [];
    const rowIndex = rows.findIndex((r) => r[0] === product.serialNo);

    const rowData = [
      product.serialNo,
      product.name,
      product.totalStock,
      product.reservedStock,
      product.availableStock,
      product.price,
      product.cost,
      product.status,
      product.updatedAt,
    ];

    if (rowIndex > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetsId,
        range: `${sheetName}!A${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: [rowData] },
      });
    } else if (rowIndex === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.sheetsId,
        range: `${sheetName}!A:I`,
        valueInputOption: "RAW",
        requestBody: { values: [rowData] },
      });
    }

    console.log(`[GoogleSheets] syncProductSummary: ${product.serialNo} done`);
  }

  /**
   * 同步購買人總表 (Sheet B)
   * 策略: 搜尋 guestToken (B欄)，若存在則更新，否則 append
   */
  async syncBuyerSummary(buyer: BuyerSummaryRow): Promise<void> {
    await this.ensureHeaders("購買人總表");
    const sheets = await this.getSheetsClient();
    const sheetName = "購買人總表";

    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetsId,
      range: `${sheetName}!B:B`,
    });

    const rows = readRes.data.values || [];
    const rowIndex = rows.findIndex((r) => r[0] === buyer.guestToken);

    const rowData = [
      buyer.nickname,
      buyer.guestToken,
      buyer.reservationCount,
      buyer.totalItems,
      buyer.totalAmount,
      buyer.lastReservationAt,
    ];

    if (rowIndex > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetsId,
        range: `${sheetName}!A${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: [rowData] },
      });
    } else if (rowIndex === -1) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: this.sheetsId,
        range: `${sheetName}!A:F`,
        valueInputOption: "RAW",
        requestBody: { values: [rowData] },
      });
    }

    console.log(`[GoogleSheets] syncBuyerSummary: ${buyer.nickname} done`);
  }

  /**
   * 新增一筆預定明細 (Sheet C)
   * 策略: 永遠 append
   */
  async appendReservationDetail(reservation: ReservationDetailRow): Promise<void> {
    await this.ensureHeaders("購買明細");
    const sheets = await this.getSheetsClient();
    const sheetName = "購買明細";

    const rowData = [
      reservation.orderNo,
      reservation.productSerialNo,
      reservation.productName,
      reservation.nickname,
      reservation.guestToken,
      reservation.quantity,
      reservation.unitPrice,
      reservation.totalAmount,
      reservation.status,
      reservation.reservedAt,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: this.sheetsId,
      range: `${sheetName}!A:J`,
      valueInputOption: "RAW",
      requestBody: { values: [rowData] },
    });

    console.log(`[GoogleSheets] appendReservationDetail: ${reservation.orderNo} done`);
  }
}
