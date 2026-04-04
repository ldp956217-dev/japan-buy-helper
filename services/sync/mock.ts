/**
 * Mock Sync Service
 * 未設定 Google Sheets 時使用此實作，只印 log
 */
import type {
  SyncService,
  ProductSummaryRow,
  BuyerSummaryRow,
  ReservationDetailRow,
} from "./types";

export class MockSyncService implements SyncService {
  async syncProductSummary(product: ProductSummaryRow): Promise<void> {
    console.log("[MockSync] syncProductSummary:", product.serialNo, product.name);
  }

  async syncBuyerSummary(buyer: BuyerSummaryRow): Promise<void> {
    console.log("[MockSync] syncBuyerSummary:", buyer.nickname);
  }

  async appendReservationDetail(
    reservation: ReservationDetailRow
  ): Promise<void> {
    console.log("[MockSync] appendReservationDetail:", reservation.orderNo);
  }
}
