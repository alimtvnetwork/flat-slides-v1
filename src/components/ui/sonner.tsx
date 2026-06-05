import { Toaster as Sonner } from "sonner";
import { useEffect, useState } from "react";

import { getSlidesPortalRoot } from "@/components/slides/fullscreenTarget";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const syncContainer = () => setContainer(getSlidesPortalRoot());
    syncContainer();
    document.addEventListener("fullscreenchange", syncContainer);
    const observer = new MutationObserver(syncContainer);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener("fullscreenchange", syncContainer);
      observer.disconnect();
    };
  }, []);

  return (
    <Sonner
      className="toaster group"
      container={container ?? undefined}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
