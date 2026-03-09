'use client';

import { ReactNode } from 'react';

interface SectionShellProps {
  children: ReactNode;
  className?: string;
}

export default function SectionShell({ children, className = '' }: SectionShellProps) {
  return <div className={`w-full max-w-2xl mx-auto px-5 sm:px-6 ${className}`.trim()}>{children}</div>;
}
