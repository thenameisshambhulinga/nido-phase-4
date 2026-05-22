// Toast notification manager - ensures consistent positioning and behavior
import { toast as sonerToast } from "sonner";

export type ToastType = "success" | "error" | "info" | "loading" | "warning";

interface ToastOptions {
  duration?: number;
  position?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
}

const defaultPosition = "top-right" as const;
const defaultDuration = 3000;

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonerToast.success(message, {
      position: options?.position || defaultPosition,
      duration: options?.duration || defaultDuration,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return sonerToast.error(message, {
      position: options?.position || defaultPosition,
      duration: options?.duration || defaultDuration,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return sonerToast.info(message, {
      position: options?.position || defaultPosition,
      duration: options?.duration || defaultDuration,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return sonerToast.warning(message, {
      position: options?.position || defaultPosition,
      duration: options?.duration || defaultDuration,
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return sonerToast.loading(message, {
      position: options?.position || defaultPosition,
      duration: options?.duration || 0, // Loading toasts don't auto-dismiss
    });
  },

  promise: async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions,
  ): Promise<T> => {
    const position = options?.position || defaultPosition;
    return sonerToast.promise(promise, messages, {
      position,
      duration: options?.duration || defaultDuration,
    });
  },
};
