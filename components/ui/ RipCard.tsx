import { ReactNode } from "react";

interface RipCardProps {
  children: ReactNode;
  className?: string;
}

export default function RipCard({ children, className = "" }: RipCardProps) {
  return (
    <div className={`rip-card ${className}`}>
      <div className="rip-edge"></div>
      {children}
    </div>
  );
}
