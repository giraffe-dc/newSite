import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import styles from "../../styles/Button.module.css";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "fun" | "playful" | "hero" | "cute";
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  asChild?: boolean;
  className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const variantClass = styles[`variant-${variant}`] || styles["variant-default"];
    const sizeClass = styles[`size-${size}`] || styles["size-default"];

    return (
      <Comp
        className={cn(styles.buttonBase, variantClass, sizeClass, className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };