import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  onClick,
}) => {
  return (
    <div
      className={`
        glass rounded-2xl p-6
        ${hover ? "hover:-translate-y-1 hover:border-primary-500/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] cursor-pointer transition-all duration-300" : "transition-all duration-300"}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
