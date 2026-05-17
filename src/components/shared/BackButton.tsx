import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  fallbackPath?: string;
  label?: string;
}

export default function GlobalBackButton({
  className,
  fallbackPath,
  label,
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      navigate("/home");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn(
        "h-8 w-8 rounded-lg border border-transparent text-foreground transition-all duration-200",
        "hover:scale-105 hover:border-white/20 hover:bg-white/10 hover:shadow-md",
        "active:scale-95",
        "backdrop-blur-sm bg-white/80",
        className,
      )}
      title={label || "Go back"}
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );
}
