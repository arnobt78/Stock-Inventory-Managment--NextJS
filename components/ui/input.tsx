import * as React from "react";

import { cn } from "@/lib/utils";
import { FOCUS_NO_LAYOUT_SHIFT_CLASS, FOCUS_VISIBLE_NEUTRAL_RING_CLASS } from "@/lib/ui/focus-ring-styles";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-transparent px-2 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          FOCUS_NO_LAYOUT_SHIFT_CLASS,
          FOCUS_VISIBLE_NEUTRAL_RING_CLASS,
          "dark:border-white/20 dark:bg-white/5 dark:text-white dark:placeholder:text-white/50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
