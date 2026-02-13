interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <div className="flex-1 overflow-auto bg-background scrollbar">
      <div className="mx-auto flex min-h-full max-w-[1280px] flex-col gap-4 px-3 pb-8 pt-4 md:gap-6 md:px-5 md:pt-5">
        {children}
      </div>
    </div>
  );
}
