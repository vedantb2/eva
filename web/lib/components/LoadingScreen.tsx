export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-lg p-6 flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-t-[#e50a54] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
}
