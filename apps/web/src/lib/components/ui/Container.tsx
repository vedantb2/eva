interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <div className="flex-1 overflow-auto scrollbar">
      <div className="mx-auto flex min-h-full w-full max-w-[1320px] flex-col gap-4 px-3 pb-8 pt-4 md:gap-6 md:px-5 md:pt-5 lg:px-6 lg:pt-6">
        {children}
      </div>
    </div>
  );
}
