"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface LightDismissDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  rawContent?: boolean;
}

export function LightDismissDialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = "max-w-2xl",
  rawContent = false,
}: LightDismissDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener("close", handleClose);

    // Fallback for browsers without closedby support (from modern-web-guidance light-dismiss-a-dialog)
    const handleBackdropClick = (event: MouseEvent) => {
      if ("closedBy" in HTMLDialogElement.prototype) return;
      if (event.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (isDialogContent) return;
      dialog.close();
    };

    dialog.addEventListener("click", handleBackdropClick);

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={rawContent ? undefined : titleId}
      aria-label={rawContent ? title : undefined}
      className={`w-[calc(100%-1.25rem)] ${maxWidthClass} rounded-3xl bg-[#F4F3EE] text-[#252525] p-0 shadow-2xl border-2 border-[#252525]/20 backdrop:bg-[#252525]/75 backdrop:backdrop-blur-sm overflow-hidden`}
    >
      {rawContent ? (
        <div className="max-h-[90vh] overflow-y-auto">{children}</div>
      ) : (
        <div className="flex flex-col max-h-[88vh]">
          <div className="flex items-start justify-between gap-4 bg-[#252525] text-[#DCDACF] px-6 py-5 border-b border-[#CB4B3B]/40">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#CB4B3B] mb-1">
                Igreja do Alto • Cuidado Pastoral
              </span>
              <h2 id={titleId} className="text-xl font-black uppercase tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[#DCDACF]/80 mt-1 font-normal">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Fechar janela"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-[#363636] text-[#DCDACF] hover:bg-[#CB4B3B] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">{children}</div>
        </div>
      )}
    </dialog>
  );
}
