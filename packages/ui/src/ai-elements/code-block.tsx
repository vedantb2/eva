"use client";

import type { HTMLAttributes } from "react";
import { createContext, useContext, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../utils/cn";

interface CodeBlockContextValue {
  code: string;
}

const CodeBlockContext = createContext<CodeBlockContextValue | null>(null);

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language?: string;
};

export const CodeBlock = ({
  code,
  language,
  className,
  children,
  ...props
}: CodeBlockProps) => (
  <CodeBlockContext.Provider value={{ code }}>
    <div
      className={cn("relative rounded-lg bg-secondary", className)}
      {...props}
    >
      {children ?? (
        <pre className="overflow-x-auto p-3 text-xs">
          <code data-language={language}>{code}</code>
        </pre>
      )}
    </div>
  </CodeBlockContext.Provider>
);

export type CodeBlockCopyButtonProps = HTMLAttributes<HTMLButtonElement>;

export const CodeBlockCopyButton = ({
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const context = useContext(CodeBlockContext);
  if (!context) {
    throw new Error("CodeBlockCopyButton must be used within CodeBlock");
  }
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(context.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      className={cn(
        "absolute right-2 top-2 size-7 p-0 text-muted-foreground hover:text-foreground",
        className,
      )}
      size="sm"
      variant="ghost"
      onClick={handleCopy}
      {...props}
    >
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
      <span className="sr-only">Copy code</span>
    </Button>
  );
};
