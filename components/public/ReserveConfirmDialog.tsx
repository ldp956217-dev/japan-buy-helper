"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatTWD } from "@/lib/utils";

interface ReserveConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  quantity: number;
  unitPrice: number;
  nickname: string;
  isLoading?: boolean;
}

export function ReserveConfirmDialog({
  open,
  onClose,
  onConfirm,
  productName,
  quantity,
  unitPrice,
  nickname,
  isLoading = false,
}: ReserveConfirmDialogProps) {
  const totalAmount = unitPrice * quantity;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isLoading && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>確認預定</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <p className="text-sm text-gray-600">
            你確定要預定以下商品嗎？
          </p>

          <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm text-gray-500">商品</span>
              <span className="text-sm font-medium text-right">{productName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">數量</span>
              <span className="text-sm font-medium">{quantity} 件</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">單價</span>
              <span className="text-sm font-medium">{formatTWD(unitPrice)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">小計</span>
              <span className="text-base font-bold text-primary">
                {formatTWD(totalAmount)}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            預定人：{nickname}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none h-11"
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 sm:flex-none h-11"
          >
            {isLoading ? "預定中..." : "確認無誤！"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
