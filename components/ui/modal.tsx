"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Accessible dialog: focus is moved in on open, trapped while open, and
 * restored on close. Escape and backdrop both dismiss. Body scroll is locked.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  variant = "admin",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "admin" | "brand";
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    const timer = window.setTimeout(() => {
      const [first] = focusables();
      (first ?? panelRef.current)?.focus();
    }, 20);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  // A modal only opens from a client interaction, so there is nothing to render
  // during SSR and no hydration mismatch to guard against.
  if (!open || typeof document === "undefined") return null;

  const widths = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  } as const;

  const brand = variant === "brand";

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-charcoal-950/70 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl animate-fade-up",
          "rounded-t-2xl sm:rounded-2xl",
          widths[size],
          brand
            ? "bg-charcoal-900 text-cream-100 border border-cream-100/10"
            : "bg-white text-slate-900",
        )}
      >
        <div
          className={cn(
            "flex items-start justify-between gap-4 px-5 py-4 border-b shrink-0",
            brand ? "border-cream-100/10" : "border-slate-200",
          )}
        >
          <div className="min-w-0">
            <h2
              id={titleId}
              className={cn(
                "text-base font-semibold truncate",
                brand && "display text-xl",
              )}
            >
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs opacity-60 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 -mr-1"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="overflow-y-auto thin-scroll px-5 py-4 grow">{children}</div>

        {footer && (
          <div
            className={cn(
              "flex flex-wrap items-center justify-end gap-2 px-5 py-3.5 border-t shrink-0",
              brand ? "border-cream-100/10 bg-charcoal-950/40" : "border-slate-200 bg-slate-50",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** Confirmation for destructive/irreversible admin actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = true,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "danger" : "solid"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
    </Modal>
  );
}
