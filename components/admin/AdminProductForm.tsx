"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";
import Image from "next/image";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/types";

const productSchema = z.object({
  name: z.string().min(1, "請輸入商品名稱").max(100, "最多 100 字"),
  totalStock: z.number().int().min(1, "上架數量至少 1"),
  price: z.number().int().min(0, "售價不可為負數"),
  cost: z.number().int().min(0, "成本不可為負數"),
  note: z.string().max(300, "備註最多 300 字").optional(),
  storeName: z.string().max(50, "店家名稱最多 50 字").optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AdminProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: ProductFormData & { imageUrl?: string }) => Promise<void>;
  submitLabel?: string;
}

export function AdminProductForm({
  initialData,
  onSubmit,
  submitLabel = "上架商品",
}: AdminProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null
  );
  const [imageUrl, setImageUrl] = useState<string>(
    initialData?.imageUrl || ""
  );
  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      totalStock: initialData?.totalStock || 1,
      price: initialData?.price || 0,
      cost: initialData?.cost || 0,
      note: initialData?.note || "",
      storeName: initialData?.storeName || "",
    },
  });

  /** 圖片上傳處理 */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 本地預覽
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // 上傳到 server
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.url) {
        setImageUrl(json.url);
      } else {
        console.error("Upload failed:", json.error);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    setSubmitError("");
    try {
      await onSubmit({ ...data, imageUrl });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "送出失敗，請重試");
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
      {/* 圖片上傳 */}
      <div className="flex flex-col gap-2">
        <Label>商品圖片</Label>
        {imagePreview ? (
          <div className="relative w-full aspect-square max-w-sm rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={imagePreview}
              alt="商品圖片預覽"
              fill
              className="object-cover"
            />
            {uploadLoading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-sm">上傳中...</span>
              </div>
            )}
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            {/* 拍照按鈕（手機優先） */}
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.capture = "environment";
                  fileInputRef.current.click();
                }
              }}
              className="flex-1 flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-primary hover:text-primary transition-colors active:bg-gray-50"
            >
              <Camera className="h-7 w-7" />
              <span className="text-xs font-medium">拍照</span>
            </button>

            {/* 選擇相片 */}
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.click();
                }
              }}
              className="flex-1 flex flex-col items-center justify-center gap-2 h-28 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-primary hover:text-primary transition-colors active:bg-gray-50"
            >
              <Upload className="h-7 w-7" />
              <span className="text-xs font-medium">從相簿選取</span>
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-gray-400">建議圖片大小 &lt; 5MB，支援 JPG / PNG / WebP</p>
      </div>

      {/* 商品名稱 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">商品名稱 *</Label>
        <Input
          id="name"
          placeholder="例如：DHC 深層卸妝油 200ml"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* 上架數量 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="totalStock">上架數量 *</Label>
        <Input
          id="totalStock"
          type="number"
          min="1"
          inputMode="numeric"
          {...register("totalStock", { valueAsNumber: true })}
        />
        {errors.totalStock && (
          <p className="text-sm text-red-500">{errors.totalStock.message}</p>
        )}
      </div>

      {/* 售價 / 成本 - 並排 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">售價 ($) *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            inputMode="numeric"
            {...register("price", { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-sm text-red-500">{errors.price.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cost">成本 (¥)</Label>
          <Input
            id="cost"
            type="number"
            min="0"
            inputMode="numeric"
            {...register("cost", { valueAsNumber: true })}
          />
          {errors.cost && (
            <p className="text-sm text-red-500">{errors.cost.message}</p>
          )}
        </div>
      </div>

      {/* 店家名稱 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="storeName">店家名稱</Label>
        <Input
          id="storeName"
          placeholder="例如：松本清、BIC CAMERA"
          {...register("storeName")}
        />
      </div>

      {/* 備註 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">備註</Label>
        <Textarea
          id="note"
          placeholder="補充說明、注意事項..."
          rows={3}
          {...register("note")}
        />
      </div>

      {submitError && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">
          {submitError}
        </p>
      )}

      {/* 操作按鈕 */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || uploadLoading}
          className="flex-1 h-12 text-base"
        >
          {isSubmitting ? "送出中..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="h-12 sm:w-24"
        >
          取消
        </Button>
      </div>
    </form>
  );
}
