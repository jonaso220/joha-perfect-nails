"use client";

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold"></div>
    </div>
  );
}
