"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";

type ToastProps = React.ComponentProps<typeof ToastPrimitives.Root> & {
  variant?: "default" | "success" | "error";
};

const ToastContext = React.createContext<{
  toast: (props: ToastProps) => void;
}>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [props, setProps] = React.useState<ToastProps>({});

  const toast = React.useCallback((p: ToastProps) => {
    setProps(p);
    setOpen(true);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitives.Provider>
        {children}
        <ToastPrimitives.Root
          open={open}
          onOpenChange={setOpen}
          variant={props.variant || "default"}
          {...props}
        >
          <ToastPrimitives.Description>
            {props.title || props.description as string}
          </ToastPrimitives.Description>
        </ToastPrimitives.Root>
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
}
