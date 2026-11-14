import React, { useEffect, useRef } from 'react';

interface NativeDialogProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  lightDismiss?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const NativeDialog: React.FC<NativeDialogProps> = ({
  open,
  onClose,
  labelledBy,
  lightDismiss = true,
  className = '',
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
      dialog.returnValue = '';
      onClose();
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !lightDismiss) return;
    if ('closedBy' in HTMLDialogElement.prototype) return;

    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e) && dialog.open) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', onPointerDown);
    dialog.addEventListener('pointerup', onPointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('pointerup', onPointerUp);
    };
  }, [lightDismiss]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      {...({ closedby: lightDismiss ? 'any' : 'closerequest' } as Record<string, string>)}
      className={`w-full rounded-2xl border border-cyan-500/35 bg-[#080f21] text-slate-100 shadow-2xl shadow-cyan-950/50 ${className}`}
    >
      {open ? children : null}
    </dialog>
  );
};
