export default function Loading() {
  return (
    <div className="min-h-screen bg-cat-cream font-sans">
      <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="h-8 w-40 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm h-28 animate-pulse" />
          <div className="bg-white p-5 rounded-3xl shadow-sm h-28 animate-pulse" />
        </div>
        <div className="bg-gray-200 rounded-3xl h-20 animate-pulse" />
        <div className="bg-white rounded-2xl h-14 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
