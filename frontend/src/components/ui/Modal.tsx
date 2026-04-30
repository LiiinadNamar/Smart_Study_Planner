import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Content */}
      <div
        className={`relative w-full ${sizes[size]} glass-strong rounded-2xl p-6 animate-fade-in`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-surface-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
