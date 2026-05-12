declare module "@radix-ui/react-dialog" {
  import * as React from "react";

  export interface RootProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
  }

  export const Root: React.ComponentType<RootProps>;

  export const Trigger: React.ForwardRefExoticComponent<
    (React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) &
      React.RefAttributes<HTMLButtonElement>
  >;

  export const Close: React.ForwardRefExoticComponent<
    (React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) &
      React.RefAttributes<HTMLButtonElement>
  >;

  export const Portal: React.ComponentType<React.PropsWithChildren<unknown>>;

  export const Overlay: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;

  export const Content: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >;

  export const Title: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLHeadingElement> &
      React.RefAttributes<HTMLHeadingElement>
  >;

  export const Description: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLParagraphElement> &
      React.RefAttributes<HTMLParagraphElement>
  >;
}
