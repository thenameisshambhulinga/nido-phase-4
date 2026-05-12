import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
        destructive: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
        outline:
          "border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB]",
        secondary:
          "bg-white border border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB]",
        ghost: "bg-transparent hover:bg-[#F1F5F9] text-[#111827]",
        link: "text-[#2563EB] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-10 px-3 text-sm",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const actionButtonPattern = /\b(import|export|download|pdf|print)\b/i;

const extractTextContent = (node: React.ReactNode): string => {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextContent).join(" ");
  }

  if (React.isValidElement(node)) {
    return extractTextContent(node.props.children);
  }

  return "";
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const buttonText = extractTextContent(children);
    const isCreativeActionButton = actionButtonPattern.test(buttonText);

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          isCreativeActionButton && "btn-creative-action",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
