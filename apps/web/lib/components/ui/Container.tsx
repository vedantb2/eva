interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <div className="flex-1 bg-muted/40 overflow-auto scrollbar">
      <div className="flex flex-col gap-3 md:gap-5 px-3 md:px-4 pt-3 md:pt-4 pb-5 md:pb-6 min-h-full">
        {children}
      </div>
    </div>
  );
}
