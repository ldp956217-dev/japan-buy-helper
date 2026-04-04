/**
 * Google Sheets 同步 Service Abstraction
 * 主流程不依賴 Sheets，sync 失敗只記 log
 */

export interface ProductSummaryRow {
  serialNo: string;
  name: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  price: number;
  cost: number;
  status: string;
  updatedAt: string;
}

export interface BuyerSummaryRow {
  nickname: string;
  guestToken: string;
  reservationCount: number;
  totalItems: number;
  totalAmount: number;
  lastReservationAt: string;
}

export interface ReservationDetailRow {
  orderNo: string;
  productSerialNo: string;
  productName: string;
  nickname: string;
  guestToken: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  reservedAt: string;
}

/** Sync Service 介面，所有實作都需符合此介面 */
export interface SyncService {
  syncProductSummary(product: ProductSummaryRow): Promise<void>;
  syncBuyerSummary(buyer: BuyerSummaryRow): Promise<void>;
  appendReservationDetail(reservation: ReservationDetailRow): Promise<void>;
}
