"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import type { CreateProductRequest } from "@/types";

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (
    data: CreateProductRequest & { imageUrl?: string }
  ) => {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "新增失敗");
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors min-h-[44px] mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-5">新增商品</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <AdminProductForm onSubmit={handleSubmit} submitLabel="立即上架" />
      </div>
    </div>
  );
}
