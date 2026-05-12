import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ValidationAlertProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  autoClose?: number;
}

export default function ValidationAlert({
  open,
  onClose,
  title = "Invalid Input",
  message,
  autoClose = 4000,
}: ValidationAlertProps) {
  useEffect(() => {
    if (!open || autoClose <= 0) return;
    const timeout = setTimeout(onClose, autoClose);
    return () => clearTimeout(timeout);
  }, [autoClose, onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/75 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative z-10 w-full max-w-[min(92vw,42rem)] overflow-hidden rounded-[2rem] border border-border/70 bg-card/95 shadow-2xl"
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 18 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
          >
            <div
              className="h-1.5 w-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--destructive)), hsl(var(--warning)), hsl(var(--primary)))" }}
            />

            <div className="relative p-6 sm:p-8">
              <div className="absolute right-5 top-5">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <motion.div
                  className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-destructive/20 bg-destructive/10 text-destructive"
                  initial={{ rotate: -12, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 260 }}
                >
                  <AlertCircle className="h-8 w-8" />
                </motion.div>

                <div className="flex-1 space-y-4">
                  <div className="space-y-2 pr-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> Attention needed
                    </div>
                    <h3 className="text-2xl font-display font-bold tracking-tight text-foreground">{title}</h3>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{message}</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Please correct the highlighted information and try again.
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={onClose} className="min-w-32">
                      Understood
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {autoClose > 0 && (
              <motion.div
                className="h-1 bg-primary/30"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: autoClose / 1000, ease: "linear" }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
