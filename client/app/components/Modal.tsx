import React from "react";

interface ModalProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onClose: () => void;
}

export default function Modal({ children, isOpen, onClose }: ModalProps) {
  if (!isOpen && isOpen !== undefined) return null;

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 overflow-auto"
      onClick={onClose}
    >
      <div
        className="max-h-[95vh] max-w-[95vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
