import { Suspense } from "react";
import { SuccessPageContent } from "./success-content";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="inline-block animate-spin mb-4">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-teal-500 rounded-full"></div>
            </div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
