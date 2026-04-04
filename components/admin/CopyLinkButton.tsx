"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyLinkButtonProps {
  url: string;
  label?: string;
  text?: string; // 若有 text，複製 text；否則複製 url
}

export function CopyLinkButton({ url, label = "複製連結", text }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const content = text ?? url;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-9 gap-1.5 text-sm"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-600">已複製</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </Button>
  );
}
