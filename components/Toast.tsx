'use client';

interface ToastProps {
  message: string;
}

export default function Toast({ message }: ToastProps) {
  return (
    <div className="fixed top-5 left-1/2 z-[120] -translate-x-1/2 px-4">
      <div className="rounded-full bg-[#191F28] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}
