"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

type ConfirmOptions = {
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  /** If set, user must type this exact string to enable the confirm button. */
  requireText?: string;
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [typedText, setTypedText] = useState("");
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setTypedText("");
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const finish = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
    setTypedText("");
  }, []);

  useEffect(() => {
    if (!options) setTypedText("");
  }, [options]);

  const requireText = options?.requireText;
  const matches = !requireText || typedText.trim() === requireText;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        onClose={() => finish(false)}
        title={options?.title ?? "ยืนยัน"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => finish(false)}>
              {options?.cancelLabel ?? "ยกเลิก"}
            </Button>
            <Button
              variant={options?.variant === "danger" ? "coral" : "primary"}
              size="sm"
              onClick={() => finish(true)}
              disabled={!matches}
            >
              {options?.confirmLabel ?? "ยืนยัน"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-body leading-relaxed">{options?.message}</p>
        {requireText && (
          <div className="mt-3 flex flex-col gap-1">
            <label className="text-xs text-muted">
              พิมพ์ <span className="font-semibold text-ink">{requireText}</span> เพื่อยืนยัน
            </label>
            <input
              autoFocus
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink outline-none focus:border-coral"
              onKeyDown={(e) => {
                if (e.key === "Enter" && matches) finish(true);
              }}
            />
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
