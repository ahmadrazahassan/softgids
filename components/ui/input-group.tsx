import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Composes an input with leading/trailing addons (icons, buttons) inside a
 * single bordered control.
 */
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "border-input flex h-10 w-full items-center gap-2 rounded-2xl border bg-background px-3 shadow-xs transition-colors",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40",
        "[&_input]:h-full [&_input]:flex-1 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:shadow-none [&_input]:outline-none [&_input]:ring-0 [&_input]:text-sm",
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function InputGroupAddon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn("flex items-center gap-1 text-muted-foreground", className)}
      {...props}
    />
  );
}

export { InputGroup, InputGroupAddon };
