"use client";

import { PawIcon } from "@/components/CatIcon";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-cat-cream flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-cat-orange/20 max-w-md w-full text-center space-y-4">
        <div className="bg-cat-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
          <PawIcon className="w-8 h-8 text-cat-orange" />
        </div>
        <h2 className="text-xl font-bold text-cat-dark">Something went wrong!</h2>
        <p className="text-gray-500 text-sm">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="bg-cat-orange hover:bg-cat-brown text-white font-bold py-3 px-6 rounded-xl shadow-md transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
