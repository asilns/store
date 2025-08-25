"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      richColors
      closeButton
      {...props}
      toastOptions={{
        duration: 5000,
        classNames: {
            toast:
              "group toast relative pr-8 group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border",
            content: "pr-8",
            title: "group-[.toast]:text-foreground",
            description: "group-[.toast]:text-muted-foreground",
            actionButton:
              "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton:
              "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            closeButton: "!left-[100%] -ml-[5px]",
          },
      }}
    />
  );
}


