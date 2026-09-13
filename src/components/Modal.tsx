import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useEscapeToClose } from "../hooks/useEscapeToClose";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  panelClassName: string;
  children: ReactNode;
};

// Shared modal shell: overlay layer, Escape-to-close, ARIA dialog role, and a
// consistent close button. Each modal just supplies its panel class + content.
export function Modal({
  open,
  onClose,
  label,
  panelClassName,
  children,
}: ModalProps) {
  const container = useRef<HTMLDivElement>(null);
  useEscapeToClose(open, onClose);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        container.current?.querySelectorAll<HTMLElement>(
          'button, a[href], select, input, [tabindex="0"]',
        ) ?? [],
      );
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = scroll;
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      ref={container}
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={panelClassName}>
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
