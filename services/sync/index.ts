/**
 * Sync Service Factory
 * 根據環境變數決定使用 Mock 還是 Google Sheets
 */
import type { SyncService } from "./types";
import { MockSyncService } from "./mock";

export type { SyncService } from "./types";
export type {
  ProductSummaryRow,
  BuyerSummaryRow,
  ReservationDetailRow,
} from "./types";

let _syncService: SyncService | null = null;

export async function getSyncService(): Promise<SyncService> {
  if (_syncService) return _syncService;

  const isEnabled = process.env.GOOGLE_SHEETS_ENABLED === "true";
  const hasSheetId = !!process.env.GOOGLE_SHEETS_ID;
  const hasCredentials = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (isEnabled && hasSheetId && hasCredentials) {
    // 動態 import，避免不需要時載入 googleapis
    const { GoogleSheetsSyncService } = await import("./googleSheets");
    _syncService = new GoogleSheetsSyncService();
    console.log("[Sync] Using Google Sheets sync service");
  } else {
    _syncService = new MockSyncService();
    if (isEnabled) {
      console.warn(
        "[Sync] GOOGLE_SHEETS_ENABLED=true 但缺少必要環境變數，使用 Mock"
      );
    }
  }

  return _syncService;
}

/**
 * 安全執行 sync，失敗只 log，不影響主流程
 */
export async function safeSync(
  fn: (service: SyncService) => Promise<void>
): Promise<void> {
  try {
    const service = await getSyncService();
    await fn(service);
  } catch (error) {
    // Sync 失敗不影響主流程，只記 log
    console.error("[Sync] 同步失敗（主流程不受影響）:", error);
  }
}
