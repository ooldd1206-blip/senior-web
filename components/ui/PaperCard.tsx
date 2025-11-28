import { ReactNode } from "react";

interface PaperCardProps {
  children: ReactNode;
  className?: string;
}

export default function PaperCard({ children, className = "" }: PaperCardProps) {
  return (
    <div className={`bg-grid p-6 rounded-xl shadow-md ${className}`}>
      {children}
    </div>
  );
}
