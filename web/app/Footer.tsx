export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="backdrop-blur-xl border-t border-neutral-200 dark:border-white/10 p-4">
      <div className="container px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗣️</span>
            <span className="text-neutral-500 dark:text-white/40 text-sm font-medium">
              Vello - Learn Marathi
            </span>
          </div>
          <div className="text-neutral-500 dark:text-white/40 text-sm">
            © {year} शिका. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
