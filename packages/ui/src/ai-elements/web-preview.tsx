"use client";

import type { ComponentProps, ReactNode } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../utils/cn";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export interface WebPreviewContextValue {
  url: string;
  setUrl: (url: string) => void;
}

const WebPreviewContext = createContext<WebPreviewContextValue | null>(null);

const useWebPreview = () => {
  const context = useContext(WebPreviewContext);
  if (!context) {
    throw new Error("WebPreview components must be used within a WebPreview");
  }
  return context;
};

export type WebPreviewProps = ComponentProps<"div"> & {
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
};

export const WebPreview = ({
  className,
  children,
  defaultUrl = "",
  onUrlChange,
  ...props
}: WebPreviewProps) => {
  const [url, setUrl] = useState(defaultUrl);

  const handleUrlChange = useCallback(
    (newUrl: string) => {
      setUrl(newUrl);
      onUrlChange?.(newUrl);
    },
    [onUrlChange],
  );

  const contextValue = useMemo<WebPreviewContextValue>(
    () => ({
      setUrl: handleUrlChange,
      url,
    }),
    [handleUrlChange, url],
  );

  return (
    <WebPreviewContext.Provider value={contextValue}>
      <div
        className={cn(
          "flex size-full flex-col rounded-lg border bg-card",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </WebPreviewContext.Provider>
  );
};

export type WebPreviewNavigationProps = ComponentProps<"div">;

export const WebPreviewNavigation = ({
  className,
  children,
  ...props
}: WebPreviewNavigationProps) => (
  <div
    className={cn("flex items-center gap-1 border-b p-2", className)}
    {...props}
  >
    {children}
  </div>
);

export type WebPreviewNavigationButtonProps = ComponentProps<typeof Button> & {
  tooltip?: string;
};

export const WebPreviewNavigationButton = ({
  onClick,
  disabled,
  tooltip,
  children,
  ...props
}: WebPreviewNavigationButtonProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="h-8 w-8 p-0 hover:text-foreground"
          disabled={disabled}
          onClick={onClick}
          size="sm"
          variant="ghost"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export type WebPreviewUrlProps = ComponentProps<typeof Input>;

export const WebPreviewUrl = ({
  value,
  onChange,
  onKeyDown,
  ...props
}: WebPreviewUrlProps) => {
  const { url, setUrl } = useWebPreview();
  const [prevUrl, setPrevUrl] = useState(url);
  const [inputValue, setInputValue] = useState(url);

  if (url !== prevUrl) {
    setPrevUrl(url);
    setInputValue(url);
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    onChange?.(event);
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        const target = event.target as HTMLInputElement;
        setUrl(target.value);
      }
      onKeyDown?.(event);
    },
    [setUrl, onKeyDown],
  );

  return (
    <Input
      className="h-8 flex-1 text-sm"
      onChange={onChange ?? handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Enter URL..."
      value={value ?? inputValue}
      {...props}
    />
  );
};

export type WebPreviewBodyProps = Omit<ComponentProps<"iframe">, "loading"> & {
  loading?: ReactNode;
};

export const WebPreviewBody = ({
  className,
  loading,
  src,
  ...props
}: WebPreviewBodyProps) => {
  const { url } = useWebPreview();

  return (
    <div className="flex-1">
      <iframe
        className={cn("size-full", className)}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        src={(src ?? url) || undefined}
        title="Preview"
        {...props}
      />
      {loading}
    </div>
  );
};

export type WebPreviewConsoleProps = ComponentProps<"div"> & {
  logs?: {
    level: "log" | "warn" | "error";
    message: string;
    timestamp: Date;
  }[];
  terminal?: ReactNode;
};

export const WebPreviewConsole = ({
  className,
  logs = [],
  terminal,
  children,
  ...props
}: WebPreviewConsoleProps) => {
  const [activeTab, setActiveTab] = useState<"console" | "terminal">(
    terminal ? "terminal" : "console",
  );

  return (
    <div className={cn("border-t bg-muted/50 text-sm", className)} {...props}>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "console" | "terminal")}
        className="h-full flex flex-col"
      >
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-2 h-9">
          <TabsTrigger value="console" className="text-xs px-3 rounded-none">
            Console
          </TabsTrigger>
          {terminal && (
            <TabsTrigger value="terminal" className="text-xs px-3 rounded-none">
              Terminal
            </TabsTrigger>
          )}
        </TabsList>
        <div className="flex-1 min-h-0">
          {activeTab === "console" ? (
            <div className="min-h-32 max-h-48 space-y-1 overflow-y-auto px-4 py-3 font-mono">
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  No console output
                </p>
              ) : (
                logs.map((log, index) => (
                  <div
                    className={cn(
                      "text-xs",
                      log.level === "error" && "text-destructive",
                      log.level === "warn" && "text-yellow-600",
                      log.level === "log" && "text-foreground",
                    )}
                    key={`${log.timestamp.getTime()}-${index}`}
                  >
                    <span className="text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>{" "}
                    {log.message}
                  </div>
                ))
              )}
              {children}
            </div>
          ) : (
            <div className="min-h-32 h-64">{terminal}</div>
          )}
        </div>
      </Tabs>
    </div>
  );
};
