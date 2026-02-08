interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <div className="flex-1 bg-secondary/50 overflow-auto scrollbar">
      <div className="flex flex-col gap-4 md:gap-6 px-2 md:px-4 pt-2 md:pt-4 pb-6 md:pb-8 min-h-full">
        {children}
      </div>
    </div>
  );
}
