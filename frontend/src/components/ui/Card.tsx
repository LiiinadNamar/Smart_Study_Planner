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
        ${hover ? "hover:-translate-y-0.5 hover:border-primary-500/25 hover:bg-surface-850 cursor-pointer transition-all duration-300" : "transition-all duration-300"}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
