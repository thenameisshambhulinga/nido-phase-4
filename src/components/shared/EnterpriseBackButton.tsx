import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClick?: () => void;
  label?: string;
  className?: string;
}

export default function EnterpriseBackButton({
  onClick,
  label = "Back",
  className = "",
}: Props) {
  return (
    <Button
      variant="outline"
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${className}`}
      onClick={onClick}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}
