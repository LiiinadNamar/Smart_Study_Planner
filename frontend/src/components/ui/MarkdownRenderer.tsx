import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-bold text-surface-100 mb-3">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold text-surface-100 mt-4 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold text-surface-100 mt-3 mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-3">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="text-surface-300">{children}</li>,
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary-300 hover:text-primary-200 underline">
      {children}
    </a>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="px-1.5 py-0.5 rounded bg-surface-800/60 border border-surface-700 text-surface-100">
      {children}
    </code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="p-3 rounded-xl bg-surface-900/40 border border-surface-700 overflow-x-auto mb-3">
      {children}
    </pre>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-surface-600 pl-3 text-surface-400 italic mb-3">
      {children}
    </blockquote>
  ),
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const containerClassName = ["text-surface-300 text-sm leading-relaxed", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
};
